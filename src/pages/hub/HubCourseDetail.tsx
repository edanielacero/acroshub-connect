import { useParams, Link } from "react-router-dom";
import { hubs, courses, getCurrentAlumno } from "@/data/mockData";
import { HubLayout } from "@/components/layout/HubLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lock, Play, ArrowLeft, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function HubCourseDetail() {
  const { slug, id } = useParams();
  const hub = hubs.find(h => h.slug === slug);
  const course = courses.find(c => c.id === id);
  const alumno = getCurrentAlumno();
  const hasCourse = alumno.purchasedCourses.includes(id || '');

  if (!hub || !course) return <div className="min-h-screen flex items-center justify-center"><p>No encontrado</p></div>;

  const totalLessons = course.modules.reduce((a, m) => a + m.lessons.length, 0);

  return (
    <HubLayout hubName={hub.name} slug={hub.slug}>
      <div className="container py-8 max-w-4xl">
        <Link to={`/${slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />{hub.name}
        </Link>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          <div>
            <div className="h-52 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center mb-6">
              <BookOpen className="h-16 w-16 text-primary/30" />
            </div>
            <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
            <p className="text-muted-foreground mb-6">{course.description}</p>

            <h2 className="text-xl font-semibold mb-4">Contenido del curso</h2>
            <p className="text-sm text-muted-foreground mb-4">{course.modules.length} módulos · {totalLessons} clases</p>

            <Accordion type="multiple" className="space-y-2">
              {course.modules.map(mod => (
                <AccordionItem key={mod.id} value={mod.id} className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <span className="font-medium">{mod.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto mr-2">{mod.lessons.length} clases</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    {mod.lessons.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between py-2 text-sm border-b last:border-0">
                        <div className="flex items-center gap-2">
                          {lesson.isFreePreview || hasCourse ? (
                            <Play className="h-4 w-4 text-primary" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>{lesson.title}</span>
                          {lesson.isFreePreview && <Badge variant="secondary" className="text-xs">GRATIS</Badge>}
                        </div>
                        {(lesson.isFreePreview || hasCourse) && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/${slug}/clase/${lesson.id}`}>Ver</Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="border rounded-xl p-6 space-y-4 bg-card">
              <p className="text-3xl font-bold text-primary">${course.price}</p>
              {hasCourse ? (
                <Button className="w-full" asChild>
                  <Link to={`/${slug}/clase/${course.modules[0]?.lessons[0]?.id}`}>Acceder al curso</Link>
                </Button>
              ) : (
                <Button className="w-full" onClick={() => toast.success("¡Compra simulada! Ahora tienes acceso.")}>
                  Comprar curso
                </Button>
              )}
              <div className="text-sm text-muted-foreground space-y-1">
                <p>✓ {totalLessons} clases</p>
                <p>✓ Acceso de por vida</p>
                <p>✓ Certificado de finalización</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HubLayout>
  );
}
