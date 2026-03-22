-- ==========================================
-- Quiz Questions Table + RLS
-- Ejecutar en el SQL Editor de Supabase
-- ==========================================

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_index INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Quiz Read" ON public.quiz_questions;
CREATE POLICY "Public Quiz Read" ON public.quiz_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profesor Quiz Insert" ON public.quiz_questions;
CREATE POLICY "Profesor Quiz Insert" ON public.quiz_questions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lessons
    JOIN public.modules ON modules.id = lessons.module_id
    JOIN public.courses ON courses.id = modules.course_id
    WHERE lessons.id = quiz_questions.lesson_id AND courses.profesor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Profesor Quiz Update" ON public.quiz_questions;
CREATE POLICY "Profesor Quiz Update" ON public.quiz_questions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.lessons
    JOIN public.modules ON modules.id = lessons.module_id
    JOIN public.courses ON courses.id = modules.course_id
    WHERE lessons.id = quiz_questions.lesson_id AND courses.profesor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Profesor Quiz Delete" ON public.quiz_questions;
CREATE POLICY "Profesor Quiz Delete" ON public.quiz_questions FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.lessons
    JOIN public.modules ON modules.id = lessons.module_id
    JOIN public.courses ON courses.id = modules.course_id
    WHERE lessons.id = quiz_questions.lesson_id AND courses.profesor_id = auth.uid()
  )
);
