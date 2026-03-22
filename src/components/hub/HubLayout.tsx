import { useParams, Outlet, Link, useLocation } from "react-router-dom";
import { getCurrentAlumno } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, ArrowLeft, Loader2, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { usePreview } from "@/components/layout/PreviewProvider";

function hexToHSL(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '217 91% 53%'; // default
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function HubLayout() {
  const { slug } = useParams();
  const location = useLocation();
  
  const { data: hub, isLoading: isHubLoading } = useQuery({
    queryKey: ['hub', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase.from('hubs').select('*').eq('slug', slug).single();
      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data;
    },
    enabled: !!slug
  });
  
  // En escenario real, este estado provendría de contexto de Auth
  const user = getCurrentAlumno();
  const isAuthenticated = true; 
  const { demoMode, setDemoMode, isOwner } = usePreview();

  if (isHubLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!hub) {
    return <div className="p-8 text-center text-destructive font-bold">Academia no encontrada</div>;
  }

  // Lógica jerárquica para el botón de regresar
  let backLink = "/mi-cuenta";
  let backText = "Volver a mis academias";

  if (location.pathname.includes('/clase/') || location.pathname.includes('/curso/')) {
    backLink = `/${hub.slug}/productos`;
    backText = `Volver a ${hub.name}`;
  } else if (location.pathname.endsWith('/productos') || location.pathname === `/${hub.slug}`) {
    backLink = "/mi-cuenta";
    backText = "Volver a mis academias";
  }

  const navLinkClass = (path: string) => `text-sm font-medium transition-colors hover:text-primary ${location.pathname.endsWith(path) ? 'text-primary' : 'text-muted-foreground'}`;

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${isOwner ? 'lg:pl-64' : ''}`} style={{ 
      backgroundColor: 'var(--background)',
      '--primary': hub.primary_color ? hexToHSL(hub.primary_color) : '217 91% 53%'
    } as React.CSSProperties}>
      
      {isOwner && (
        <div className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 text-slate-50 flex flex-col z-[100] shadow-2xl">
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <Eye className="h-5 w-5 text-emerald-400" />
            <h2 className="font-semibold text-base">Modo Simulador</h2>
          </div>
          
          <div className="flex-1 p-5 space-y-6 overflow-y-auto">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Permisos del Alumno</span>
              <div className="flex flex-col gap-2">
                <button 
                  className={`w-full px-4 py-2.5 rounded-md text-sm font-medium text-left transition-colors flex items-center justify-between ${demoMode === 'con-acceso' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  onClick={() => setDemoMode('con-acceso')}
                >
                  Con acceso
                  {demoMode === 'con-acceso' && <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                </button>
                <button 
                  className={`w-full px-4 py-2.5 rounded-md text-sm font-medium text-left transition-colors flex items-center justify-between ${demoMode === 'sin-acceso' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  onClick={() => setDemoMode('sin-acceso')}
                >
                  Sin acceso
                  {demoMode === 'sin-acceso' && <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                </button>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 leading-relaxed border border-slate-700/50">
              Usa este panel para verificar cómo tus alumnos experimentan tu academia dependiendo de los productos que hayan adquirido.
            </div>
          </div>
          
          <div className="p-5 border-t border-slate-800 bg-slate-900/50">
            <Button size="sm" variant="outline" className="w-full h-10 bg-transparent border-slate-600 hover:bg-slate-800 hover:text-white hover:border-slate-500" asChild>
              <Link to={`/dashboard/hubs`}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Salir del simulador
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Header del HUB */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {hub.logo ? (
              <img src={hub.logo} alt={hub.name} className="h-8 max-w-[150px] object-contain" />
            ) : (
              <span className="font-bold text-xl">{hub.name}</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hover:bg-transparent hover:text-foreground">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="hidden sm:inline-block truncate max-w-[120px]">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/mi-cuenta">Mi cuenta</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/mis-ajustes">Mis ajustes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/mis-pagos">Facturación</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                     <Link to="/"><LogOut className="mr-2 h-4 w-4" /> Cerrar sesión</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild><Link to="/login">Iniciar sesión</Link></Button>
                <Button size="sm" asChild><Link to="/register">Registrarse</Link></Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Barra secundaria de navegación (Jerárquica) */}
      {backLink !== '/mi-cuenta' && (
        <div className="bg-muted/30 border-b">
          <div className="container mx-auto px-4 sm:px-6 h-10 flex items-center">
            <Link to={backLink} className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              {backText}
            </Link>
          </div>
        </div>
      )}

        <main className="flex-1 animate-fade-in relative pt-4">
          <Outlet context={{ hub }} />
        </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground bg-background">
        Powered by Acroshub
      </footer>
    </div>
  );
}
