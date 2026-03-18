import { Link } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary sm:text-xl">
          <AcroshubLogo className="h-6 w-6 sm:h-7 sm:w-7" />
          Acroshub
        </Link>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
          <Button variant="ghost" asChild className="w-full sm:w-auto">
            <Link to="/login"><LogIn className="mr-2 h-4 w-4" />Iniciar sesión</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/register"><UserPlus className="mr-2 h-4 w-4" />Registrarse</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
