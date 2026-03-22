import { useParams, Link } from "react-router-dom";
import { hubs, courses, getCurrentAlumno } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShoppingBag, PlayCircle } from "lucide-react";

export default function HubMisProductos() {
  const { slug } = useParams();
  const hub = hubs.find(h => h.slug === slug);
  const alumno = getCurrentAlumno();
  if (!hub || !alumno) return null;

  const purchasedCourseIds = alumno.purchasedCourses;
  // Get all courses belonging to this hub that the student has purchased
  const productosConAcceso = courses.filter(c => c.hubId === hub.id && purchasedCourseIds.includes(c.id));

  // Helper to calculate progress
  const getProgress = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return 0;
    const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
    if (allLessonIds.length === 0) return 0;
    const completed = alumno.completedLessons.filter(lessonId => allLessonIds.includes(lessonId)).length;
    return Math.round((completed / allLessonIds.length) * 100);
  };

  return (
    <div className="animate-fade-in flex flex-col container mx-auto px-4 sm:px-6">
      {productosConAcceso.length > 0 ? (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis productos</h1>
            <p className="text-muted-foreground mt-1">Continúa aprendiendo donde lo dejaste.</p>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productosConAcceso.map(course => {
              const progreso = getProgress(course.id);
              
              return (
              <Card key={course.id} className="overflow-hidden hover:-translate-y-1 transition-transform hover:shadow-lg group flex flex-col">
                <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  <img 
                    src={`https://placehold.co/600x400/2563eb/ffffff?text=${encodeURIComponent(course.title)}`} 
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
                    
                    {/* Progreso */}
                    <div className="mt-5 bg-muted/30 p-3 rounded-lg border border-muted/50">
                      <div className="flex justify-between text-xs text-muted-foreground mb-2 font-medium">
                        <span>Progreso general</span>
                        <span className={progreso === 100 ? "text-green-600 font-bold" : "text-primary"}>{progreso}%</span>
                      </div>
                      <Progress value={progreso} className="h-2" />
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-3">
                      Acceso de por vida
                    </p>
                  </div>
                  
                  <Button className="w-full mt-6" asChild>
                    <Link to={`/${slug}/curso/${course.id}`}>
                      Continuar aprendiendo
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )})}
          </div>
        </div>
      ) : (
        <div className="text-center py-24 bg-card border rounded-2xl shadow-sm max-w-2xl mx-auto w-full mt-8">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">No tienes productos en este HUB</h2>
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
