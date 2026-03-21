import { useParams, Link } from "react-router-dom";
import { hubs, courses, comments, getCurrentAlumno } from "@/data/mockData";
import { HubLayout } from "@/components/layout/HubLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, ArrowRight, CheckCircle, FileText, MessageSquare, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { usePreview } from "@/components/layout/PreviewProvider";
import type { Lesson } from "@/data/mockData";

export default function LessonPlayer() {
  const { slug, id } = useParams();
  const hub = hubs.find(h => h.slug === slug);
  const alumno = getCurrentAlumno();
  const { demoMode, isOwner } = usePreview();
  const [comment, setComment] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [prevDemoMode, setPrevDemoMode] = useState(demoMode);

  let foundLesson: Lesson | null = null;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  let foundModule: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let foundCourse: any = null;
  for (const course of courses) {
    for (const mod of course.modules) {
      const lesson = mod.lessons.find(l => l.id === id);
      if (lesson) { foundLesson = lesson; foundModule = mod; foundCourse = course; break; }
    }
    if (foundLesson) break;
  }

  if (!hub || !foundLesson || !foundCourse || !foundModule) {
    return <div className="min-h-screen flex items-center justify-center"><p>Clase no encontrada</p></div>;
  }

  // STRICT OVERRIDE: Eject simulated teacher to Sales page if they turn off access mid-lesson
  // By analyzing the transition, we guarantee they get kicked back to the sales page 
  // without breaking the ability to test `isFreePreview` links subsequently.
  useEffect(() => {
    if (prevDemoMode === 'con-acceso' && demoMode === 'sin-acceso') {
      window.location.href = `/${slug}/curso/${foundCourse.id}`;
    } else {
      // Normal security check on initial load for locked lessons
      const actuallyHasAccess = isOwner ? (demoMode === 'con-acceso') : alumno.purchasedCourses.includes(foundCourse.id);
      if (!actuallyHasAccess && !foundLesson?.isFreePreview) {
        window.location.href = `/${slug}/curso/${foundCourse.id}`;
      }
    }
    setPrevDemoMode(demoMode);
  }, [demoMode, prevDemoMode, isOwner, alumno.purchasedCourses, foundCourse.id, foundLesson?.isFreePreview, slug]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allLessons = foundCourse.modules.flatMap((m: any) => m.lessons);
  const currentIdx = allLessons.findIndex((l: Lesson) => l.id === id);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
  const lessonComments = comments.filter(c => c.lessonId === foundLesson.id);
  const parentComments = lessonComments.filter(c => !c.parentId);

  const quizScore = foundLesson.quiz ? foundLesson.quiz.filter(q => quizAnswers[q.id] === q.correctIndex).length : 0;

  const lessonList = (
    <div className="rounded-lg border p-4 space-y-1">
      <h3 className="mb-3 text-sm font-semibold">{foundModule.title}</h3>
      {foundModule.lessons.map((l: Lesson) => (
        <Link
          key={l.id}
          to={`/${slug}/clase/${l.id}`}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${l.id === id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}
        >
          {alumno.completedLessons.includes(l.id) ? (
            <CheckCircle className="h-4 w-4 text-success shrink-0" />
          ) : (
            <Play className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">{l.title}</span>
        </Link>
      ))}
    </div>
  );

  return (
    <HubLayout hubName={hub.name} slug={hub.slug}>
      <div className="container py-6">
        <Link to={`/${slug}/curso/${foundCourse.id}`} className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver a {foundCourse.title}
        </Link>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="aspect-video rounded-xl bg-foreground/5 flex items-center justify-center">
              {foundLesson.videoUrl ? (
                <div className="text-center">
                  <Play className="mx-auto mb-2 h-16 w-16 text-primary" />
                  <p className="text-sm text-muted-foreground">Video player</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Sin video para esta clase</p>
              )}
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl font-bold">{foundLesson.title}</h1>
              <div className="flex items-center gap-3">
                <Checkbox id="completed" defaultChecked={alumno.completedLessons.includes(foundLesson.id)} />
                <label htmlFor="completed" className="text-sm">Marcar como completada</label>
              </div>
            </div>

            <div className="lg:hidden">{lessonList}</div>

            {foundLesson.content && (
              <div className="prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={{ __html: foundLesson.content }} />
            )}

            {foundLesson.hasPdf && (
              <Button variant="outline" className="w-full sm:w-auto"><FileText className="mr-2 h-4 w-4" />Ver PDF adjunto</Button>
            )}

            {foundLesson.quiz && foundLesson.quiz.length > 0 && (
              <Accordion type="single" collapsible>
                <AccordionItem value="quiz" className="rounded-lg border">
                  <AccordionTrigger className="px-4">Quiz ({foundLesson.quiz.length} preguntas)</AccordionTrigger>
                  <AccordionContent className="space-y-4 px-4 pb-4">
                    {quizSubmitted ? (
                      <div className="py-4 text-center">
                        <p className="text-2xl font-bold">¡Obtuviste {quizScore}/{foundLesson.quiz.length}!</p>
                        <Button variant="outline" className="mt-3 w-full sm:w-auto" onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}>Reintentar</Button>
                      </div>
                    ) : (
                      <>
                        {foundLesson.quiz.map((q, qi) => (
                          <div key={q.id} className="space-y-2">
                            <p className="text-sm font-medium">{qi + 1}. {q.question}</p>
                            {q.options.map((opt, oi) => (
                              <label key={oi} className="flex items-start gap-2 text-sm cursor-pointer">
                                <input type="radio" name={q.id} checked={quizAnswers[q.id] === oi} onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oi }))} className="mt-0.5" />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        ))}
                        <Button className="w-full sm:w-auto" onClick={() => setQuizSubmitted(true)}>Ver resultado</Button>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold"><MessageSquare className="h-5 w-5" />Comentarios</h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Textarea placeholder="Escribe un comentario..." value={comment} onChange={e => setComment(e.target.value)} className="flex-1" rows={2} />
                <Button className="w-full sm:w-auto" onClick={() => { setComment(''); toast.success("Comentario publicado"); }}>Publicar</Button>
              </div>
              <div className="space-y-4">
                {parentComments.map(c => {
                  const replies = lessonComments.filter(r => r.parentId === c.id);
                  return (
                    <div key={c.id} className="space-y-2">
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">{c.userName.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{c.userName}</span><span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span></div>
                          <p className="mt-1 text-sm break-words">{c.text}</p>
                          <Button variant="ghost" size="sm" className="mt-1 h-auto p-0 text-xs text-muted-foreground">Responder</Button>
                        </div>
                      </div>
                      {replies.map(r => (
                        <div key={r.id} className="ml-6 flex gap-3 sm:ml-11">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">{r.userName.charAt(0)}</div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{r.userName}</span><span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span></div>
                            <p className="mt-1 text-sm break-words">{r.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-between">
              {prevLesson ? (
                <Button variant="outline" asChild className="w-full sm:w-auto"><Link to={`/${slug}/clase/${prevLesson.id}`}><ArrowLeft className="mr-2 h-4 w-4" />Clase anterior</Link></Button>
              ) : <div />}
              {nextLesson ? (
                <Button asChild className="w-full sm:w-auto"><Link to={`/${slug}/clase/${nextLesson.id}`}>Siguiente clase<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              ) : <div />}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24 max-h-[70vh] overflow-y-auto">{lessonList}</div>
          </div>
        </div>
      </div>
    </HubLayout>
  );
}
