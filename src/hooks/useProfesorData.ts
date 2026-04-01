import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface PlanConfig {
  id: string;
  key: string;
  name: string;
  price: number;
  price_annual: number;
  max_hubs: number;
  max_students: number;
  max_courses: number;
  max_lessons_per_course: number;
  max_ebooks: number;
}

// Helper: returns true if the limit has been reached
// -1 means unlimited, so it never blocks
export function isAtLimit(current: number, max: number): boolean {
  if (max === -1) return false;
  return current >= max;
}

// Helper: returns a display string like "2/5" or "∞"
export function limitLabel(current: number, max: number): string {
  if (max === -1) return `${current} / ∞`;
  return `${current} / ${max}`;
}

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

  // Fetch plan config based on the professor's current plan key
  const planKey = (profile as any)?.plan || 'gratis';
  const { data: planConfig = null, isLoading: loadingPlan } = useQuery<PlanConfig | null>({
    queryKey: ['plan_config', planKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_configs')
        .select('*')
        .eq('key', planKey)
        .single();
      if (error) {
        console.warn('Could not load plan config for key:', planKey, error.message);
        return null;
      }
      return data;
    },
    enabled: !!planKey
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
    enabled: !!profesorId
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
    enabled: !!profesorId
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
    enabled: !!profesorId
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
    enabled: !!profesorId
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
    enabled: !!profesorId
  });

  const isCriticalLoading = loadingProfile || loadingPlan || loadingHubs || loadingCourses || loadingEbooks;
  
  // Retrocompatibilidad con components que esperan un bool general, pero más rápido
  const isLoading = isCriticalLoading;

  return { 
    profile, planConfig, planKey, hubs, courses, ebooks, enrollments, pricingOptions, lessons, comments, transactions, 
    isLoading, // Rápido, ideal para Dashboard Layout
    loadingEnrollments, loadingPricing, loadingLessons, loadingComments, loadingTransactions // Específicos para evitar parpadeos en tablas
  };
}
