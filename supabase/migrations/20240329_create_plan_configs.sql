-- =============================================
-- Table: plan_configs
-- Stores the platform plan configuration (prices, limits)
-- =============================================

CREATE TABLE IF NOT EXISTS plan_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) DEFAULT 0,
  price_annual NUMERIC(10, 2) DEFAULT 0,
  max_hubs INTEGER DEFAULT 1,
  max_students INTEGER DEFAULT 50,
  max_courses INTEGER DEFAULT 3,
  max_lessons_per_course INTEGER DEFAULT 10,
  max_ebooks INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default plans
INSERT INTO plan_configs (key, name, price, price_annual, max_hubs, max_students, max_courses, max_lessons_per_course, max_ebooks) VALUES
  ('gratis', 'Gratis', 0, 0, 1, 50, 3, 10, 1),
  ('basico', 'Básico', 29, 290, 2, 200, 10, 30, 5),
  ('pro', 'Pro', 99, 990, 5, 1000, 50, 100, 20),
  ('enterprise', 'Enterprise', 299, 2990, -1, -1, -1, -1, -1)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE plan_configs ENABLE ROW LEVEL SECURITY;

-- Everyone can read plans
CREATE POLICY "Anyone can read plan_configs"
  ON plan_configs FOR SELECT
  USING (true);

-- Only super admin can update
CREATE POLICY "Super admin can update plan_configs"
  ON plan_configs FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );
