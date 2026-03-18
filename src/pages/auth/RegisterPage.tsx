import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"profesor" | "alumno">("alumno");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("¡Cuenta creada exitosamente!");
    navigate(role === "profesor" ? "/dashboard" : "/mi-cuenta");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 text-primary font-bold text-xl mb-2">
            <BookOpen className="h-6 w-6" /> Acroshub
          </Link>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Regístrate para empezar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>¿Qué eres?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={role === "profesor" ? "default" : "outline"} className="w-full" onClick={() => setRole("profesor")}>
                  Soy profesor
                </Button>
                <Button type="button" variant={role === "alumno" ? "default" : "outline"} className="w-full" onClick={() => setRole("alumno")}>
                  Soy alumno
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full">Crear cuenta</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            ¿Ya tienes cuenta? <Link to="/login" className="text-primary font-medium hover:underline">Inicia sesión</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
