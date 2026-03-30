-- Migration: Fix super_admin RLS policies on profiles table
-- This version is ultra-clean to avoid syntax errors in the Supabase editor.

-- 1. DROP old policies first to clear the state
DROP POLICY IF EXISTS super_admin_select_profiles ON public.profiles;
DROP POLICY IF EXISTS super_admin_update_profiles ON public.profiles;
DROP POLICY IF EXISTS super_admin_insert_profiles ON public.profiles;

-- 2. CREATE or REPLACE the helper function (SECURITY DEFINER is key here)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$;

-- 3. RECREATE policies using the helper function
CREATE POLICY super_admin_select_profiles ON public.profiles
  FOR SELECT USING ( public.is_super_admin() );

CREATE POLICY super_admin_update_profiles ON public.profiles
  FOR UPDATE USING ( public.is_super_admin() );

CREATE POLICY super_admin_insert_profiles ON public.profiles
  FOR INSERT WITH CHECK ( public.is_super_admin() );
