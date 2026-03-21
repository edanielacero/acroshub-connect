import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { courses } from "@/data/mockData";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, GripVertical, Plus, Video, FileText, AlertTriangle, Trash2, Paperclip, UploadCloud } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lesson } from "@/data/mockData";

export default function CourseEditor() {
  const { id } = useParams();
  const course = courses.find(c => c.id === id);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(course?.modules[0]?.lessons[0] || null);
  const [videoTab, setVideoTab] = useState<'upload' | 'url'>('url');
  
  // Multiple files attachments
  const [attachedFiles, setAttachedFiles] = useState([
    { name: "guia-de-estudio.pdf", size: "2.4 MB" },
    { name: "recursos-adicionales.zip", size: "15.1 MB" }
  ]);
  
  // Create Module States
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");

  const handleCreateModule = () => {
    if (!newModuleName.trim()) {
      toast.error("El nombre del módulo es requerido");
      return;
    }
    toast.success(`Módulo "${newModuleName}" creado. Ya puedes agregarle contenido.`);
    setIsModuleDialogOpen(false);
    setNewModuleName("");
  };

  if (!course) return <ProfesorLayout><p>Curso no encontrado</p></ProfesorLayout>;

  return (
    <ProfesorLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/dashboard/hubs/${course.hubId}/cursos`}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <Input defaultValue={course.title} className="px-0 text-xl font-bold border-none shadow-none focus-visible:ring-0 sm:text-2xl" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Módulos</h3>
              <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" title="Añadir Módulo"><Plus className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Añadir nuevo módulo</DialogTitle>
                    <DialogDescription>
                      Los módulos agrupan múltiples clases para que el curso esté ordenado. Recomienda nombrar este módulo de forma clara.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="module-title">Nombre del Módulo</Label>
                      <Input 
                        id="module-title" 
                        placeholder="Ej. Módulo 1: Introducción" 
                        value={newModuleName}
                        onChange={(e) => setNewModuleName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateModule();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsModuleDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateModule}>Añadir Módulo</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Accordion type="multiple" defaultValue={course.modules.map(m => m.id)} className="space-y-1">
              {course.modules.map(mod => (
                <AccordionItem key={mod.id} value={mod.id} className="overflow-hidden rounded-lg border">
                  <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{mod.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-2">
                    {mod.lessons.map(lesson => (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`w-full rounded-md px-3 py-2 text-left text-xs transition-colors ${selectedLesson?.id === lesson.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}
                      >
                        {lesson.title}
                      </button>
                    ))}
                    <Button variant="ghost" size="sm" className="mt-1 w-full text-xs">
                      <Plus className="mr-1 h-3 w-3" />Agregar clase
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {selectedLesson ? (
            <Card>
              <CardContent className="space-y-6 p-4 sm:p-6">
                <div className="space-y-2">
                  <Label>Nombre de la clase</Label>
                  <Input defaultValue={selectedLesson.title} />
                </div>

                <div className="flex items-center gap-3">
                  <Switch defaultChecked={selectedLesson.isFreePreview} />
                  <Label>Es preview gratuita</Label>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Video className="h-4 w-4" />Video</Label>
                  <Tabs value={videoTab} onValueChange={(v) => setVideoTab(v as 'upload' | 'url')}>
                    <TabsList className="grid h-auto w-full grid-cols-2">
                      <TabsTrigger value="upload">Subir video</TabsTrigger>
                      <TabsTrigger value="url">Importar URL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload">
                      <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground sm:p-8">
                        Arrastra un video o haz clic para seleccionar
                      </div>
                    </TabsContent>
                    <TabsContent value="url" className="space-y-2">
                      <Input placeholder="https://youtube.com/watch?v=..." defaultValue={selectedLesson.videoUrl} />
                      <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                        <span>La URL será visible para los alumnos. Para proteger tu contenido, usa la opción de subir video.</span>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center gap-2"><Paperclip className="h-4 w-4" />Archivos adjuntos</Label>
                  
                  {/* Zona de subida */}
                  <div className="rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-8 text-center cursor-pointer group">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Haz clic o arrastra tus archivos aquí</p>
                        <p className="text-sm text-muted-foreground mt-1">PDF, DOC, ZIP, Audio, etc. (Máx. 50MB por archivo)</p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de archivos subidos */}
                  {attachedFiles.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {attachedFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-muted rounded-md shrink-0">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{file.size}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Contenido de texto</Label>
                  <Textarea rows={6} defaultValue="Contenido de ejemplo para la clase..." />
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value="quiz">
                    <AccordionTrigger>Quiz ({selectedLesson.quiz?.length || 0} preguntas)</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      {selectedLesson.quiz?.map((q, qi) => (
                        <Card key={q.id}>
                          <CardContent className="space-y-2 p-4">
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
                      <Button variant="outline" size="sm" className="w-full sm:w-auto"><Plus className="mr-1 h-4 w-4" />Agregar pregunta</Button>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button className="w-full sm:w-auto" onClick={() => toast.success("Clase guardada correctamente")}>Guardar clase</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              Selecciona una clase para editarla
            </div>
          )}
        </div>
      </div>
    </ProfesorLayout>
  );
}
