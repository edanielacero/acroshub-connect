-- ==========================================
-- UPDATE INVITATIONS AND RPC FOR TRANSACTIONS
-- ==========================================

-- 1. Add columns to invitations
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2);
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- 2. Update accept_invitation RPC
CREATE OR REPLACE FUNCTION accept_invitation(token_input TEXT, user_id UUID)
RETURNS JSONB AS $$
DECLARE
  inv_record RECORD;
BEGIN
  -- 1. Buscar y validar invitación
  SELECT * FROM public.invitations 
  WHERE token = token_input AND status = 'pending' AND expires_at > NOW()
  INTO inv_record;

  IF inv_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitación no válida o expirada');
  END IF;

  -- 2. Crear/Actualizar perfil (si no existe)
  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (user_id, inv_record.name, inv_record.email, 'alumno', 'activo')
  ON CONFLICT (id) DO UPDATE SET 
    status = 'activo',
    full_name = COALESCE(public.profiles.full_name, inv_record.name);

  -- 3. Crear enrollment (si hay producto)
  IF inv_record.product_id IS NOT NULL THEN
    INSERT INTO public.enrollments (alumno_id, product_id, product_type, access_type, status)
    VALUES (user_id, inv_record.product_id, inv_record.product_type, COALESCE(inv_record.access_type, 'lifetime'), 'active')
    ON CONFLICT (alumno_id, product_id) DO NOTHING;
    
    -- 3b. Record Transaction
    IF inv_record.amount IS NOT NULL AND inv_record.amount > 0 THEN
      INSERT INTO public.transactions (alumno_id, product_id, product_type, amount, currency, method, notes)
      VALUES (user_id, inv_record.product_id, inv_record.product_type, inv_record.amount, inv_record.currency, 'manual', 'Registro via invitación');
    END IF;
  END IF;

  -- 4. Marcar invitación como aceptada
  UPDATE public.invitations 
  SET status = 'accepted', accepted_at = NOW(), alumno_id = user_id
  WHERE id = inv_record.id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
