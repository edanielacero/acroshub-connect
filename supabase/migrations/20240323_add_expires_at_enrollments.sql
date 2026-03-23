-- Add expires_at column to enrollments to track subscription expirations
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE NULL;
