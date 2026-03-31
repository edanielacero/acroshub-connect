import { Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";
import { useAlumnoData } from "@/hooks/useAlumnoData";
import { useAuth } from "@/contexts/AuthContext";

export function AlumnoLayout() {
  const { profile } = useAlumnoData();
  const { signOut, user, role, setActiveView } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Alumno';

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/mi-cuenta" className="flex items-center gap-2 font-bold text-lg text-primary sm:text-xl">
            <AcroshubLogo className="h-6 w-6 sm:h-7 sm:w-7" /> Acroshub
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hover:bg-transparent hover:text-foreground">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {displayName.charAt(0)}
                </div>
                <span className="hidden sm:inline-block truncate max-w-[120px]">{displayName}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {role === 'profesor' && (
                <DropdownMenuItem onClick={() => { setActiveView('profesor'); navigate('/dashboard'); }} className="text-primary focus:bg-primary focus:text-primary-foreground font-medium cursor-pointer transition-colors">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Volver a mi Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate('/mis-ajustes')} className="text-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer transition-colors">
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/mis-pagos')} className="text-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer transition-colors">
                Facturación
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer transition-colors">
                <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
