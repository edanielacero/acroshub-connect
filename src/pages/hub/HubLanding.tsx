import { useParams, Link } from "react-router-dom";
import { hubs, courses, profesores, getCurrentAlumno } from "@/data/mockData";
import { HubLayout } from "@/components/layout/HubLayout";
import { usePreview } from "@/components/layout/PreviewProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FolderOpen } from "lucide-react";

export default function HubLanding() {
  const { slug } = useParams();
  const hub = hubs.find(h => h.slug === slug);
  const { demoMode, isOwner } = usePreview();
  const alumno = getCurrentAlumno();

  if (!hub) return <div className="min-h-screen flex items-center justify-center"><p>HUB no encontrado</p></div>;

  const hubCourses = courses.filter(c => c.hubId === hub.id);
  const prof = profesores.find(p => p.id === hub.profesorId);

  return (
    <HubLayout hubName={hub.name} slug={hub.slug}>
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-12 sm:py-16">
        <div className="container max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FolderOpen className="h-8 w-8" />
          </div>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">{hub.name}</h1>
          <p className="text-muted-foreground">{hub.description}</p>
          {prof && <p className="mt-2 text-sm text-muted-foreground">Por {prof.name}</p>}
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="container">
          <h2 className="mb-6 text-2xl font-bold">Cursos disponibles</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hubCourses.map(course => {
              const hasCourse = isOwner ? (demoMode === 'con-acceso') : alumno.purchasedCourses.includes(course.id);
              
              return (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <BookOpen className="h-12 w-12 text-primary/30" />
                </div>
                <CardContent className="p-5 flex flex-col h-[calc(100%-10rem)]">
                  <h3 className="text-lg font-semibold">{course.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground flex-1">{course.description}</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {!hasCourse && <span className="text-xl font-bold text-primary">${course.price}</span>}
                    <Button size="sm" asChild className={hasCourse ? "w-full" : "w-full sm:w-auto"}>
                      <Link to={`/${slug}/curso/${course.id}`}>{hasCourse ? 'Continuar curso' : 'Ver curso'}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        </div>
      </section>
    </HubLayout>
  );
}
