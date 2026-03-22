-- ==========================================
-- SCRIPT COMPLETO - Elimina políticas duplicadas antes de crearlas
-- ==========================================

-- 1. Nuevas columnas en profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manual_payment_link TEXT;

-- 2. Política de UPDATE para profiles
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. Políticas para hubs
DROP POLICY IF EXISTS "Profesores insert hubs" ON public.hubs;
CREATE POLICY "Profesores insert hubs" ON public.hubs FOR INSERT WITH CHECK (auth.uid() = profesor_id);
DROP POLICY IF EXISTS "Profesores update hubs" ON public.hubs;
CREATE POLICY "Profesores update hubs" ON public.hubs FOR UPDATE USING (auth.uid() = profesor_id);

-- 4. Políticas para courses
DROP POLICY IF EXISTS "Profesores insert courses" ON public.courses;
CREATE POLICY "Profesores insert courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() = profesor_id);
DROP POLICY IF EXISTS "Profesores update courses" ON public.courses;
CREATE POLICY "Profesores update courses" ON public.courses FOR UPDATE USING (auth.uid() = profesor_id);

-- 5. Políticas para ebooks
DROP POLICY IF EXISTS "Profesores insert ebooks" ON public.ebooks;
CREATE POLICY "Profesores insert ebooks" ON public.ebooks FOR INSERT WITH CHECK (auth.uid() = profesor_id);
DROP POLICY IF EXISTS "Profesores update ebooks" ON public.ebooks;
CREATE POLICY "Profesores update ebooks" ON public.ebooks FOR UPDATE USING (auth.uid() = profesor_id);

-- 6. RLS para módulos
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Modules Read" ON public.modules;
CREATE POLICY "Public Modules Read" ON public.modules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Profesor Modules Write" ON public.modules;
CREATE POLICY "Profesor Modules Write" ON public.modules FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.profesor_id = auth.uid())
);
DROP POLICY IF EXISTS "Profesor Modules Update" ON public.modules;
CREATE POLICY "Profesor Modules Update" ON public.modules FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.profesor_id = auth.uid())
);
DROP POLICY IF EXISTS "Profesor Modules Delete" ON public.modules;
CREATE POLICY "Profesor Modules Delete" ON public.modules FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.profesor_id = auth.uid())
);

-- 7. RLS para lecciones
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Lessons Read" ON public.lessons;
CREATE POLICY "Public Lessons Read" ON public.lessons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Profesor Lessons Write" ON public.lessons;
CREATE POLICY "Profesor Lessons Write" ON public.lessons FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.modules 
    JOIN public.courses ON courses.id = modules.course_id 
    WHERE modules.id = lessons.module_id AND courses.profesor_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Profesor Lessons Update" ON public.lessons;
CREATE POLICY "Profesor Lessons Update" ON public.lessons FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.modules 
    JOIN public.courses ON courses.id = modules.course_id 
    WHERE modules.id = lessons.module_id AND courses.profesor_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Profesor Lessons Delete" ON public.lessons;
CREATE POLICY "Profesor Lessons Delete" ON public.lessons FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.modules 
    JOIN public.courses ON courses.id = modules.course_id 
    WHERE modules.id = lessons.module_id AND courses.profesor_id = auth.uid()
  )
);

-- 8. RLS para pricing_options
ALTER TABLE public.pricing_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Pricing Read" ON public.pricing_options;
CREATE POLICY "Public Pricing Read" ON public.pricing_options FOR SELECT USING (true);
DROP POLICY IF EXISTS "Pricing Insert" ON public.pricing_options;
CREATE POLICY "Pricing Insert" ON public.pricing_options FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Pricing Update" ON public.pricing_options;
CREATE POLICY "Pricing Update" ON public.pricing_options FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Pricing Delete" ON public.pricing_options;
CREATE POLICY "Pricing Delete" ON public.pricing_options FOR DELETE USING (true);
