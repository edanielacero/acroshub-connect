-- ==========================================
-- COMMENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Everyone can read comments
DROP POLICY IF EXISTS "Public comments read" ON public.comments;
CREATE POLICY "Public comments read" ON public.comments FOR SELECT USING (true);

-- Authenticated users can create comments
DROP POLICY IF EXISTS "Auth users create comments" ON public.comments;
CREATE POLICY "Auth users create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profesores can update is_read status for comments on their own lessons
DROP POLICY IF EXISTS "Profesores update comment status" ON public.comments;
CREATE POLICY "Profesores update comment status" ON public.comments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.lessons
    JOIN public.modules ON modules.id = lessons.module_id
    JOIN public.courses ON courses.id = modules.course_id
    WHERE lessons.id = comments.lesson_id AND courses.profesor_id = auth.uid()
  )
);
