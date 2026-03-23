import { useParams, Link } from "react-router-dom";
import { hubs, courses, getCurrentAlumno } from "@/data/mockData";
import { HubLayout } from "@/components/layout/HubLayout";
import { usePreview } from "@/components/layout/PreviewProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lock, Play, ArrowLeft, BookOpen, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function HubCourseDetail() {
  const { slug, id } = useParams();
  const hub = hubs.find(h => h.slug === slug);
  const course = courses.find(c => c.id === id);
  const alumno = getCurrentAlumno();
  const { demoMode, isOwner } = usePreview();
  
  // STRICT OVERRIDE: If a professor is simulating, their decision overrides any native array mock data!
  const hasCourse = isOwner ? (demoMode === 'con-acceso') : alumno.purchasedCourses.includes(id || '');

  if (!hub || !course) return <div className="min-h-screen flex items-center justify-center"><p>No encontrado</p></div>;

  const totalLessons = course.modules.reduce((a, m) => a + m.lessons.length, 0);

  return (
    <HubLayout hubName={hub.name} slug={hub.slug}>
      <div className="container max-w-4xl py-6 sm:py-8">
        <Link to={`/${slug}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />{hub.name}
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:gap-8">
          <div>
            <div className="mb-6 flex h-52 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <BookOpen className="h-16 w-16 text-primary/30" />
            </div>
            <h1 className="mb-3 text-2xl font-bold sm:text-3xl">{course.title}</h1>
            <p className="mb-6 text-muted-foreground">{course.description}</p>

            <h2 className="mb-4 text-xl font-semibold">Contenido del curso</h2>
            <p className="mb-4 text-sm text-muted-foreground">{course.modules.length} módulos · {totalLessons} clases</p>

            <Accordion type="multiple" className="space-y-2">
              {course.modules.map(mod => (
                <AccordionItem key={mod.id} value={mod.id} className="overflow-hidden rounded-lg border">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <span className="font-medium text-left">{mod.title}</span>
                    <span className="ml-auto mr-2 text-xs text-muted-foreground">{mod.lessons.length} clases</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    {mod.lessons.map(lesson => (
                      <div key={lesson.id} className="flex flex-col gap-2 border-b py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          {lesson.isFreePreview || hasCourse ? (
                            <Play className="h-4 w-4 text-primary" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>{lesson.title}</span>
                          {lesson.isFreePreview && <Badge variant="secondary" className="text-xs">GRATIS</Badge>}
                        </div>
                        {(lesson.isFreePreview || hasCourse) && (
                          <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
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

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
              {!hasCourse && <p className="text-3xl font-bold text-primary">${course.price}</p>}
              
              {hasCourse ? (
                <div className="space-y-4">
                  <div className="bg-success/10 text-success p-3 rounded-lg flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Ya tienes acceso a este curso
                  </div>
                  <Button className="w-full" asChild>
                    <Link to={`/${slug}/clase/${course.modules[0]?.lessons[0]?.id}`}>Acceder al curso</Link>
                  </Button>
                </div>
              ) : (
                <Button className="w-full" onClick={() => toast.info("Redirigiendo a pago manual...")}>
                  Comprar curso
                </Button>
              )}
              <div className="space-y-1 text-sm text-muted-foreground pt-2">
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
