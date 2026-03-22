import { Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";
import { getCurrentAlumno } from "@/data/mockData";

export function AlumnoLayout() {
  const alumno = getCurrentAlumno();
  const navigate = useNavigate();

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
                  {alumno.name.charAt(0)}
                </div>
                <span className="hidden sm:inline-block truncate max-w-[120px]">{alumno.name}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/')}>
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
