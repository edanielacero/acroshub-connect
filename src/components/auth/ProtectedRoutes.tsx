import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

export const RoleRoute = ({ allowedRoles }: { allowedRoles: ('super_admin' | 'profesor' | 'alumno')[] }) => {
  const { session, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!session) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(role as any)) {
    // Redirección de fallback si intenta entrar a un panel ajeno
    if (role === 'super_admin') return <Navigate to="/admin" replace />;
    if (role === 'profesor') return <Navigate to="/dashboard" replace />;
    if (role === 'alumno') return <Navigate to="/mi-cuenta" replace />;
    // Si su rol es null o desconocido, patearlo al general
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
};
