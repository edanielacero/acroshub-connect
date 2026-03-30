-- ==========================================
-- LESSON PROGRESS & QUIZ SCORES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT true,
  quiz_score INT DEFAULT null,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- RLS
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress
DROP POLICY IF EXISTS "Users can read own progress" ON public.lesson_progress;
CREATE POLICY "Users can read own progress" ON public.lesson_progress 
FOR SELECT USING (auth.uid() = user_id);

-- Profesores can read progress for their own courses
DROP POLICY IF EXISTS "Profesores can read course progress" ON public.lesson_progress;
CREATE POLICY "Profesores can read course progress" ON public.lesson_progress 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.lessons
    JOIN public.modules ON modules.id = lessons.module_id
    JOIN public.courses ON courses.id = modules.course_id
    WHERE lessons.id = lesson_progress.lesson_id AND courses.profesor_id = auth.uid()
  )
);

-- Users can insert/update their own progress
DROP POLICY IF EXISTS "Users can insert own progress" ON public.lesson_progress;
CREATE POLICY "Users can insert own progress" ON public.lesson_progress 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.lesson_progress;
CREATE POLICY "Users can update own progress" ON public.lesson_progress 
FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_lesson_progress_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON public.lesson_progress;
CREATE TRIGGER update_lesson_progress_updated_at
    BEFORE UPDATE
    ON public.lesson_progress
    FOR EACH ROW
EXECUTE FUNCTION update_lesson_progress_updated_at_column();
