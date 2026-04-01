-- ==========================================
-- MIGRATION: MAGIC CODES + ALUMNOS TRANSACTIONS RLS
-- ==========================================

-- ==========================================
-- 1. TABLA: magic_codes
-- ==========================================
CREATE TABLE IF NOT EXISTS public.magic_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('course', 'ebook')),
  code VARCHAR(6) NOT NULL UNIQUE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('one-time', 'monthly', 'annual', 'free')),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used')),
  
  -- Auditoría de uso
  used_by_alumno_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_magic_codes_product ON magic_codes(product_id, status);
CREATE INDEX IF NOT EXISTS idx_magic_codes_code_available ON magic_codes(code) WHERE status = 'available';

-- RLS
ALTER TABLE public.magic_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profesores gestionan sus propios códigos" ON public.magic_codes;
CREATE POLICY "Profesores gestionan sus propios códigos" ON public.magic_codes
  FOR ALL
  USING (auth.uid() = profesor_id);

-- ==========================================
-- 2. FUNCIÓN: Generar código único de 6 caracteres
-- ==========================================
CREATE OR REPLACE FUNCTION generate_magic_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result VARCHAR(6) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. FUNCIÓN: Asegurar pool de 5 códigos por combo
-- ==========================================
CREATE OR REPLACE FUNCTION ensure_magic_codes_pool(
  p_profesor_id UUID,
  p_product_id UUID,
  p_product_type TEXT,
  p_payment_type TEXT,
  p_amount NUMERIC,
  p_currency TEXT
)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
  codes_needed INTEGER;
  new_code VARCHAR(6);
  i INTEGER;
  codes_generated INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM public.magic_codes
  WHERE product_id = p_product_id
    AND payment_type = p_payment_type
    AND status = 'available';
  
  codes_needed := 5 - current_count;
  
  FOR i IN 1..codes_needed LOOP
    LOOP
      new_code := generate_magic_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.magic_codes WHERE code = new_code);
    END LOOP;
    
    INSERT INTO public.magic_codes (profesor_id, product_id, product_type, code, payment_type, amount, currency, status)
    VALUES (p_profesor_id, p_product_id, p_product_type, new_code, p_payment_type, p_amount, p_currency, 'available');
    
    codes_generated := codes_generated + 1;
  END LOOP;
  
  RETURN codes_generated;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. RPC: Obtener o crear códigos mágicos para un producto
-- ==========================================
CREATE OR REPLACE FUNCTION get_or_create_magic_codes(p_profesor_id UUID, p_product_id UUID, p_product_type TEXT)
RETURNS JSONB AS $$
DECLARE
  pricing_record RECORD;
  result JSONB;
BEGIN
  IF p_product_type = 'course' THEN
    IF NOT EXISTS (SELECT 1 FROM public.courses WHERE id = p_product_id AND profesor_id = p_profesor_id) THEN
      RAISE EXCEPTION 'Curso no encontrado o no pertenece al profesor';
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.ebooks WHERE id = p_product_id AND profesor_id = p_profesor_id) THEN
      RAISE EXCEPTION 'Ebook no encontrado o no pertenece al profesor';
    END IF;
  END IF;

  FOR pricing_record IN (SELECT type, price, currency FROM public.pricing_options WHERE product_id = p_product_id)
  LOOP
    PERFORM ensure_magic_codes_pool(p_profesor_id, p_product_id, p_product_type, pricing_record.type, pricing_record.price, pricing_record.currency);
  END LOOP;

  SELECT jsonb_build_object(
    'one_time', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'code', code, 'amount', amount, 'currency', currency)), '[]'::jsonb)
      FROM public.magic_codes 
      WHERE product_id = p_product_id AND payment_type = 'one-time' AND status = 'available'
    ),
    'monthly', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'code', code, 'amount', amount, 'currency', currency)), '[]'::jsonb)
      FROM public.magic_codes 
      WHERE product_id = p_product_id AND payment_type = 'monthly' AND status = 'available'
    ),
    'annual', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'code', code, 'amount', amount, 'currency', currency)), '[]'::jsonb)
      FROM public.magic_codes 
      WHERE product_id = p_product_id AND payment_type = 'annual' AND status = 'available'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. RPC: Regenerar códigos
-- ==========================================
CREATE OR REPLACE FUNCTION regenerate_magic_codes(p_profesor_id UUID, p_product_id UUID, p_product_type TEXT, p_payment_type TEXT)
RETURNS JSONB AS $$
DECLARE
  pricing_record RECORD;
BEGIN
  IF p_product_type = 'course' THEN
    IF NOT EXISTS (SELECT 1 FROM public.courses WHERE id = p_product_id AND profesor_id = p_profesor_id) THEN
      RAISE EXCEPTION 'No autorizado';
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.ebooks WHERE id = p_product_id AND profesor_id = p_profesor_id) THEN
      RAISE EXCEPTION 'No autorizado';
    END IF;
  END IF;

  DELETE FROM public.magic_codes
  WHERE product_id = p_product_id AND payment_type = p_payment_type AND status = 'available';

  SELECT price, currency INTO pricing_record FROM public.pricing_options WHERE product_id = p_product_id AND type = p_payment_type LIMIT 1;

  IF FOUND THEN
    PERFORM ensure_magic_codes_pool(p_profesor_id, p_product_id, p_product_type, p_payment_type, pricing_record.price, pricing_record.currency);
  END IF;

  RETURN get_or_create_magic_codes(p_profesor_id, p_product_id, p_product_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. RPC: Alumno usa el código mágico
-- ==========================================
CREATE OR REPLACE FUNCTION use_magic_code(p_code TEXT, p_alumno_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_clean_code VARCHAR(6);
  v_magic_code RECORD;
  v_enrollment_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_product_title TEXT;
  v_hub_slug TEXT;
  v_access_type TEXT;
BEGIN
  v_clean_code := UPPER(REPLACE(p_code, '-', ''));
  v_clean_code := REPLACE(v_clean_code, ' ', '');
  
  IF LENGTH(v_clean_code) != 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'El código debe tener exactamente 6 caracteres');
  END IF;
  
  SELECT mc.* 
  INTO v_magic_code
  FROM public.magic_codes mc
  WHERE mc.code = v_clean_code AND mc.status = 'available'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'El código no existe, es inválido o ya ha sido utilizado por otro usuario');
  END IF;
  
  IF v_magic_code.product_type = 'course' THEN
    SELECT c.title, h.slug INTO v_product_title, v_hub_slug 
    FROM public.courses c 
    JOIN public.hubs h ON c.hub_id = h.id 
    WHERE c.id = v_magic_code.product_id;
  ELSE
    SELECT e.title, h.slug INTO v_product_title, v_hub_slug 
    FROM public.ebooks e 
    JOIN public.hubs h ON e.hub_id = h.id 
    WHERE e.id = v_magic_code.product_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE alumno_id = p_alumno_id AND product_id = v_magic_code.product_id AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya tienes acceso activo a este producto en tu panel.');
  END IF;
  
  IF v_magic_code.payment_type = 'monthly' THEN
    v_access_type := 'subscription';
    v_expires_at := NOW() + INTERVAL '1 month';
  ELSIF v_magic_code.payment_type = 'annual' THEN
    v_access_type := 'subscription';
    v_expires_at := NOW() + INTERVAL '1 year';
  ELSE
    v_access_type := 'lifetime';
    v_expires_at := NULL;
  END IF;
  
  INSERT INTO public.enrollments (alumno_id, product_id, product_type, access_type, status, expires_at)
  VALUES (p_alumno_id, v_magic_code.product_id, v_magic_code.product_type, v_access_type, 'active', v_expires_at)
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO v_enrollment_id;
  
  -- INSERTAR TRANSACCIÓN (esto es lo que aparece en Ventas del profesor)
  INSERT INTO public.transactions (alumno_id, product_id, product_type, amount, currency, method, notes)
  VALUES (
    p_alumno_id, 
    v_magic_code.product_id, 
    v_magic_code.product_type, 
    v_magic_code.amount, 
    v_magic_code.currency, 
    'magic_code', 
    'Activado con código mágico: ' || v_clean_code
  );
  
  UPDATE public.magic_codes
  SET status = 'used', 
      used_by_alumno_id = p_alumno_id, 
      used_at = NOW(), 
      enrollment_id = v_enrollment_id
  WHERE id = v_magic_code.id;
  
  PERFORM ensure_magic_codes_pool(
    v_magic_code.profesor_id, 
    v_magic_code.product_id, 
    v_magic_code.product_type, 
    v_magic_code.payment_type, 
    v_magic_code.amount, 
    v_magic_code.currency
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'product_title', v_product_title,
    'product_type', v_magic_code.product_type,
    'payment_type', v_magic_code.payment_type,
    'hub_slug', v_hub_slug
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 7. RLS FALTANTE: Alumnos pueden leer sus propias transacciones
-- ==========================================
DROP POLICY IF EXISTS "Alumnos read own transactions" ON public.transactions;
CREATE POLICY "Alumnos read own transactions" ON public.transactions
  FOR SELECT
  USING (auth.uid() = alumno_id);
