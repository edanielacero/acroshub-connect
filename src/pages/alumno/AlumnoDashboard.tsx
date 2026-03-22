import { getCurrentAlumno, hubs, courses } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, GraduationCap } from "lucide-react";

export default function AlumnoDashboard() {
  const alumno = getCurrentAlumno();
  
  // Lógica para obtener hubs con acceso
  const purchasedCourseIds = alumno.purchasedCourses;
  const purchasedCourses = courses.filter(c => purchasedCourseIds.includes(c.id));
  const hubIds = [...new Set(purchasedCourses.map(c => c.hubId))];
  const hubsConAcceso = hubs.filter(h => hubIds.includes(h.id)).map(hub => {
    return {
      ...hub,
      productosActivos: purchasedCourses.filter(c => c.hubId === hub.id).length
    }
  });

  return (
    <div className="container py-8 sm:py-12 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Hola, {alumno.name.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground mt-2">Aquí están todos tus cursos y profesores</p>
      </div>

      {hubsConAcceso.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hubsConAcceso.map(hub => (
            <Card key={hub.id} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
              <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative flex items-center justify-center">
                {hub.logo ? (
                  <img src={hub.logo} alt={hub.name} className="absolute bottom-4 left-4 h-14 max-w-[120px] object-contain bg-background/80 p-2 rounded-lg backdrop-blur" />
                ) : (
                  <span className="text-4xl opacity-20 font-bold">{hub.name.charAt(0)}</span>
                )}
              </div>
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-xl line-clamp-1">{hub.name}</h3>
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md w-fit">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium">{hub.productosActivos} productos adquiridos</span>
                  </div>
                </div>
                <Button className="w-full mt-6" asChild>
                  <Link to={`/${hub.slug}/productos`}>Entrar a la Academia</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-card border rounded-2xl shadow-sm">
          <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/30" />
          <h2 className="mt-6 text-2xl font-semibold">Aún no tienes cursos</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Cuando compres o te inscriban en un curso de algún profesor, aparecerá aquí en tu cuenta global.
          </p>
        </div>
      )}
    </div>
  );
}
