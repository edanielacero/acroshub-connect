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
    }) => {
      const { email, name, productId, productType, productTitle, profesorName, accessType } = input;
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
          },
        });
        
        // When Edge Function returns non-2xx, the real error is in fnErr.context
        if (fnErr) {
          let realMessage = 'Error al invocar la función';
          try {
            // fnErr.context is the Response object — try to parse JSON from it
            const errBody = await fnErr.context?.json?.();
            realMessage = errBody?.error || fnErr.message || realMessage;
          } catch { 
            realMessage = fnErr.message || realMessage;
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
