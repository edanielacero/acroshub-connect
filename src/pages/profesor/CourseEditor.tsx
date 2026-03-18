import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { courses } from "@/data/mockData";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, GripVertical, Plus, Video, FileText, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lesson, Module } from "@/data/mockData";

export default function CourseEditor() {
  const { id } = useParams();
  const course = courses.find(c => c.id === id);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(course?.modules[0]?.lessons[0] || null);
  const [videoTab, setVideoTab] = useState<'upload' | 'url'>('url');

  if (!course) return <ProfesorLayout><p>Curso no encontrado</p></ProfesorLayout>;

  return (
    <ProfesorLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/dashboard/hubs/${course.hubId}`}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <Input defaultValue={course.title} className="text-xl font-bold border-none shadow-none px-0 text-2xl focus-visible:ring-0" />
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar - Modules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Módulos</h3>
              <Button variant="ghost" size="sm"><Plus className="h-4 w-4" /></Button>
            </div>
            <Accordion type="multiple" defaultValue={course.modules.map(m => m.id)} className="space-y-1">
              {course.modules.map(mod => (
                <AccordionItem key={mod.id} value={mod.id} className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span>{mod.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-2">
                    {mod.lessons.map(lesson => (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`w-full text-left text-xs px-3 py-2 rounded-md transition-colors ${selectedLesson?.id === lesson.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                      >
                        {lesson.title}
                      </button>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full mt-1 text-xs">
                      <Plus className="h-3 w-3 mr-1" />Agregar clase
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Main content - Lesson editor */}
          {selectedLesson ? (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label>Nombre de la clase</Label>
                  <Input defaultValue={selectedLesson.title} />
                </div>

                <div className="flex items-center gap-3">
                  <Switch defaultChecked={selectedLesson.isFreePreview} />
                  <Label>Es preview gratuita</Label>
                </div>

                {/* Video */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Video className="h-4 w-4" />Video</Label>
                  <Tabs value={videoTab} onValueChange={(v) => setVideoTab(v as 'upload' | 'url')}>
                    <TabsList>
                      <TabsTrigger value="upload">Subir video</TabsTrigger>
                      <TabsTrigger value="url">Importar URL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                        Arrastra un video o haz clic para seleccionar
                      </div>
                    </TabsContent>
                    <TabsContent value="url" className="space-y-2">
                      <Input placeholder="https://youtube.com/watch?v=..." defaultValue={selectedLesson.videoUrl} />
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 text-sm">
                        <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                        <span>La URL será visible para los alumnos. Para proteger tu contenido, usa la opción de subir video.</span>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* PDF */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><FileText className="h-4 w-4" />PDF adjunto</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground text-sm">
                    Subir PDF
                  </div>
                </div>

                {/* Text content */}
                <div className="space-y-2">
                  <Label>Contenido de texto</Label>
                  <Textarea rows={6} defaultValue="Contenido de ejemplo para la clase..." />
                </div>

                {/* Quiz */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="quiz">
                    <AccordionTrigger>Quiz ({selectedLesson.quiz?.length || 0} preguntas)</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      {selectedLesson.quiz?.map((q, qi) => (
                        <Card key={q.id}>
                          <CardContent className="p-4 space-y-2">
                            <Input defaultValue={q.question} className="font-medium" />
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input type="radio" name={`q-${qi}`} defaultChecked={oi === q.correctIndex} />
                                <Input defaultValue={opt} className="flex-1" />
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))}
                      <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Agregar pregunta</Button>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button onClick={() => toast.success("Clase guardada correctamente")}>Guardar clase</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center text-muted-foreground p-12">
              Selecciona una clase para editarla
            </div>
          )}
        </div>
      </div>
    </ProfesorLayout>
  );
}
