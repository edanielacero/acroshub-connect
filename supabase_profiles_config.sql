-- ==========================================
-- Nuevas columnas en Profiles para Configuración del Profesor
-- Ejecutar en el SQL Editor de Supabase (junto con supabase_rls_modules.sql)
-- ==========================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manual_payment_link TEXT;
