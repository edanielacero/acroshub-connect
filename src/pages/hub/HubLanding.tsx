import { Link, useOutletContext } from "react-router-dom";
import { useAlumnoData } from "@/hooks/useAlumnoData";
import { usePreview } from "@/components/layout/PreviewProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, PlayCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function HubLanding() {
  const { hub } = useOutletContext<{ hub: any }>();
  const { demoMode, isOwner } = usePreview();
  const { enrollments } = useAlumnoData();

  const { data: hubCourses = [], isLoading } = useQuery({
    queryKey: ['hubCourses', hub?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').eq('hub_id', hub.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!hub?.id
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Productos destacados (los 3 primeros)
  const productosDestacados = hubCourses.slice(0, 3);

  return (
    <div className="animate-fade-in">
      {/* Hero section */}
      <section className="py-12 sm:py-16 text-center">
        {hub?.cover_image ? (
          <div className="h-48 sm:h-64 -mt-8 mb-8 bg-cover bg-center rounded-b-3xl sm:rounded-b-none sm:-mx-8" 
               style={{ backgroundImage: `url(${hub.cover_image})`, backgroundColor: 'var(--primary)/10' }} />
        ) : (
          <div className="h-32 sm:h-48 -mt-8 mb-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-b-3xl sm:rounded-b-none sm:-mx-8 flex items-center justify-center">
             <FolderOpen className="h-16 w-16 text-primary/30" />
          </div>
        )}
        <div className="container">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{hub?.name}</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
            {hub?.description}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button size="lg" asChild className="text-base h-12 px-8">
              <Link to={`/${hub?.slug}/productos`}>Ver catálogo completo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Productos destacados */}
      <section className="py-12 bg-muted/20">
        <div className="container">
          <h2 className="text-2xl font-bold mb-8 text-center sm:text-left">Cursos Destacados</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {productosDestacados.map(course => {
              const hasCourse = isOwner ? (demoMode === 'con-acceso') : enrollments.some(e => e.product_id === course.id && e.status === 'active');
              
              return (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="flex h-44 items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 relative">
                  <PlayCircle className="h-12 w-12 text-primary/40" />
                </div>
                <CardContent className="p-5 flex flex-col justify-between h-[200px]">
                  <div>
                    <h3 className="text-lg font-bold line-clamp-2 leading-tight">{course.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    {!hasCourse && <span className="text-xl font-extrabold text-primary">${course.price} <span className="text-xs font-normal text-muted-foreground">USD</span></span>}
                    <Button asChild variant={hasCourse ? "secondary" : "default"} className="w-full">
                      <Link to={`/${hub?.slug}/curso/${course.id}`}>{hasCourse ? 'Ir al curso' : 'Ver detalles'}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
          <div className="text-center mt-10">
            <Button variant="outline" size="lg" asChild>
              <Link to={`/${hub?.slug}/productos`}>Explorar todos los cursos</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
