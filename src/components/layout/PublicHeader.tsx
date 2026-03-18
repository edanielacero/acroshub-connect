import { Link } from "react-router-dom";
import { BookOpen, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <BookOpen className="h-6 w-6" />
          Acroshub
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/login"><LogIn className="mr-2 h-4 w-4" />Iniciar sesión</Link>
          </Button>
          <Button asChild>
            <Link to="/register"><UserPlus className="mr-2 h-4 w-4" />Registrarse</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
