import { useParams } from "react-router-dom";
import { hubs, courses, getCurrentAlumno } from "@/data/mockData";
import { HubLayout } from "@/components/layout/HubLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

export default function HubDiscover() {
  const { slug } = useParams();
  const hub = hubs.find(h => h.slug === slug);
  const alumno = getCurrentAlumno();
  if (!hub) return null;

  const hubCourses = courses.filter(c => c.hubId === hub.id);

  return (
    <HubLayout hubName={hub.name} slug={hub.slug}>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Descubrir</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hubCourses.map(course => {
            const purchased = alumno.purchasedCourses.includes(course.id);
            return (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-36 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                  <BookOpen className="h-10 w-10 text-primary/30" />
                  {purchased && <Badge className="absolute top-3 right-3 bg-success text-success-foreground">Comprado</Badge>}
                </div>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="mb-2">Curso</Badge>
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-primary">${course.price}</span>
                    <Button variant="outline" size="sm" asChild>
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
