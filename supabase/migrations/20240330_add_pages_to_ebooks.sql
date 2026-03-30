-- Add pages column to ebooks table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ebooks' AND column_name='pages') THEN
        ALTER TABLE public.ebooks ADD COLUMN pages INTEGER DEFAULT null;
    END IF;
END $$;
