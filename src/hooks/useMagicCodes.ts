import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface MagicCode {
  id: string;
  code: string;
  amount: number;
  currency: string;
}

export interface MagicCodesData {
  one_time: MagicCode[];
  monthly: MagicCode[];
  annual: MagicCode[];
}

// ─── Fetch & Autogenerate Codes ───────────────────────────────────────────────

export function useMagicCodes(productId: string, productType: 'course' | 'ebook') {
  const { user } = useAuth();
  
  return useQuery<MagicCodesData>({
    queryKey: ['magic-codes', productId, productType],
    queryFn: async () => {
      if (!user) throw new Error("No autenticado");
      
      const { data, error } = await supabase.rpc('get_or_create_magic_codes', {
        p_profesor_id: user.id,
        p_product_id: productId,
        p_product_type: productType
      });

      if (error) throw error;
      
      return data as MagicCodesData;
    },
    enabled: !!user && !!productId && !!productType,
  });
}

// ─── Regenerate Codes Mutator ─────────────────────────────────────────────────

export function useRegenerateMagicCodes(productId: string, productType: 'course' | 'ebook') {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (paymentType: 'one-time' | 'monthly' | 'annual') => {
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase.rpc('regenerate_magic_codes', {
        p_profesor_id: user.id,
        p_product_id: productId,
        p_product_type: productType,
        p_payment_type: paymentType
      });

      if (error) throw error;
      return data as MagicCodesData;
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(['magic-codes', productId, productType], newData);
    }
  });
}
