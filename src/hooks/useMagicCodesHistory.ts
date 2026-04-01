import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface MagicCodeUsed {
  id: string;
  code: string;
  payment_type: string;
  amount: number;
  currency: string;
  used_at: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

export function useMagicCodesHistory(productId: string, page: number, limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['magic-codes-history', productId, page],
    queryFn: async () => {
      if (!user) throw new Error("No autenticado");
      
      const offset = (page - 1) * limit;

      // Note: We use an inner join directly in the string for profiles.
      // supabase types require the foreign key match.
      const { data, count, error } = await supabase
        .from('magic_codes')
        .select(`
          id, code, payment_type, amount, currency, used_at, used_by_alumno_id,
          profiles!magic_codes_used_by_alumno_id_fkey(full_name, email)
        `, { count: 'exact' })
        .eq('product_id', productId)
        .eq('profesor_id', user.id)
        .eq('status', 'used')
        .order('used_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data: (data || []).map((item: any) => ({
          id: item.id,
          code: item.code,
          payment_type: item.payment_type,
          amount: item.amount,
          currency: item.currency,
          used_at: item.used_at,
          student: {
            id: item.used_by_alumno_id,
            name: item.profiles?.full_name || 'Sin nombre',
            email: item.profiles?.email || '',
          },
        })) as MagicCodeUsed[],
        pagination: { 
          page, 
          limit, 
          total: count || 0, 
          totalPages: Math.ceil((count || 0) / limit) 
        },
      };
    },
    enabled: !!user && !!productId,
  });
}
