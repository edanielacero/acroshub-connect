import { useParams, Link } from "react-router-dom";
import { hubs, courses, profesores } from "@/data/mockData";
import { HubLayout } from "@/components/layout/HubLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FolderOpen } from "lucide-react";

export default function HubLanding() {
  const { slug } = useParams();
  const hub = hubs.find(h => h.slug === slug);
  if (!hub) return <div className="min-h-screen flex items-center justify-center"><p>HUB no encontrado</p></div>;

  const hubCourses = courses.filter(c => c.hubId === hub.id);
  const prof = profesores.find(p => p.id === hub.profesorId);

  return (
    <HubLayout hubName={hub.name} slug={hub.slug}>
      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container text-center max-w-2xl">
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
            <FolderOpen className="h-8 w-8" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">{hub.name}</h1>
          <p className="text-muted-foreground">{hub.description}</p>
          {prof && <p className="text-sm text-muted-foreground mt-2">Por {prof.name}</p>}
        </div>
      </section>

      {/* Courses */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-2xl font-bold mb-6">Cursos disponibles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hubCourses.map(course => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-primary/30" />
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-primary">${course.price}</span>
                    <Button size="sm" asChild>
                      <Link to={`/${slug}/curso/${course.id}`}>Ver curso</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </HubLayout>
  );
}
