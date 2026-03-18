import { useParams, Link } from "react-router-dom";
import { hubs, courses, getCurrentAlumno } from "@/data/mockData";
import { HubLayout } from "@/components/layout/HubLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default function HubDiscover() {
  const { slug } = useParams();
  const hub = hubs.find(h => h.slug === slug);
  const alumno = getCurrentAlumno();
  if (!hub) return null;

  const hubCourses = courses.filter(c => c.hubId === hub.id);

  return (
    <HubLayout hubName={hub.name} slug={hub.slug}>
      <div className="container py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold">Descubrir</h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hubCourses.map(course => {
            const purchased = alumno.purchasedCourses.includes(course.id);
            return (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <BookOpen className="h-10 w-10 text-primary/30" />
                  {purchased && <Badge className="absolute right-3 top-3 bg-success text-success-foreground">Comprado</Badge>}
                </div>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="mb-2">Curso</Badge>
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-bold text-primary">${course.price}</span>
                    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                      <Link to={`/${slug}/curso/${course.id}`}>Ver</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </HubLayout>
  );
}
