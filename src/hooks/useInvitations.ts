import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useInvitations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['invitations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('profesor_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useInviteStudent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      email: string;
      name: string;
      productId: string;
      productType: 'course' | 'ebook';
      productTitle: string;
      profesorName: string;
      accessType: 'lifetime' | 'subscription';
      amount?: number;
      currency?: string;
    }) => {
      const { email, name, productId, productType, productTitle, profesorName, accessType, amount, currency } = input;
      const appUrl = window.location.origin;

      try {
        const { data: fnData, error: fnErr } = await supabase.functions.invoke('process-invitation', {
          body: {
            email,
            name,
            productId,
            productType,
            productTitle,
            profesorName,
            accessType,
            appUrl,
            amount,
            currency
          },
        });
        
        if (fnErr) {
          console.error("Detalle del error de Edge Function:", fnErr);
          let realMessage = `Error de servidor (${fnErr.message})`;
          try {
            const errBody = await (fnErr as any).context?.json?.();
            console.error("Cuerpo del error:", errBody);
            realMessage = errBody?.error || errBody?.message || realMessage;
          } catch (e) { 
            console.error("No se pudo parsear el error JSON:", e);
          }
          throw new Error(realMessage);
        }
        if (fnData?.error) throw new Error(fnData.error);

        return { 
          status: fnData?.is_new ? 'invited' as const : 'already_active' as const, 
          invitation: fnData?.invitation, 
          activationLink: fnData?.link, 
          emailSent: !!fnData?.email_sent 
        };
      } catch (err: any) {
        console.error("Error inviting student:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invitation: any) => {
      const appUrl = window.location.origin;

      try {
        const { data, error } = await supabase.functions.invoke('process-invitation', {
          body: {
            email: invitation.email,
            name: invitation.name,
            productId: invitation.product_id,
            productType: invitation.product_type,
            productTitle: 'tu producto',
            profesorName: 'tu profesor',
            appUrl,
            isResend: true
          },
        });
        
        if (error) throw error;
        return { activationLink: data?.link, emailSent: !!data?.email_sent };
      } catch (err) {
        console.error("Error resending invitation:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}
