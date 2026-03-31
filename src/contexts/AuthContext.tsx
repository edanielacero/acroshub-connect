import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Role = 'super_admin' | 'profesor' | 'alumno' | null;

interface AuthState {
  session: Session | null;
  user: User | null;
  role: Role;
  loading: boolean;
  hasStudentAccess: boolean;
  activeView: 'profesor' | 'alumno' | null;
  setActiveView: (view: 'profesor' | 'alumno' | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  role: null,
  loading: true,
  hasStudentAccess: false,
  activeView: null,
  setActiveView: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [hasStudentAccess, setHasStudentAccess] = useState(false);
  
  // Persist active view across reloads so the user doesn't get kicked out to the lobby unnecessarily
  const [activeView, setActiveView] = useState<'profesor' | 'alumno' | null>(() => {
    return (localStorage.getItem('acroshub_active_view') as 'profesor' | 'alumno' | null) || null;
  });

  const checkStudentAccess = async (userId: string | undefined, currentRole: Role) => {
    if (!userId || currentRole !== 'profesor') {
      setHasStudentAccess(false);
      return false;
    }
    
    try {
      const { count, error } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('alumno_id', userId)
        .eq('status', 'active');
        
      if (error) throw error;
      const hasAccess = (count || 0) > 0;
      setHasStudentAccess(hasAccess);
      return hasAccess;
    } catch (error) {
      console.error("Error checking student access:", error);
      setHasStudentAccess(false);
      return false;
    }
  };

  const handleSetActiveView = (view: 'profesor' | 'alumno' | null) => {
    setActiveView(view);
    if (view) {
      localStorage.setItem('acroshub_active_view', view);
    } else {
      localStorage.removeItem('acroshub_active_view');
    }
  };

  useEffect(() => {
    // 1. Fetch initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        const currentRole = (session?.user?.user_metadata?.role as Role) || null;
        setRole(currentRole);
        
        if (session?.user?.id) {
          const hasAccess = await checkStudentAccess(session.user.id, currentRole);
          // Si es profesor pero NO tiene acceso de alumno, y su vista activa está colgada en 'alumno'
          // o es null, forzamos a que vuelva a su panel de profesor
          if (currentRole === 'profesor' && !hasAccess && activeView !== 'profesor') {
             handleSetActiveView('profesor');
          }
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        const currentRole = (currentSession?.user?.user_metadata?.role as Role) || null;
        setRole(currentRole);
        
        if (currentSession?.user?.id) {
          await checkStudentAccess(currentSession.user.id, currentRole);
        } else {
          setHasStudentAccess(false);
          handleSetActiveView(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Limpiamos los mocks temporales que usábamos en la UI via localStorage para no contaminar
    localStorage.removeItem("currentUserRole");
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, hasStudentAccess, activeView, setActiveView: handleSetActiveView, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
