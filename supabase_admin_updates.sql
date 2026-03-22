-- Run this in your Supabase SQL Editor to update the profiles table
-- so it can store the CRM data shown in the Superadmin Dashboard.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'activo' CHECK (status IN ('activo', 'suspendido', 'gratis'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'gratis' CHECK (plan IN ('gratis', 'basico', 'pro', 'enterprise'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'mensual' CHECK (billing_cycle IN ('mensual', 'anual'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS scheduled_downgrade_plan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_connected BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
