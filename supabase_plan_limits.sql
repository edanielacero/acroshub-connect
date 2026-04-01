-- ==========================================
-- PLAN LIMITS ENFORCEMENT
-- ==========================================
-- Run this in your Supabase SQL Editor

-- 1. Create the plan_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.plan_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) DEFAULT 0,
  price_annual NUMERIC(10, 2) DEFAULT 0,
  max_hubs INTEGER DEFAULT 1,
  max_students INTEGER DEFAULT 30,
  max_courses INTEGER DEFAULT 3,
  max_lessons_per_course INTEGER DEFAULT 10,
  max_ebooks INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Seed default plan configs (matches the 'plan' values in profiles)
-- -1 means unlimited
INSERT INTO public.plan_configs (key, name, price, price_annual, max_hubs, max_students, max_courses, max_lessons_per_course, max_ebooks)
VALUES 
  ('gratis',    'Gratis',     0,   0,    1,  30,   3,  10,  1),
  ('basico',    'Básico',    29,  290,   3,  100, 10,  30,  5),
  ('pro',       'Pro',       79,  790,  10,  500, 30,  -1, 20),
  ('enterprise','Enterprise',199, 1990, -1,   -1, -1,  -1, -1)
ON CONFLICT (key) DO NOTHING;

-- 3. Enable RLS on plan_configs
ALTER TABLE public.plan_configs ENABLE ROW LEVEL SECURITY;

-- 4. Allow everyone to read plan_configs (needed so professors can check their own limits)
DROP POLICY IF EXISTS "Public plan_configs read" ON public.plan_configs;
CREATE POLICY "Public plan_configs read" ON public.plan_configs FOR SELECT USING (true);

-- 5. Only super_admin can modify plan_configs (via service role or direct SQL)
DROP POLICY IF EXISTS "Only admin can modify plan_configs" ON public.plan_configs;
CREATE POLICY "Only admin can modify plan_configs" ON public.plan_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ==========================================
-- PLATFORM COSTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.platform_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(10, 4) NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('per_gb_month', 'flat_month', 'per_profesor_month')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed: Bunny.net storage cost
INSERT INTO public.platform_costs (name, amount, unit, notes)
VALUES ('Bunny.net Storage', 0.03, 'per_gb_month', 'Costo mensual de almacenamiento de video y archivos en Bunny.net')
ON CONFLICT DO NOTHING;

-- RLS for platform_costs
ALTER TABLE public.platform_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only super_admin can manage costs" ON public.platform_costs;
CREATE POLICY "Only super_admin can manage costs" ON public.platform_costs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

