import { useParams, Outlet, Link, useLocation } from "react-router-dom";
import { hubs, getCurrentAlumno } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, ArrowLeft } from "lucide-react";

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
  const hub = hubs.find(h => h.slug === slug);
  
  // En escenario real, este estado provendría de contexto de Auth
  const user = getCurrentAlumno();
  const isAuthenticated = true; 

  if (!hub) {
    return <div className="p-8 text-center text-red-500 font-bold">Academia no encontrada</div>;
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
    <div className="min-h-screen flex flex-col" style={{ 
      backgroundColor: 'var(--background)',
      '--primary': hexToHSL(hub.primaryColor)
    } as React.CSSProperties}>
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
                    <Link to="/mi-cuenta">Todos mis cursos</Link>
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
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 sm:px-6 h-10 flex items-center">
          <Link to={backLink} className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {backText}
          </Link>
        </div>
      </div>

      <main className="flex-1 py-8">
        <Outlet />
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground bg-background">
        Powered by Acroshub
      </footer>
    </div>
  );
}
