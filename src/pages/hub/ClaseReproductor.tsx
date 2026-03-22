import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { hubs, courses, getCurrentAlumno } from "@/data/mockData";
import { usePreview } from "@/components/layout/PreviewProvider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlayCircle, CheckCircle, Circle, ChevronLeft, ChevronRight, FileText, Download, MessageSquare } from "lucide-react";
import { ComentariosComponent } from "@/components/hub/ComentariosComponent";
import { QuizComponent } from "@/components/hub/QuizComponent";
import { toast } from "sonner";

export default function ClaseReproductor() {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const hub = hubs.find(h => h.slug === slug);
  
  // Find course and lesson
  const course = courses.find(c => c.hubId === hub?.id && c.modules.some(m => m.lessons.some(l => l.id === id)));
  const modulo = course?.modules.find(m => m.lessons.some(l => l.id === id));
  const clase = modulo?.lessons.find(l => l.id === id);
  
  const { demoMode, isOwner } = usePreview();
  const alumno = getCurrentAlumno();
  const [completada, setCompletada] = useState(alumno.completedLessons.includes(id || ""));
  const [activeTab, setActiveTab] = useState("descripcion");

  // Handle URL hash for auto tab selection (e.g. #comentarios)
  useEffect(() => {
    if (location.hash === '#comentarios') {
      setActiveTab('comentarios');
      setTimeout(() => {
        const comentariosSection = document.getElementById('comentarios-tab-content');
        if (comentariosSection) comentariosSection.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.hash, id]);

  if (!hub || !course || !modulo || !clase) {
    return <div className="p-8 text-center">Clase no encontrada</div>;
  }

  const hasAccess = isOwner ? (demoMode === 'con-acceso') : alumno.purchasedCourses.includes(course.id);
  if (!hasAccess && !clase.isFreePreview) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <PlayCircle className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Contenido bloqueado</h2>
        <p className="text-muted-foreground mb-8 max-w-md">Para acceder a esta clase necesitas comprar el curso o tener una suscripción activa.</p>
        <Button size="lg" asChild>
          <Link to={`/${slug}/curso/${course.id}`}>Ver opciones de acceso</Link>
        </Button>
      </div>
    );
  }

  // Prev/Next logic
  const allLessonsFlat = course.modules.flatMap(m => m.lessons);
  const currentIndex = allLessonsFlat.findIndex(l => l.id === clase.id);
  const clasePrev = currentIndex > 0 ? allLessonsFlat[currentIndex - 1] : null;
  const claseNext = currentIndex < allLessonsFlat.length - 1 ? allLessonsFlat[currentIndex + 1] : null;

  const marcarCompletada = () => {
    setCompletada(true);
    toast.success("¡Clase completada!");
    if (claseNext && !claseNext.isFreePreview && !hasAccess) {
      toast.info("La siguiente clase es premium");
    }
  };

  const claseCompletada = (lessonId: string) => alumno.completedLessons.includes(lessonId) || (lessonId === id && completada);

  const handleQuizComplete = (score: number) => {
    if (score >= 70) {
      marcarCompletada();
    }
  };

  return (
    <div className="animate-fade-in grid gap-8 lg:grid-cols-4 max-w-[1400px] mx-auto px-4 sm:px-6">
      {/* Video y contenido principal */}
      <main className="lg:col-span-3 space-y-8">
        {/* Video Player */}
        <div className="aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-xl ring-1 ring-border relative">
          {clase.videoUrl ? (
            <iframe 
              src={clase.videoUrl.replace('watch?v=', 'embed/')} 
              className="w-full h-full border-0 absolute inset-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/50 bg-slate-900 flex-col gap-4">
               <PlayCircle className="h-16 w-16 opacity-30" />
               <p>Reproductor de video seguro preparado</p>
               <span className="text-xs bg-white/10 px-3 py-1 rounded-full">{clase.videoType === 'youtube' ? 'YouTube' : 'Bunny CDN Stream'}</span>
            </div>
          )}
        </div>
        
        {/* Encabezado y navegación rápida */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start justify-between bg-card p-6 rounded-2xl border shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">{modulo.title}</Badge>
              {clase.isFreePreview && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 uppercase tracking-widest text-[10px] font-bold">Preview</Badge>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{clase.title}</h1>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            {!completada && (
              <Button onClick={marcarCompletada} className="gap-2 shrink-0 bg-green-600 hover:bg-green-700 text-white shadow-sm flex-1 sm:flex-none">
                <CheckCircle className="h-4 w-4" />
                Marcar lista
              </Button>
            )}
            
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="icon" asChild disabled={!clasePrev} className={!clasePrev ? "opacity-50 pointer-events-none" : ""}>
                <Link to={clasePrev ? `/${slug}/clase/${clasePrev.id}` : '#'}>
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="icon" asChild disabled={!claseNext} className={!claseNext ? "opacity-50 pointer-events-none" : ""}>
                <Link to={claseNext ? `/${slug}/clase/${claseNext.id}` : '#'}>
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Tabs: Descripción, Recursos, Quiz, Comentarios */}
        <div className="pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-b rounded-none px-0 h-auto pb-px scrollbar-hide">
              <TabsTrigger value="descripcion" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-6 py-3 text-base">Descripción</TabsTrigger>
              {clase.hasPdf && <TabsTrigger value="recursos" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-6 py-3 text-base">Recursos</TabsTrigger>}
              {clase.quiz && <TabsTrigger value="quiz" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-6 py-3 text-base">Quiz Automático</TabsTrigger>}
              <TabsTrigger value="comentarios" className="data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-6 py-3 text-base">
                Discusión
                <Badge variant="secondary" className="ml-2 bg-muted-foreground/15 text-muted-foreground text-xs">2</Badge>
              </TabsTrigger>
            </TabsList>
            
            <div className="py-8 min-h-[400px]">
                <TabsContent value="descripcion" className="mt-0 focus-visible:outline-none prose prose-slate max-w-none">
                  {clase.content ? (
                      <div dangerouslySetInnerHTML={{ __html: clase.content }} className="text-muted-foreground text-lg leading-relaxed" />
                  ) : (
                      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                          Sin descripción larga provista.
                      </div>
                  )}
                </TabsContent>
                
                <TabsContent value="recursos" className="mt-0 focus-visible:outline-none">
                  <div className="grid gap-4 sm:grid-cols-2">
                      <Card className="hover:border-primary/50 transition-colors group cursor-pointer shadow-sm">
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                              <FileText className="h-6 w-6 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors">Material Complementario</p>
                            <p className="text-sm text-muted-foreground mt-0.5">Documento PDF • 2.4 MB</p>
                          </div>
                          <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary">
                              <Download className="h-5 w-5" />
                          </Button>
                        </CardContent>
                      </Card>
                  </div>
                </TabsContent>
                
                {clase.quiz && (
                <TabsContent value="quiz" className="mt-0 focus-visible:outline-none">
                  <QuizComponent quiz={clase.quiz} onComplete={handleQuizComplete} />
                </TabsContent>
                )}
                
                <TabsContent value="comentarios" id="comentarios-tab-content" className="mt-0 focus-visible:outline-none">
                  <div className="flex items-center gap-3 mb-8">
                      <MessageSquare className="h-6 w-6 text-primary" />
                      <h3 className="text-xl font-bold">Discusión de la clase</h3>
                  </div>
                  <ComentariosComponent lessonId={clase.id} />
                </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
      
      {/* Sidebar con índice del curso */}
      <aside className="lg:col-span-1 border-l pl-0 lg:pl-8">
        <div className="sticky top-24 pb-10">
          <div className="mb-4">
              <h3 className="font-bold text-lg leading-tight line-clamp-2">{course.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">Navegación del curso</p>
          </div>
          
          <div className="border rounded-2xl bg-card overflow-hidden shadow-sm">
            <Accordion type="multiple" defaultValue={[modulo.id]} className="w-full">
              {course.modules.map((m, idx) => (
                <AccordionItem value={m.id} key={m.id} className="border-b-0 last:border-b-0 px-1">
                  <AccordionTrigger className={`text-[13px] hover:no-underline font-semibold px-3 py-3 rounded-xl my-1 transition-colors ${m.id === modulo.id ? 'bg-primary/5 text-primary' : 'bg-muted/30 data-[state=open]:bg-muted/50'}`}>
                    <div className="flex flex-col items-start text-left gap-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Módulo {idx + 1}</span>
                        <span className="line-clamp-2 leading-snug">{m.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 pt-1">
                    <ul className="space-y-1 mt-1 px-1">
                      {m.lessons.map(l => {
                        const isCurrent = clase.id === l.id;
                        return (
                        <li key={l.id}>
                          <Link 
                            to={`/${slug}/clase/${l.id}`}
                            className={`flex items-center gap-3 text-sm px-3 py-2.5 rounded-lg transition-colors border ${
                              isCurrent 
                                ? "bg-background border-primary/20 shadow-sm font-semibold text-primary" 
                                : "hover:bg-muted border-transparent text-muted-foreground"
                            }`}
                          >
                            {claseCompletada(l.id) ? (
                              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            ) : (
                              <Circle className={`h-4 w-4 shrink-0 ${isCurrent ? 'text-primary' : 'opacity-30'}`} />
                            )}
                            <span className="line-clamp-2 leading-tight">{l.title}</span>
                          </Link>
                        </li>
                      )})}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </aside>
    </div>
  );
}
