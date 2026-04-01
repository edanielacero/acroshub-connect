import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Settings, Menu, LogOut, ChevronDown, DollarSign, GraduationCap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";
import { supabase } from "@/lib/supabase";

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/profesores", label: "Profesores", icon: Users },
  { to: "/admin/alumnos", label: "Alumnos", icon: GraduationCap },
  { to: "/admin/ventas", label: "Ventas", icon: DollarSign },
  { to: "/admin/planes", label: "Planes", icon: Crown },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        setAdminName(profile?.full_name || user.email?.split("@")[0] || "Admin");
      }
    }
    loadUser();
  }, []);

  const initial = adminName ? adminName.charAt(0).toUpperCase() : "A";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-64 bg-sidebar text-sidebar-foreground transform transition-transform lg:translate-x-0 lg:static lg:w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <AcroshubLogo className="h-6 w-6 text-sidebar-primary" />
          <span className="font-bold text-lg">Acroshub Admin</span>
        </div>
        <nav className="p-4 space-y-1">
          {adminLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                (link.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(link.to))
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b bg-background flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 sm:px-3 hover:bg-transparent hover:text-foreground">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">{initial}</div>
                <span className="hidden sm:inline">{adminName || "Admin"}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer transition-colors">
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
