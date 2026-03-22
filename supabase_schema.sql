-- ==========================================
-- ACROSHUB CORE SCHEMA
-- ==========================================

-- 1. Tabla de Usuarios Extendida (Profiles)
-- Esta tabla aloja los nombres y roles de los usuarios registrados en Auth
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('super_admin', 'profesor', 'alumno')) DEFAULT 'alumno',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger automatizado: Cuando alguien se registre, copiar sus datos a Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'alumno')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Academias (Hubs)
CREATE TABLE public.hubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profesor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  primary_color TEXT DEFAULT 'hsl(221.2 83.2% 53.3%)',
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Cursos
CREATE TABLE public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hub_id UUID REFERENCES public.hubs(id) ON DELETE CASCADE NOT NULL,
  profesor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. E-books
CREATE TABLE public.ebooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hub_id UUID REFERENCES public.hubs(id) ON DELETE CASCADE NOT NULL,
  profesor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  pdf_url TEXT,
  author TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Opciones de Precio Polimórficas (Maneja subscripciones mensuales o lifetime)
CREATE TABLE public.pricing_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL, 
  product_type TEXT CHECK (product_type IN ('course', 'ebook')),
  type TEXT CHECK (type IN ('one-time', 'monthly', 'annual')),
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD'
);

-- 6. Módulos y Clases de Video
CREATE TABLE public.modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

CREATE TABLE public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT,
  duration TEXT,
  is_free_preview BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL
);

-- 7. Matriculaciones / Compras (Enrollments)
CREATE TABLE public.enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alumno_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID NOT NULL,
  product_type TEXT CHECK (product_type IN ('course', 'ebook')),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due')) DEFAULT 'active',
  access_type TEXT CHECK (access_type IN ('lifetime', 'subscription')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) BASIS
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

-- Políticas Públicas Basales:
-- Los perfiles son públicos (para que el profe vea nombres de alumnos)
CREATE POLICY "Public Profiles" ON public.profiles FOR SELECT USING (true);
-- Los Hubs y productos publicados son visibles para el mundo
CREATE POLICY "Public Hubs" ON public.hubs FOR SELECT USING (true);
CREATE POLICY "Public Courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Public Ebooks" ON public.ebooks FOR SELECT USING (true);

-- Políticas Privadas (Profesores controlan sus propios datos):
CREATE POLICY "Profesores cursan sus hubs" ON public.hubs USING (auth.uid() = profesor_id);
CREATE POLICY "Profesores cursan sus courses" ON public.courses USING (auth.uid() = profesor_id);
CREATE POLICY "Profesores cursan sus ebooks" ON public.ebooks USING (auth.uid() = profesor_id);
