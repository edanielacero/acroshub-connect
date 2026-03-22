import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes("admin")) {
      localStorage.setItem('acroshub_role', 'admin');
      navigate("/admin");
    } else if (email.includes("profesor") || email.includes("carlos") || email.includes("maria")) {
      localStorage.setItem('acroshub_role', 'profesor');
      navigate("/dashboard");
    } else {
      localStorage.setItem('acroshub_role', 'alumno');
      navigate("/mi-cuenta");
    }
    toast.success("¡Bienvenido de vuelta!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <Link to="/" className="mb-2 inline-flex items-center justify-center gap-2 text-lg font-bold text-primary sm:text-xl">
            <AcroshubLogo className="h-7 w-7 sm:h-8 sm:w-8" /> Acroshub
          </Link>
          <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full">Iniciar sesión</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta? <Link to="/register" className="font-medium text-primary hover:underline">Regístrate</Link>
          </p>
          <div className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <strong>Demo:</strong> Usa "admin@" para admin, "carlos@" para profesor, o cualquier otro email para alumno.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
