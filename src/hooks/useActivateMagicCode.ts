import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivateCodeResponse {
  success: boolean;
  product_title?: string;
  product_type?: string;
  payment_type?: string;
  hub_slug?: string;
  error?: string;
}

export function useActivateMagicCode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error("Debes iniciar sesión para activar códigos.");

      const { data, error } = await supabase.rpc('use_magic_code', {
        p_code: code,
        p_alumno_id: user.id,
      });

      if (error) {
        throw new Error(error.message);
      }
      
      const responseCode = data as ActivateCodeResponse;
      if (responseCode.success === false && responseCode.error) {
         throw new Error(responseCode.error);
      }

      return responseCode;
    },
    onSuccess: (data) => {
      // Invalidate relevant caches to reload dashboard
      queryClient.invalidateQueries({ queryKey: ['alumno_enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['alumno_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['alumno_hubs'] });
    }
  });
}
