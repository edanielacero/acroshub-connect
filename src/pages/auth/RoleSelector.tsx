import { useNavigate, Navigate } from "react-router-dom";
import { BookOpen, GraduationCap, LayoutDashboard, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function RoleSelector() {
  const { role, hasStudentAccess, setActiveView, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not supposed to be here
  useEffect(() => {
    if (!loading) {
      if (role !== 'profesor' || !hasStudentAccess) {
        if (role === 'super_admin') navigate("/admin");
        else if (role === 'profesor') navigate("/dashboard");
        else if (role === 'alumno') navigate("/mi-cuenta");
        else navigate("/");
      }
    }
  }, [role, hasStudentAccess, loading, navigate]);

  const handleSelectRole = (selectedRole: 'profesor' | 'alumno') => {
    setActiveView(selectedRole);
    if (selectedRole === 'profesor') navigate("/dashboard");
    else navigate("/mi-cuenta");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prevent flicker during redirect
  if (role !== 'profesor' || !hasStudentAccess) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="w-full max-w-4xl space-y-8 animate-fade-in text-center">
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
            <AcroshubLogo className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Selecciona tu vista</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Hemos detectado que eres un Profesor, pero también estás inscrito en cursos de otros creadores.
            ¿Qué panel deseas abrir hoy?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-3xl mx-auto">
          {/* Tarjeta de Profesor */}
          <Card 
            className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 bg-card"
            onClick={() => handleSelectRole('profesor')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="text-center pb-4 pt-10">
              <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors w-16 h-16 flex items-center justify-center">
                <LayoutDashboard className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl">Panel de Profesor</CardTitle>
              <CardDescription className="text-base mt-2">
                Gestiona tus academias, cursos, alumnos y ventas.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-10">
              <Button variant="ghost" className="group-hover:bg-primary/10 w-full mt-4 h-12 rounded-xl font-medium">
                Entrar como Profesor <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Tarjeta de Alumno */}
          <Card 
            className="group relative overflow-hidden border-2 hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 bg-card"
            onClick={() => handleSelectRole('alumno')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="text-center pb-4 pt-10">
              <div className="mx-auto bg-purple-500/10 text-purple-600 p-4 rounded-full mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors w-16 h-16 flex items-center justify-center">
                <GraduationCap className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl">Mis Aprendizajes</CardTitle>
              <CardDescription className="text-base mt-2">
                Accede a los cursos y academias donde estás inscrito.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-10">
              <Button variant="ghost" className="group-hover:bg-purple-500/10 group-hover:text-purple-700 w-full mt-4 h-12 rounded-xl font-medium">
                Entrar como Alumno <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
