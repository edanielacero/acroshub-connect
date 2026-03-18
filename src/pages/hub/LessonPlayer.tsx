import { useParams, Link } from "react-router-dom";
import { hubs, courses, comments, getCurrentAlumno } from "@/data/mockData";
import { HubLayout } from "@/components/layout/HubLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, ArrowRight, CheckCircle, FileText, MessageSquare, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Lesson } from "@/data/mockData";

export default function LessonPlayer() {
  const { slug, id } = useParams();
  const hub = hubs.find(h => h.slug === slug);
  const alumno = getCurrentAlumno();
  const [comment, setComment] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Find lesson across all courses
  let foundLesson: Lesson | null = null;
  let foundModule: any = null;
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

  const allLessons = foundCourse.modules.flatMap((m: any) => m.lessons);
  const currentIdx = allLessons.findIndex((l: Lesson) => l.id === id);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
  const lessonComments = comments.filter(c => c.lessonId === foundLesson!.id);
  const parentComments = lessonComments.filter(c => !c.parentId);

  const quizScore = foundLesson.quiz ? foundLesson.quiz.filter(q => quizAnswers[q.id] === q.correctIndex).length : 0;

  return (
    <HubLayout hubName={hub.name} slug={hub.slug}>
      <div className="container py-6">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main content */}
          <div className="space-y-6">
            {/* Video */}
            <div className="aspect-video bg-foreground/5 rounded-xl flex items-center justify-center">
              {foundLesson.videoUrl ? (
                <div className="text-center">
                  <Play className="h-16 w-16 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Video player</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Sin video para esta clase</p>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold">{foundLesson.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Checkbox id="completed" defaultChecked={alumno.completedLessons.includes(foundLesson.id)} />
                <label htmlFor="completed" className="text-sm">Marcar como completada</label>
              </div>
            </div>

            {/* Content */}
            {foundLesson.content && (
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: foundLesson.content }} />
            )}

            {/* PDF */}
            {foundLesson.hasPdf && (
              <Button variant="outline"><FileText className="mr-2 h-4 w-4" />Ver PDF adjunto</Button>
            )}

            {/* Quiz */}
            {foundLesson.quiz && foundLesson.quiz.length > 0 && (
              <Accordion type="single" collapsible>
                <AccordionItem value="quiz" className="border rounded-lg">
                  <AccordionTrigger className="px-4">Quiz ({foundLesson.quiz.length} preguntas)</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-4">
                    {quizSubmitted ? (
                      <div className="text-center py-4">
                        <p className="text-2xl font-bold">¡Obtuviste {quizScore}/{foundLesson.quiz.length}!</p>
                        <Button variant="outline" className="mt-3" onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}>Reintentar</Button>
                      </div>
                    ) : (
                      <>
                        {foundLesson.quiz.map((q, qi) => (
                          <div key={q.id} className="space-y-2">
                            <p className="font-medium text-sm">{qi + 1}. {q.question}</p>
                            {q.options.map((opt, oi) => (
                              <label key={oi} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="radio" name={q.id} checked={quizAnswers[q.id] === oi} onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oi }))} />
                                {opt}
                              </label>
                            ))}
                          </div>
                        ))}
                        <Button onClick={() => setQuizSubmitted(true)}>Ver resultado</Button>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Comments */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" />Comentarios</h3>
              <div className="flex gap-2">
                <Textarea placeholder="Escribe un comentario..." value={comment} onChange={e => setComment(e.target.value)} className="flex-1" rows={2} />
                <Button onClick={() => { setComment(''); toast.success("Comentario publicado"); }}>Publicar</Button>
              </div>
              <div className="space-y-4">
                {parentComments.map(c => {
                  const replies = lessonComments.filter(r => r.parentId === c.id);
                  return (
                    <div key={c.id} className="space-y-2">
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">{c.userName.charAt(0)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2"><span className="text-sm font-medium">{c.userName}</span><span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span></div>
                          <p className="text-sm mt-1">{c.text}</p>
                          <Button variant="ghost" size="sm" className="text-xs mt-1 h-auto p-0 text-muted-foreground">Responder</Button>
                        </div>
                      </div>
                      {replies.map(r => (
                        <div key={r.id} className="flex gap-3 ml-11">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">{r.userName.charAt(0)}</div>
                          <div>
                            <div className="flex items-center gap-2"><span className="text-sm font-medium">{r.userName}</span><span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span></div>
                            <p className="text-sm mt-1">{r.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              {prevLesson ? (
                <Button variant="outline" asChild><Link to={`/${slug}/clase/${prevLesson.id}`}><ArrowLeft className="mr-2 h-4 w-4" />Clase anterior</Link></Button>
              ) : <div />}
              {nextLesson ? (
                <Button asChild><Link to={`/${slug}/clase/${nextLesson.id}`}>Siguiente clase<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              ) : <div />}
            </div>
          </div>

          {/* Sidebar - lessons list */}
          <div className="hidden lg:block">
            <div className="sticky top-24 border rounded-lg p-4 space-y-1 max-h-[70vh] overflow-y-auto">
              <h3 className="font-semibold text-sm mb-3">{foundModule.title}</h3>
              {foundModule.lessons.map((l: Lesson) => (
                <Link
                  key={l.id}
                  to={`/${slug}/clase/${l.id}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${l.id === id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
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
          </div>
        </div>
      </div>
    </HubLayout>
  );
}
