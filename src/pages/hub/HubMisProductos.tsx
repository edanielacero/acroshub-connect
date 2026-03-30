import { useParams, Link, useOutletContext } from "react-router-dom";
import { useAlumnoData } from "@/hooks/useAlumnoData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShoppingBag, PlayCircle, BookOpen, Loader2 } from "lucide-react";

export default function HubMisProductos() {
  const { slug } = useParams();
  const { hub } = useOutletContext<{ hub: any }>();
  const { courses, ebooks, isLoading } = useAlumnoData();
  
  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (!hub) return null;

  // Filter products by this current hub
  const misCursos = courses.filter(c => c.hub_id === hub.id);
  const misEbooks = ebooks.filter(e => e.hub_id === hub.id);

  const hasProducts = misCursos.length > 0 || misEbooks.length > 0;

  return (
    <div className="animate-fade-in flex flex-col container mx-auto px-4 sm:px-6">
      {hasProducts ? (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis productos</h1>
            <p className="text-muted-foreground mt-1">Continúa aprendiendo donde lo dejaste.</p>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {misCursos.map(course => (
              <Card key={course.id} className="overflow-hidden hover:-translate-y-1 transition-transform hover:shadow-lg group flex flex-col">
                <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  <img 
                    src={course.image_url || `https://placehold.co/600x400/2563eb/ffffff?text=${encodeURIComponent(course.title)}`} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
                  <PlayCircle className="h-10 w-10 text-white/80 absolute shadow-sm" />
                </div>
                <CardContent className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <Badge variant="outline" className="mb-3 font-medium bg-background">Curso</Badge>
                    <h3 className="font-bold text-lg line-clamp-2 leading-snug">{course.title}</h3>
                    
                    <p className="text-xs text-muted-foreground mt-3">Acceso disponible</p>
                  </div>
                  
                  <Button className="w-full mt-6" asChild>
                    <Link to={`/${slug}/curso/${course.id}`}>Continuar aprendiendo</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}

            {misEbooks.map(ebook => (
              <Card key={ebook.id} className="overflow-hidden hover:-translate-y-1 transition-transform hover:shadow-lg group flex flex-col">
                <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  <img 
                    src={ebook.image_url || `https://placehold.co/600x400/10b981/ffffff?text=${encodeURIComponent(ebook.title)}`} 
                    alt={ebook.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
                  <BookOpen className="h-10 w-10 text-white/80 absolute shadow-sm" />
                </div>
                <CardContent className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <Badge variant="outline" className="mb-3 font-medium bg-background text-emerald-600 border-emerald-200">E-Book</Badge>
                    <h3 className="font-bold text-lg line-clamp-2 leading-snug">{ebook.title}</h3>
                    
                    <p className="text-xs text-muted-foreground mt-3">Acceso disponible</p>
                  </div>
                  
                  <Button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700" asChild>
                    <Link to={`/${slug}/ebook/${ebook.id}`}>Leer E-Book</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-24 bg-card border rounded-2xl shadow-sm max-w-2xl mx-auto w-full mt-8">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">No tienes productos en esta Academia</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Explora el catálogo de {hub.name} y adquiere tu primer curso para comenzar tu camino.
          </p>
          <Button className="mt-8 px-8" size="lg" asChild>
            <Link to={`/${slug}/descubrir`}>Ver catálogo completo</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
