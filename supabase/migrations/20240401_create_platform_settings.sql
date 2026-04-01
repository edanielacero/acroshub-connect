-- Migration to create platform_settings table for global superadmin configurations

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Inserción del link de compra manual por defecto
INSERT INTO public.platform_settings (key, value) VALUES ('manual_plan_link', '') ON CONFLICT (key) DO NOTHING;

-- RLS policies
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read platform_settings
CREATE POLICY "Anyone can read platform_settings"
  ON public.platform_settings FOR SELECT
  USING (true);

-- Only super admin can update
CREATE POLICY "Super admin can update platform settings"
  ON public.platform_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );
