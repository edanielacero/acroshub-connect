import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return;
    setLoading(true);
    
    try {
      console.log("Attempting sign in with password...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log("Sign in result:", { error, userId: data?.user?.id });
      setLoading(false);

      if (error) {
        toast.error(error.message === "Invalid login credentials" ? "Credenciales inválidas" : error.message);
        return;
      }

      toast.success("¡Bienvenido de vuelta!");
      
      // Redirigir según el rol guardado en los metadatos de Supabase
      const role = data.user?.user_metadata?.role;
      
      if (role === 'super_admin') {
        navigate("/admin");
      } else if (role === 'profesor') {
        // Check if this professor also has student access
        const { count, error: countErr } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('alumno_id', data.user.id)
          .eq('status', 'active');
          
        if (countErr) console.error("Access count verify error:", countErr);
          
        if ((count || 0) > 0) {
          navigate("/seleccionar-vista");
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/mi-cuenta");
      }
    } catch (err: any) {
      console.error("Unhandled login exception:", err);
      setLoading(false);
      toast.error(err.message || "Error inesperado en la conexión.");
    }
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta? <Link to="/register" className="font-medium text-primary hover:underline">Regístrate</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
