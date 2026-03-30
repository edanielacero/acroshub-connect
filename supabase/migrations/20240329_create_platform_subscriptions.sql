-- =============================================
-- Table: platform_subscriptions
-- Stores subscription payments/changes made by professors to the platform
-- =============================================

CREATE TABLE IF NOT EXISTS platform_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('first_payment', 'renewal', 'upgrade', 'downgrade')),
  plan_from TEXT,
  plan_to TEXT NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('mensual', 'anual')),
  amount NUMERIC(10, 2) DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'manual' CHECK (method IN ('manual', 'stripe')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE platform_subscriptions ENABLE ROW LEVEL SECURITY;

-- Super admin can do everything
CREATE POLICY "Super admin full access on platform_subscriptions"
  ON platform_subscriptions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
  );

-- Professors can read their own subscriptions
CREATE POLICY "Professors can view own subscriptions"
  ON platform_subscriptions FOR SELECT
  USING (tenant_id = auth.uid());
