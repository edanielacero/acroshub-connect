import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useProfesorData() {
  const { user } = useAuth();
  const profesorId = user?.id;

  const { data: profile = null, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', profesorId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', profesorId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!profesorId
  });

  const { data: hubs = [], isLoading: loadingHubs } = useQuery({
    queryKey: ['hubs', profesorId],
    queryFn: async () => {
      const { data, error } = await supabase.from('hubs').select('*').eq('profesor_id', profesorId!);
      if (error) throw error;
      return data;
    },
    enabled: !!profesorId
  });

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses', profesorId],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').eq('profesor_id', profesorId!);
      if (error) throw error;
      return data;
    },
    enabled: !!profesorId
  });

  const { data: ebooks = [], isLoading: loadingEbooks } = useQuery({
    queryKey: ['ebooks', profesorId],
    queryFn: async () => {
      const { data, error } = await supabase.from('ebooks').select('*').eq('profesor_id', profesorId!);
      if (error) throw error;
      return data;
    },
    enabled: !!profesorId
  });

  const productIds = [...courses.map(c => c.id), ...ebooks.map(e => e.id)];
  
  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollments', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from('enrollments')
        .select(`*, profiles(full_name, email)`)
        .in('product_id', productIds);
      if (error) throw error;
      return data;
    },
    enabled: productIds.length > 0
  });

  const { data: pricingOptions = [], isLoading: loadingPricing } = useQuery({
    queryKey: ['pricing_options', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from('pricing_options')
        .select('*')
        .in('product_id', productIds);
      if (error) throw error;
      return data;
    },
    enabled: productIds.length > 0
  });

  const { data: lessons = [], isLoading: loadingLessons } = useQuery({
    queryKey: ['lessons', courses.map(c => c.id)],
    queryFn: async () => {
      if (courses.length === 0) return [];
      const { data, error } = await supabase
        .from('lessons')
        .select('*, modules!inner(course_id)')
        .in('modules.course_id', courses.map(c => c.id));
      if (error) throw error;
      return data;
    },
    enabled: courses.length > 0
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['comments', lessons.map(l => l.id)],
    queryFn: async () => {
      if (lessons.length === 0) return [];
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(full_name)')
        .in('lesson_id', lessons.map(l => l.id));
      if (error) throw error;
      return data;
    },
    enabled: lessons.length > 0
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*, profiles(full_name, email)')
        .in('product_id', productIds);
      if (error) throw error;
      return data;
    },
    enabled: productIds.length > 0
  });

  const isLoading = loadingProfile || loadingHubs || loadingCourses || loadingEbooks || loadingEnrollments || loadingPricing || loadingLessons || loadingComments || loadingTransactions;

  return { profile, hubs, courses, ebooks, enrollments, pricingOptions, lessons, comments, transactions, isLoading };
}
