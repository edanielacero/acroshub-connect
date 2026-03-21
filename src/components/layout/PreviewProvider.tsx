import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { getCurrentProfesor, hubs } from "@/data/mockData";

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
  const prof = getCurrentProfesor();
  const hub = hubs.find(h => h.slug === slug);
  const isOwner = !!(prof && hub && prof.id === hub.profesorId);

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
