-- Add thumbnail_url column to courses table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='courses' AND column_name='thumbnail_url') THEN
        ALTER TABLE public.courses ADD COLUMN thumbnail_url TEXT DEFAULT null;
    END IF;
END $$;
