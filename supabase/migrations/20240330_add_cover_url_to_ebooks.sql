-- Add cover_url column to ebooks table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ebooks' AND column_name='cover_url') THEN
        ALTER TABLE public.ebooks ADD COLUMN cover_url TEXT DEFAULT null;
    END IF;
END $$;
