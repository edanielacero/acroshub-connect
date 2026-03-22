import { useParams, Link } from "react-router-dom";
import { hubs, courses, ebooks, getCurrentAlumno } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShoppingBag, PlayCircle, Lock, BookOpen } from "lucide-react";

export default function HubProductos() {
  const { slug } = useParams();
  const hub = hubs.find(h => h.slug === slug);
  const alumno = getCurrentAlumno();
  if (!hub || !alumno) return null;

  const purchasedCourseIds = alumno.purchasedCourses;
  const purchasedEbookIds = alumno.purchasedEbooks || [];
  
  // Get all products belonging to this hub
  const hubCourses = courses.filter(c => c.hubId === hub.id).map(c => ({ ...c, productType: 'course' as 'course' }));
  const hubEbooks = ebooks.filter(e => e.hubId === hub.id).map(e => ({ ...e, productType: 'ebook' as 'ebook' }));
  
  const allProducts = [...hubCourses, ...hubEbooks];
  
  const productosConAcceso = allProducts.filter(p => 
    p.productType === 'course' ? purchasedCourseIds.includes(p.id) : purchasedEbookIds.includes(p.id)
  );
  
  const productosSinAcceso = allProducts.filter(p => 
    p.productType === 'course' ? !purchasedCourseIds.includes(p.id) : !purchasedEbookIds.includes(p.id)
  );

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
      <div className="space-y-16 mt-2">
        
        {/* Mis Productos */}
        <section>
          {productosConAcceso.length > 0 ? (
            <>
              <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Mis productos</h1>
                <p className="text-muted-foreground mt-1">Continúa aprendiendo donde lo dejaste.</p>
              </div>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {productosConAcceso.map(product => {
                  const isCourse = product.productType === 'course';
                  const progreso = isCourse ? getProgress(product.id) : 0;
                  
                  return (
                  <Card key={product.id} className="overflow-hidden hover:-translate-y-1 transition-transform hover:shadow-lg group flex flex-col">
                    <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      <img 
                        src={`https://placehold.co/600x400/${isCourse ? '2563eb' : '16a34a'}/ffffff?text=${encodeURIComponent(product.title)}`} 
                        alt={product.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
                      {isCourse ? (
                        <PlayCircle className="h-10 w-10 text-white/80 absolute shadow-sm" />
                      ) : (
                        <BookOpen className="h-10 w-10 text-white/80 absolute shadow-sm" />
                      )}
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {isCourse ? (
                          <Badge variant="outline" className="mb-3 font-medium bg-background text-primary border-primary/20">Curso</Badge>
                        ) : (
                          <Badge variant="outline" className="mb-3 font-medium bg-background text-green-600 border-green-600/20">E-Book</Badge>
                        )}
                        <h3 className="font-bold text-lg line-clamp-2 leading-snug">{product.title}</h3>
                        
                        {/* Progreso (solo para cursos) */}
                        {isCourse ? (
                          <div className="mt-5 bg-muted/30 p-3 rounded-lg border border-muted/50">
                            <div className="flex justify-between text-xs text-muted-foreground mb-2 font-medium">
                              <span>Progreso general</span>
                              <span className={progreso === 100 ? "text-green-600 font-bold" : "text-primary"}>{progreso}%</span>
                            </div>
                            <Progress value={progreso} className="h-2" />
                          </div>
                        ) : (
                          <div className="mt-5 bg-muted/30 p-3 rounded-lg border border-muted/50">
                            <div className="text-xs font-medium text-muted-foreground">
                              Formato: {(product as any).format?.toUpperCase() || 'PDF'} • {(product as any).pages || '?'} páginas
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-3">
                          Acceso de por vida
                        </p>
                      </div>
                      
                      <Button className="w-full mt-6 shadow-sm" asChild>
                        <Link to={`/${slug}/${isCourse ? 'curso' : 'ebook'}/${product.id}`}>
                          {isCourse ? 'Continuar aprendiendo' : 'Leer E-Book'}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )})}
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-card border rounded-2xl shadow-sm max-w-3xl mx-auto w-full mt-8">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">No tienes productos en este HUB aún</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                No hay problema. Explora el catálogo a continuación para encontrar cursos de {hub.name} interesantes para ti.
              </p>
            </div>
          )}
        </section>

        {/* Productos que te pueden interesar */}
        {productosSinAcceso.length > 0 && (
          <section className="pt-8 border-t">
            <div className="mb-6 flex flex-col gap-1">
              <h2 className="text-2xl font-bold tracking-tight">Productos que te pueden interesar</h2>
              <p className="text-muted-foreground">Explora otros programas educativos que ofrece esta academia.</p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productosSinAcceso.map(product => {
                const isCourse = product.productType === 'course';
                
                return (
                <Card key={product.id} className="overflow-hidden hover:shadow-md transition-all group hover:-translate-y-1 bg-gradient-to-br from-card to-muted/5 border-muted flex flex-col">
                  <div className="h-36 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={`https://placehold.co/600x400/${isCourse ? '2563eb' : '16a34a'}/ffffff?text=${encodeURIComponent(product.title)}`} 
                      alt={product.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/5" />
                  </div>
                  
                  <CardContent className="p-5 flex flex-col h-[calc(100%-9rem)] flex-1">
                    {isCourse ? (
                      <Badge variant="secondary" className="w-fit mb-3 font-medium bg-primary/10 text-primary hover:bg-primary/20">Curso disponible</Badge>
                    ) : (
                      <Badge variant="secondary" className="w-fit mb-3 font-medium bg-green-100 text-green-700 hover:bg-green-200">E-Book disponible</Badge>
                    )}
                    
                    <h3 className="font-bold text-base line-clamp-2 leading-tight flex-1">{product.title}</h3>
                    
                    <div className="mt-4 pt-4 border-t border-muted/50 space-y-1">
                      <p className="text-xl font-extrabold text-primary">${product.price} <span className="text-xs font-normal text-muted-foreground">USD</span></p>
                    </div>
                    
                    <Button variant="outline" className="w-full mt-5 bg-background hover:bg-muted" asChild>
                      <Link to={`/${slug}/${isCourse ? 'curso' : 'ebook'}/${product.id}`}>
                        <Lock className="h-3.5 w-3.5 mr-2 opacity-70" />
                        Ver detalles
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )})}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
