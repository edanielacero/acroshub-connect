import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"profesor" | "alumno">("alumno");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast.error("Debes aceptar los términos y condiciones para continuar.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role,
        }
      }
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.user && data.session) {
      toast.success("¡Cuenta creada exitosamente!");
      navigate(role === "profesor" ? "/dashboard" : "/mi-cuenta");
    } else {
      toast.info("Revisa tu correo para confirmar tu cuenta.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <Link to="/" className="mb-2 inline-flex items-center justify-center gap-2 text-lg font-bold text-primary sm:text-xl">
            <AcroshubLogo className="h-7 w-7 sm:h-8 sm:w-8" /> Acroshub
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
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button type="button" variant={role === "profesor" ? "default" : "outline"} className="w-full" onClick={() => setRole("profesor")}>
                  Soy profesor
                </Button>
                <Button type="button" variant={role === "alumno" ? "default" : "outline"} className="w-full" onClick={() => setRole("alumno")}>
                  Soy alumno
                </Button>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 py-2">
              <Checkbox 
                id="terms" 
                checked={acceptedTerms} 
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                required
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Acepto los <Link to="/terminos-y-condiciones" className="text-primary hover:underline" target="_blank">términos y condiciones</Link>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Al registrarte, confirmas que has leído y aceptas nuestro aviso legal.
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !acceptedTerms}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <Link to="/login" className="font-medium text-primary hover:underline">Inicia sesión</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
