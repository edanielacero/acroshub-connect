-- Asegurar columnas en la tabla hubs
ALTER TABLE public.hubs 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Crear Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hubs', 'hubs', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para el bucket hubs
CREATE POLICY "Lectura publica hubs" ON storage.objects FOR SELECT USING ( bucket_id = 'hubs' );
CREATE POLICY "Subida hubs" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'hubs' );
CREATE POLICY "Borrado hubs" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'hubs' );
CREATE POLICY "Actualizacion hubs" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'hubs' );
