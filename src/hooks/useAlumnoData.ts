import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useAlumnoData() {
  const { user } = useAuth();
  const alumnoId = user?.id;

  const { data: profile = null, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', alumnoId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', alumnoId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!alumnoId
  });

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['alumno_enrollments', alumnoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`*`)
        .eq('alumno_id', alumnoId!)
        .eq('status', 'active'); // Only active enrollments
      if (error) throw error;
      return data;
    },
    enabled: !!alumnoId
  });

  const productIds = Array.from(new Set(enrollments.map(e => e.product_id)));
  
  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['alumno_courses', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from('courses')
        .select('*, profiles!courses_profesor_id_fkey(full_name)')
        .in('id', productIds);
      if (error) throw error;
      return data;
    },
    enabled: productIds.length > 0
  });

  const { data: ebooks = [], isLoading: loadingEbooks } = useQuery({
    queryKey: ['alumno_ebooks', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from('ebooks')
        .select('*, profiles!ebooks_profesor_id_fkey(full_name)')
        .in('id', productIds);
      if (error) throw error;
      return data;
    },
    enabled: productIds.length > 0
  });

  // Calculate unique hub IDs from the accessible products
  const hubIds = Array.from(new Set([
    ...courses.map(c => c.hub_id),
    ...ebooks.map(e => e.hub_id)
  ])).filter(Boolean);

  const { data: hubs = [], isLoading: loadingHubs } = useQuery({
    queryKey: ['alumno_hubs', hubIds],
    queryFn: async () => {
      if (hubIds.length === 0) return [];
      const { data, error } = await supabase
        .from('hubs')
        .select('*, profiles!hubs_profesor_id_fkey(full_name)')
        .in('id', hubIds);
      if (error) throw error;
      return data;
    },
    enabled: hubIds.length > 0
  });

  const { data: pricingOptions = [], isLoading: loadingPricing } = useQuery({
    queryKey: ['alumno_pricing_options', productIds],
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

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['alumno_transactions', alumnoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('alumno_id', alumnoId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!alumnoId
  });

  const isLoading = loadingProfile || loadingEnrollments || loadingCourses || loadingEbooks || loadingHubs || loadingTransactions || loadingPricing;

  return { 
    profile, 
    enrollments, 
    courses, 
    ebooks, 
    hubs, 
    transactions,
    pricingOptions,
    isLoading 
  };
}
