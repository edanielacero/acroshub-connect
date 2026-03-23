-- =============================================
-- SISTEMA DE INVITACIONES DE ALUMNOS
-- Ejecutar en el SQL Editor de Supabase
-- =============================================

-- 1. Agregar columna email a profiles y actualizar trigger
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending'));

-- Actualizar función de trigger para ser resiliente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'alumno')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  
  -- Try to update email and status if those columns exist
  BEGIN
    UPDATE public.profiles 
    SET email = NEW.email,
        status = COALESCE(NEW.raw_user_meta_data->>'status', 'active')
    WHERE id = NEW.id;
  EXCEPTION WHEN undefined_column THEN
    NULL; -- Columns don't exist yet, skip
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sincronizar emails existentes (opcional si ya hay usuarios)
UPDATE public.profiles p 
SET email = u.email 
FROM auth.users u 
WHERE p.id = u.id AND p.email IS NULL;

-- 2. RPC para buscar ID por email (más seguro que select directo si hay muchas filas)
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input TEXT)
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE email = email_input LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Crear tabla invitations
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  profesor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alumno_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Se llena al aceptar
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  product_id UUID,
  product_type TEXT CHECK (product_type IN ('course', 'ebook')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT invitations_email_profesor_unique UNIQUE (email, profesor_id)
);

-- 4. RPC para aceptar invitación atómicamente
-- Esta función la llama el cliente después de que el usuario ya existe en Supabase Auth
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
  VALUES (user_id, inv_record.name, inv_record.email, 'alumno', 'active')
  ON CONFLICT (id) DO UPDATE SET 
    status = 'active',
    full_name = COALESCE(public.profiles.full_name, inv_record.name);

  -- 3. Crear enrollment (si hay producto)
  IF inv_record.product_id IS NOT NULL THEN
    INSERT INTO public.enrollments (alumno_id, product_id, product_type, access_type, status)
    VALUES (user_id, inv_record.product_id, inv_record.product_type, 'lifetime', 'active')
    ON CONFLICT (alumno_id, product_id) DO NOTHING;
  END IF;

  -- 4. Marcar invitación como aceptada
  UPDATE public.invitations 
  SET status = 'accepted', accepted_at = NOW(), alumno_id = user_id
  WHERE id = inv_record.id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_profesor ON public.invitations(profesor_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- 3. RLS para invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Profesor ve sus propias invitaciones
DROP POLICY IF EXISTS "Profesor sees own invitations" ON public.invitations;
CREATE POLICY "Profesor sees own invitations" ON public.invitations
  FOR SELECT USING (profesor_id = auth.uid());

DROP POLICY IF EXISTS "Profesor inserts invitations" ON public.invitations;
CREATE POLICY "Profesor inserts invitations" ON public.invitations
  FOR INSERT WITH CHECK (profesor_id = auth.uid());

DROP POLICY IF EXISTS "Profesor updates invitations" ON public.invitations;
CREATE POLICY "Profesor updates invitations" ON public.invitations
  FOR UPDATE USING (profesor_id = auth.uid());

CREATE POLICY "Profesor deletes invitations" ON public.invitations
  FOR DELETE USING (profesor_id = auth.uid() AND status = 'pending');


-- Acceso público por token (para que el alumno pueda activar su cuenta)
DROP POLICY IF EXISTS "Public token access" ON public.invitations;
CREATE POLICY "Public token access" ON public.invitations
  FOR SELECT USING (true);

-- 4. RLS para enrollments — agregar políticas de INSERT/DELETE para profesores
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Enrollments Read" ON public.enrollments;
CREATE POLICY "Public Enrollments Read" ON public.enrollments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enrollments Insert" ON public.enrollments;
CREATE POLICY "Enrollments Insert" ON public.enrollments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enrollments Update" ON public.enrollments;
CREATE POLICY "Enrollments Update" ON public.enrollments FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enrollments Delete" ON public.enrollments;
CREATE POLICY "Enrollments Delete" ON public.enrollments FOR DELETE USING (true);
