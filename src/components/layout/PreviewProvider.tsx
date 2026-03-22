import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface PreviewContextType {
  demoMode: 'con-acceso' | 'sin-acceso';
  setDemoMode: (mode: 'con-acceso' | 'sin-acceso') => void;
  isOwner: boolean;
}

export const PreviewContext = createContext<PreviewContextType>({
  demoMode: 'con-acceso',
  setDemoMode: () => {},
  isOwner: false
});

export function PreviewProvider({ children }: { children: ReactNode }) {
  const { slug } = useParams();
  const { user } = useAuth();
  
  const { data: hub } = useQuery({
    queryKey: ['hubPreviewCheck', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data } = await supabase.from('hubs').select('profesor_id').eq('slug', slug).single();
      return data;
    },
    enabled: !!slug
  });

  const isOwner = !!(user && hub && user.id === hub.profesor_id);

  const [demoMode, setDemoMode] = useState<'con-acceso' | 'sin-acceso'>(
    () => (sessionStorage.getItem('acroshub_demo_mode') as 'con-acceso' | 'sin-acceso') || 'con-acceso'
  );

  useEffect(() => {
    sessionStorage.setItem('acroshub_demo_mode', demoMode);
  }, [demoMode]);

  return (
    <PreviewContext.Provider value={{ demoMode, setDemoMode, isOwner }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  return useContext(PreviewContext);
}
