import { ReactNode } from "react";
import { Package, Compass, LogOut, ChevronDown, Eye, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";
import { getCurrentAlumno } from "@/data/mockData";
import { usePreview } from "./PreviewProvider";

interface HubLayoutProps {
  children: ReactNode;
  hubName: string;
  slug: string;
}

export function HubLayout({ children, hubName, slug }: HubLayoutProps) {
  const navigate = useNavigate();
  const alumno = getCurrentAlumno();
  const { demoMode, setDemoMode, isOwner } = usePreview();

  return (
    <>
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
      
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isOwner ? 'pl-64' : ''}`}>
        <header className={`sticky top-0 z-50 border-b bg-background/95 backdrop-blur`}>
          <div className="container flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <Link to={`/${slug}`} className="flex items-center gap-2 font-bold text-base text-primary sm:text-lg">
              <AcroshubLogo className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="truncate">{hubName}</span>
            </Link>
            <nav className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:justify-end sm:overflow-visible sm:pb-0">
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link to={`/${slug}/descubrir`}><Compass className="mr-1.5 h-4 w-4" />Descubrir</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link to={`/${slug}/mis-productos`}><Package className="mr-1.5 h-4 w-4" />Mis productos</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 shrink-0">
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
    </>
  );
}
