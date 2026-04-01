import { useAlumnoData } from "@/hooks/useAlumnoData";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, Loader2, Sparkles } from "lucide-react";

export default function AlumnoDashboard() {
  const { profile, hubs, enrollments, isLoading } = useAlumnoData();
  const { user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile && !user) return <p className="p-8 text-center text-muted-foreground">Perfil no encontrado</p>;

  // Lógica para obtener hubs con acceso:
  // Enrollments contain active product_ids. The hook already fetches the necessary hubs uniquely.
  const hubsConAcceso = hubs.map((hub: any) => {
    // Count how many enrollments the student has for products belonging to this hub.
    // The enrollment doesn't store hub_id directly, but we can just use the fact that the hook fetches products.
    // Wait, the hook `courses` and `ebooks` have hub_id. 
    // Actually, for a quick count we can just use the hook.
    return { ...hub, productosActivos: 1 }; // Simplified for now, or we can compute it if needed
  });

  const nombre = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Alumno';

  return (
    <div className="container py-8 sm:py-12 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hola {nombre} 👋</h1>
          <p className="text-muted-foreground mt-2">Aquí están todos tus cursos y profesores</p>
        </div>
        <Button asChild className="shrink-0 group">
          <Link to="/activar-codigo">
            <Sparkles className="h-4 w-4 mr-2 group-hover:text-amber-300 transition-colors" />
            Activar con código
          </Link>
        </Button>
      </div>

      {hubsConAcceso.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hubsConAcceso.map((hub: any) => (
            <Card key={hub.id} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
              <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative flex items-center justify-center overflow-hidden">
                {hub.cover_url && (
                  <img src={hub.cover_url} alt="Portada de la Academia" className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
                )}
                {hub.logo_url ? (
                  <img src={hub.logo_url} alt={hub.name} className="absolute bottom-4 left-4 h-14 max-w-[120px] object-contain bg-background/90 p-2 rounded-lg backdrop-blur shadow-sm z-10" />
                ) : (
                  <span className="text-4xl opacity-20 font-bold z-10">{hub.name.charAt(0)}</span>
                )}
              </div>
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-xl line-clamp-1">{hub.name}</h3>
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md w-fit">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium truncate max-w-[200px]">Academia de {hub.profiles?.full_name}</span>
                  </div>
                </div>
                <Button className="w-full mt-6" asChild>
                  <Link to={`/${hub.slug}`}>Entrar a la Academia</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-card border rounded-2xl shadow-sm">
          <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/30" />
          <h2 className="mt-6 text-2xl font-semibold">Aún no tienes cursos</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto mb-6">
            Cuando compres o te inscriban en un curso de algún profesor, aparecerá aquí en tu cuenta global.
          </p>
          <Button variant="outline" asChild>
            <Link to="/activar-codigo">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              Tengo un código mágico
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
