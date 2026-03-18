import { useParams, Link } from "react-router-dom";
import { hubs, courses, getCurrentAlumno } from "@/data/mockData";
import { HubLayout } from "@/components/layout/HubLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/EmptyState";
import { BookOpen, Compass } from "lucide-react";

export default function HubMyProducts() {
  const { slug } = useParams();
  const hub = hubs.find(h => h.slug === slug);
  const alumno = getCurrentAlumno();
  if (!hub) return null;

  const myCourses = courses.filter(c => c.hubId === hub.id && alumno.purchasedCourses.includes(c.id));

  return (
    <HubLayout hubName={hub.name} slug={hub.slug}>
      <div className="container py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold">Mis Productos</h1>

        {myCourses.length === 0 ? (
          <EmptyState
            icon={<Compass className="h-8 w-8 text-muted-foreground" />}
            title="Aún no tienes cursos"
            description="¡Explora el catálogo y encuentra tu próximo curso!"
            actionLabel="Explorar catálogo"
            actionTo={`/${slug}/descubrir`}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {myCourses.map(course => {
              const totalLessons = course.modules.reduce((a, m) => a + m.lessons.length, 0);
              const completed = course.modules.reduce((a, m) =>
                a + m.lessons.filter(l => alumno.completedLessons.includes(l.id)).length, 0);
              const progress = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

              return (
                <Card key={course.id} className="overflow-hidden">
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <BookOpen className="h-10 w-10 text-primary/30" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{course.title}</h3>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{completed}/{totalLessons} clases</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <Button className="mt-3 w-full" size="sm" asChild>
                      <Link to={`/${slug}/clase/${course.modules[0]?.lessons[0]?.id}`}>Continuar</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </HubLayout>
  );
}
