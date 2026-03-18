import { ReactNode } from "react";
import { Package, Compass, LogOut, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";
import { getCurrentAlumno } from "@/data/mockData";

interface HubLayoutProps {
  children: ReactNode;
  hubName: string;
  slug: string;
}

export function HubLayout({ children, hubName, slug }: HubLayoutProps) {
  const navigate = useNavigate();
  const alumno = getCurrentAlumno();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to={`/${slug}`} className="flex items-center gap-2 font-bold text-lg text-primary">
            <AcroshubLogo className="h-6 w-6" />
            {hubName}
          </Link>
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/${slug}/descubrir`}><Compass className="mr-1.5 h-4 w-4" />Descubrir</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/${slug}/mis-productos`}><Package className="mr-1.5 h-4 w-4" />Mis productos</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                    {alumno.name.charAt(0)}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/mi-cuenta')}>Mi cuenta</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/')}>
                  <LogOut className="mr-2 h-4 w-4" />Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © 2025 {hubName} · Powered by Acroshub
        </div>
      </footer>
    </div>
  );
}
