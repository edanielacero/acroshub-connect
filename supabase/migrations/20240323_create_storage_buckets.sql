-- Añadir columna de attachments (array de objetos JSON) a lessons
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Crear Buckets si no existen
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('ebooks', 'ebooks', true),
  ('courses', 'courses', true)
ON CONFLICT (id) DO NOTHING;

-- Dar permisos públicos para leer archivos en ebooks
CREATE POLICY "Obtener PDFs publicamente" ON storage.objects FOR SELECT USING ( bucket_id = 'ebooks' );

-- Dar permisos autenticados para subir PDFs a ebooks
CREATE POLICY "Subir PDFs profesores" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'ebooks' );

-- Dar permisos para borrar PDFs a profesores
CREATE POLICY "Borrar PDFs profesores" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'ebooks' );

-- Dar permisos para actualizar PDFs a profesores
CREATE POLICY "Actualizar PDFs profesores" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'ebooks' );

-- Dar permisos públicos para leer archivos en courses
CREATE POLICY "Obtener archivos publicamente courses" ON storage.objects FOR SELECT USING ( bucket_id = 'courses' );

-- Dar permisos autenticados para subir a courses
CREATE POLICY "Subir archivos courses" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'courses' );

-- Dar permisos para borrar archivos courses
CREATE POLICY "Borrar archivos courses" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'courses' );

-- Dar permisos para actualizar archivos courses
CREATE POLICY "Actualizar archivos courses" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'courses' );
