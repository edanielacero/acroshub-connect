import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Users, BarChart3, Settings, Menu, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";
import { getCurrentProfesor } from "@/data/mockData";

const profLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/hubs", label: "Mis HUBs", icon: FolderOpen },
  { to: "/dashboard/alumnos", label: "Alumnos", icon: Users },
  { to: "/dashboard/ventas", label: "Ventas", icon: BarChart3 },
  { to: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

export function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const prof = getCurrentProfesor();

  return (
    <div className="min-h-screen flex bg-muted/30">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-64 bg-sidebar text-sidebar-foreground transform transition-transform lg:translate-x-0 lg:static lg:w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <AcroshubLogo className="h-6 w-6 text-sidebar-primary" />
          <span className="font-bold text-lg">Acroshub</span>
        </div>
        <nav className="p-4 space-y-1">
          {profLinks.map(link => {
            const isActive = link.exact
              ? location.pathname === link.to
              : location.pathname.startsWith(link.to) && link.to !== '/dashboard';
            const active = link.exact ? location.pathname === link.to : isActive;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b bg-background flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 sm:px-3 max-w-full">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium shrink-0">
                  {prof.name.charAt(0)}
                </div>
                <span className="hidden sm:inline truncate">{prof.name}</span>
                <ChevronDown className="h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/dashboard/configuracion')}>
                <Settings className="mr-2 h-4 w-4" />Configuración
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/')}>
                <LogOut className="mr-2 h-4 w-4" />Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
