-- ==========================================
-- TRANSACTIONS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alumno_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID NOT NULL,
  product_type TEXT CHECK (product_type IN ('course', 'ebook')),
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profesores can read transactions for their products
DROP POLICY IF EXISTS "Profesores read transactions" ON public.transactions;
CREATE POLICY "Profesores read transactions" ON public.transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.courses WHERE courses.id = transactions.product_id AND courses.profesor_id = auth.uid()
    UNION
    SELECT 1 FROM public.ebooks WHERE ebooks.id = transactions.product_id AND ebooks.profesor_id = auth.uid()
  )
);

-- Profesores can insert transactions for their products
DROP POLICY IF EXISTS "Profesores insert transactions" ON public.transactions;
CREATE POLICY "Profesores insert transactions" ON public.transactions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses WHERE courses.id = transactions.product_id AND courses.profesor_id = auth.uid()
    UNION
    SELECT 1 FROM public.ebooks WHERE ebooks.id = transactions.product_id AND ebooks.profesor_id = auth.uid()
  )
);
