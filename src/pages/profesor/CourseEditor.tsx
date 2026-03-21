import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { courses } from "@/data/mockData";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const course = courses.find(c => c.id === id);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(course?.modules[0]?.lessons[0] || null);
  const [videoTab, setVideoTab] = useState<'upload' | 'url'>('url');
  
  // Controlled fields to track unsaved changes
  const [courseTitle, setCourseTitle] = useState(course?.title || "");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonIsFree, setLessonIsFree] = useState(false);
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  
  // Unsaved changes tracking
  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState(false);
  
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

  // Create Quiz Question States
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [newQuizQuestion, setNewQuizQuestion] = useState("");
  const [newQuizOptions, setNewQuizOptions] = useState(["", "", "", ""]);
  const [newQuizCorrectIndex, setNewQuizCorrectIndex] = useState(0);

  const handleCreateQuizQuestion = () => {
    if (!newQuizQuestion.trim()) {
      toast.error("La pregunta no puede estar vacía");
      return;
    }
    const filteredOptions = newQuizOptions.filter(opt => opt.trim());
    if (filteredOptions.length < 2) {
      toast.error("Debes proveer al menos 2 opciones de respuesta válidas");
      return;
    }
    if (newQuizCorrectIndex >= filteredOptions.length || !newQuizOptions[newQuizCorrectIndex].trim()) {
      toast.error("La opción correcta seleccionada está vacía o es inválida");
      return;
    }
    
    toast.success("Pregunta agregada al Quiz correctamente");
    setIsQuizDialogOpen(false);
    setNewQuizQuestion("");
    setNewQuizOptions(["", "", "", ""]);
    setNewQuizCorrectIndex(0);
  };

  // Update tracked states when switching lessons
  useEffect(() => {
    if (selectedLesson) {
      setLessonTitle(selectedLesson.title || "");
      setLessonIsFree(!!selectedLesson.isFreePreview);
      setLessonVideoUrl(selectedLesson.videoUrl || "");
      setLessonContent("Contenido de ejemplo para la clase...");
    }
  }, [selectedLesson]);

  // Compute Unsaved Changes
  const unsavedChanges = [];
  if (course && courseTitle !== course.title) {
    unsavedChanges.push({ field: "Título del Curso", original: course.title, new: courseTitle });
  }
  if (selectedLesson) {
    if (lessonTitle !== selectedLesson.title) {
      unsavedChanges.push({ field: "Título de la clase", original: selectedLesson.title, new: lessonTitle });
    }
    if (lessonIsFree !== !!selectedLesson.isFreePreview) {
      unsavedChanges.push({ field: "Preview Gratuita", original: selectedLesson.isFreePreview ? "Sí" : "No", new: lessonIsFree ? "Sí" : "No" });
    }
    if (lessonVideoUrl !== (selectedLesson.videoUrl || "")) {
      unsavedChanges.push({ field: "URL del Video", original: selectedLesson.videoUrl || "(Vacío)", new: lessonVideoUrl || "(Vacío)" });
    }
    if (lessonContent !== "Contenido de ejemplo para la clase...") {
      unsavedChanges.push({ field: "Contenido de texto", original: "Contenido de ejemplo...", new: lessonContent });
    }
  }

  const handleBackClick = () => {
    if (unsavedChanges.length > 0) {
      setIsConfirmLeaveOpen(true);
    } else {
      navigate(`/dashboard/hubs/${course?.hubId}/cursos`);
    }
  };

  if (!course) return <ProfesorLayout><p>Curso no encontrado</p></ProfesorLayout>;

  return (
    <ProfesorLayout>
      <div className="space-y-4 animate-fade-in pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} className="px-0 text-xl font-bold border-none shadow-none focus-visible:ring-0 sm:text-2xl" />
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
                  <Input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} />
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={lessonIsFree} onCheckedChange={setLessonIsFree} />
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
                      <Input placeholder="https://youtube.com/watch?v=..." value={lessonVideoUrl} onChange={e => setLessonVideoUrl(e.target.value)} />
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
                  <Textarea rows={6} value={lessonContent} onChange={e => setLessonContent(e.target.value)} />
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
                      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto mt-2">
                            <Plus className="mr-1 h-4 w-4" />Agregar pregunta nueva
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Nueva Pregunta</DialogTitle>
                            <DialogDescription>
                              Escribe la pregunta y define las posibles respuestas. Marca el círculo de la respuesta correcta.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                            <div className="space-y-2">
                              <Label>Pregunta</Label>
                              <Input 
                                placeholder="Ej. ¿Qué es React?" 
                                value={newQuizQuestion}
                                onChange={(e) => setNewQuizQuestion(e.target.value)}
                              />
                            </div>
                            <div className="space-y-3 pt-2">
                              <Label>Opciones de Respuesta</Label>
                              {newQuizOptions.map((opt, i) => (
                                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${newQuizCorrectIndex === i ? 'border-primary bg-primary/5' : 'bg-card'}`}>
                                  <div className="pt-2.5">
                                    <input 
                                      type="radio" 
                                      name="correct-option" 
                                      checked={newQuizCorrectIndex === i}
                                      onChange={() => setNewQuizCorrectIndex(i)}
                                      className="scale-125 cursor-pointer accent-primary" 
                                    />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <Input 
                                      placeholder={`Opción ${i + 1}`} 
                                      value={opt}
                                      onChange={(e) => {
                                        const newOpts = [...newQuizOptions];
                                        newOpts[i] = e.target.value;
                                        setNewQuizOptions(newOpts);
                                      }}
                                      className={newQuizCorrectIndex === i ? 'border-primary/50' : ''}
                                    />
                                    {newQuizCorrectIndex === i && <p className="text-xs text-primary font-medium">Respuesta Correcta</p>}
                                  </div>
                                  {newQuizOptions.length > 2 && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="shrink-0 text-muted-foreground hover:text-destructive mt-0.5"
                                      onClick={() => {
                                        const newOpts = newQuizOptions.filter((_, idx) => idx !== i);
                                        setNewQuizOptions(newOpts);
                                        if (newQuizCorrectIndex === i) setNewQuizCorrectIndex(0);
                                        else if (newQuizCorrectIndex > i) setNewQuizCorrectIndex(prev => prev - 1);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              
                              {newQuizOptions.length < 6 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full text-muted-foreground mt-2 border border-dashed"
                                  onClick={() => setNewQuizOptions([...newQuizOptions, ""])}
                                >
                                  <Plus className="mr-1 h-4 w-4" /> Añadir otra opción
                                </Button>
                              )}
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsQuizDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCreateQuizQuestion}>Guardar Pregunta</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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

      {/* UNSAVED CHANGES DIALOG */}
      <Dialog open={isConfirmLeaveOpen} onOpenChange={setIsConfirmLeaveOpen}>
        <DialogContent className="sm:max-w-[600px] w-11/12 max-w-[95vw] p-4 sm:p-6 rounded-lg md:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Cambios sin guardar
            </DialogTitle>
            <DialogDescription>
              Aún no has guardado las últimas modificaciones hechas. A continuación, te sugerimos revisarlas en esta tabla para decidir tu siguiente acción.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 max-h-[50vh] overflow-y-auto w-full">
            <div className="rounded-md border overflow-hidden w-full overflow-x-auto">
              <table className="w-full text-sm min-w-full text-left max-w-full table-fixed">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 sm:px-4 font-medium min-w-[100px] w-[30%]">Campo</th>
                    <th className="px-3 py-2 sm:px-4 font-medium min-w-[100px] w-[35%]">Original</th>
                    <th className="px-3 py-2 sm:px-4 font-medium min-w-[100px] w-[35%]">Nuevo</th>
                  </tr>
                </thead>
                <tbody className="divide-y relative">
                  {unsavedChanges.map((change, i) => (
                    <tr key={i} className="bg-background">
                      <td className="px-3 sm:px-4 py-2 font-medium bg-background text-xs sm:text-sm truncate" title={change.field}>{change.field}</td>
                      <td className="px-3 sm:px-4 py-2 text-muted-foreground text-xs sm:text-sm bg-background border-l relative group">
                        <div className="truncate max-w-[60px] sm:max-w-none" title={change.original}>
                          {change.original}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 text-emerald-600 font-semibold bg-background text-xs sm:text-sm border-l relative group">
                        <div className="truncate max-w-[60px] sm:max-w-none" title={change.new}>
                          {change.new}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter className="sm:justify-between flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="destructive" className="w-full sm:w-auto order-3 sm:order-1" onClick={() => navigate(`/dashboard/hubs/${course?.hubId}/cursos`)}>
              Salir sin guardar
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsConfirmLeaveOpen(false)}>Cancelar</Button>
              <Button className="w-full sm:w-auto" onClick={() => {
                toast.success("Todos los cambios fueron guardados exitosamente."); 
                navigate(`/dashboard/hubs/${course?.hubId}/cursos`);
              }}>Guardar y salir</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfesorLayout>
  );
}
