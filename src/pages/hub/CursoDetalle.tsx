import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { hubs, courses, getCurrentAlumno, lessonProgress, profesores } from "@/data/mockData";
import { usePreview } from "@/components/layout/PreviewProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlayCircle, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function CursoDetalle() {
  const { slug, id } = useParams();
  const hub = hubs.find(h => h.slug === slug);
  const course = courses.find(c => c.id === id && c.hubId === hub?.id);
  const prof = profesores.find(p => p.id === hub?.profesorId);
  
  const { demoMode, isOwner } = usePreview();
  const alumno = getCurrentAlumno();
  
  const defaultOption = course?.pricingOptions && course.pricingOptions.length > 0 
    ? course.pricingOptions[0].id 
    : 'one_time';
    
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(defaultOption);

  if (!hub || !course) return <div className="p-8 text-center">Curso no encontrado</div>;

  const hasAccess = isOwner ? (demoMode === 'con-acceso') : alumno.purchasedCourses.includes(course.id);
  const modulosCount = course.modules.length;
  const clasesCount = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

  // Helper metrics for access
  const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
  const completed = alumno.completedLessons.filter(lessonId => allLessonIds.includes(lessonId));
  const progresoGeneral = clasesCount > 0 ? Math.round((completed.length / clasesCount) * 100) : 0;
  
  const primeraClase = course.modules[0]?.lessons[0];
  const ultimaClaseVistaId = lessonProgress
    .filter(p => p.userId === alumno.id && allLessonIds.includes(p.lessonId))
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]?.lessonId;
    
  const ultimaClaseVista = ultimaClaseVistaId 
    ? course.modules.flatMap(m => m.lessons).find(l => l.id === ultimaClaseVistaId) 
    : undefined;

  const claseCompletada = (lessonId: string) => alumno.completedLessons.includes(lessonId);

  const isManualPayment = !prof?.stripeConnected && !!prof?.manualPaymentLink;

  const handleComprar = () => {
    if (isManualPayment && prof?.manualPaymentLink) {
      window.open(prof.manualPaymentLink, '_blank');
    } else {
      toast.success("Redirigiendo a pasarela de pago (Stripe)...");
    }
  };

  // VISTA CON ACCESO - Redirige directo al reproductor
  if (hasAccess) {
    const targetClaseId = ultimaClaseVista?.id || primeraClase?.id;
    if (targetClaseId) {
      return <Navigate to={`/${slug}/clase/${targetClaseId}`} replace />;
    }
    // Fallback por si el curso no tiene clases
    return <div className="p-8 text-center">El curso aún no tiene contenido publicado.</div>;
  }

  // VISTA SIN ACCESO (SALES PAGE)
  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero del curso */}
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Badge className="mb-4 px-3 py-1 font-medium bg-primary/10 text-primary hover:bg-primary/20 cursor-default border-primary/20">
            {modulosCount} módulos · {clasesCount} clases
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">{course.title}</h1>
          <p className="text-xl text-muted-foreground mt-5 leading-relaxed">{course.description}</p>
          
          {/* Contenido del curso (lista de módulos) */}
          <div className="mt-12 bg-card border rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              Contenido del curso
            </h2>
            <Accordion type="multiple" className="space-y-3" defaultValue={[course.modules[0]?.id]}>
              {course.modules.map(modulo => (
                <AccordionItem value={modulo.id} key={modulo.id} className="border px-4 py-1 rounded-xl bg-muted/10">
                  <AccordionTrigger className="hover:no-underline rounded-lg transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-left">
                      <span className="font-semibold text-lg">{modulo.title}</span>
                      <span className="text-sm font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-md border w-fit">
                        {modulo.lessons.length} clases
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <ul className="space-y-2 mt-2">
                      {modulo.lessons.map(clase => (
                        <li key={clase.id} className="flex items-center gap-3 text-sm p-3 rounded-lg bg-background border shadow-sm">
                          {clase.isFreePreview ? (
                            <Link to={`/${slug}/clase/${clase.id}`} className="flex items-center gap-3 text-primary font-medium hover:underline flex-1">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <PlayCircle className="h-4 w-4" />
                              </div>
                              <span className="line-clamp-1">{clase.title}</span>
                              <Badge variant="secondary" className="text-xs ml-auto bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Preview Gratuita</Badge>
                            </Link>
                          ) : (
                            <span className="flex items-center gap-3 text-muted-foreground flex-1">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Lock className="h-4 w-4 opacity-50" />
                              </div>
                              <span className="line-clamp-1">{clase.title}</span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
        
        {/* Card de compra (sticky) */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 shadow-xl border-primary/20 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-primary/50 w-full" />
            <CardContent className="p-6">
              <h3 className="font-bold text-xl mb-6">Opciones de acceso</h3>
              
              {/* Opciones de precio */}
              <RadioGroup value={opcionSeleccionada} onValueChange={setOpcionSeleccionada} className="space-y-3">
                {course.pricingOptions && course.pricingOptions.length > 0 ? (
                  course.pricingOptions.map(option => (
                    <div key={option.id} className={`flex items-start space-x-3 border rounded-xl p-4 cursor-pointer transition-all ${opcionSeleccionada === option.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50 border-muted-foreground/20'}`} onClick={() => setOpcionSeleccionada(option.id)}>
                      <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <div className="font-semibold text-base">
                          {option.type === 'one_time' ? 'Pago único' : option.type === 'monthly' ? 'Suscripción Mensual' : 'Suscripción Anual'}
                        </div>
                        <div className="text-3xl font-extrabold mt-1 text-primary">
                          ${option.price} <span className="text-sm font-normal text-muted-foreground">{course.currency}{option.type !== 'one_time' ? (option.type === 'monthly' ? '/mes' : '/año') : ''}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" /> 
                          {option.type === 'one_time' ? 'Acceso de por vida' : 'Cancela cuando quieras'}
                        </div>
                        {option.type === 'annual' && (
                          <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700 hover:bg-green-100 font-medium border-green-200">Ahorras un 20%</Badge>
                        )}
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className={`flex items-start space-x-3 border rounded-xl p-4 cursor-pointer transition-all ${opcionSeleccionada === 'one_time' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50 border-muted-foreground/20'}`} onClick={() => setOpcionSeleccionada('one_time')}>
                    <RadioGroupItem value="one_time" id="one_time" className="mt-1" />
                    <Label htmlFor="one_time" className="flex-1 cursor-pointer">
                      <div className="font-semibold text-base">Pago único</div>
                      <div className="text-3xl font-extrabold mt-1 text-primary">${course.price} <span className="text-sm font-normal text-muted-foreground">{course.currency}</span></div>
                      <div className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" /> Acceso de por vida
                      </div>
                    </Label>
                  </div>
                )}
              </RadioGroup>
              
              <Button className="w-full mt-6 h-12 text-base font-bold shadow-md" size="lg" onClick={handleComprar}>
                {isManualPayment ? 'Contactar para comprar' : 'Comprar ahora'}
              </Button>
              
              <div className="mt-4 pt-4 border-t text-center space-y-2">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                  <Lock className="h-3 w-3" /> {isManualPayment ? 'Pago acordado directo con experto' : 'Pago seguro con Stripe'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isManualPayment ? 'El acceso se brindará manualmente' : 'Garantía de devolución de 7 días'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
