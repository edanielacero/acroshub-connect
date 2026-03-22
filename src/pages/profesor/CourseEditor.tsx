import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { useProfesorData } from "@/hooks/useProfesorData";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, GripVertical, Plus, Video, FileText, AlertTriangle, Trash2, Paperclip, UploadCloud, Loader2, MoreHorizontal, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { courses, isLoading } = useProfesorData();
  const course = courses.find((c: any) => c.id === id);

  // Fetch modules with nested lessons for this course
  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ['modules', id],
    queryFn: async () => {
      const { data: mods, error } = await supabase
        .from('modules')
        .select('*, lessons(*)')
        .eq('course_id', id!)
        .order('order_index', { ascending: true });
      if (error) throw error;
      // Sort lessons inside each module
      return (mods || []).map((m: any) => ({
        ...m,
        lessons: (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
      }));
    },
    enabled: !!id
  });

  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [videoTab, setVideoTab] = useState<'upload' | 'url'>('url');
  
  const [courseTitle, setCourseTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonIsFree, setLessonIsFree] = useState(false);
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonContent, setLessonContent] = useState("");

  useEffect(() => {
    if (course) {
      setCourseTitle(course.title || "");
    }
  }, [course]);

  // Auto-select first lesson when modules load
  useEffect(() => {
    if (!selectedLesson && modules.length > 0 && modules[0].lessons?.length > 0) {
      setSelectedLesson(modules[0].lessons[0]);
    }
  }, [modules]);
  
  // Unsaved changes tracking
  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState(false);
  
  // Multiple files attachments
  const [attachedFiles, setAttachedFiles] = useState<{name: string, size: string}[]>([]);
  
  // Create Module States
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [isCreatingModule, setIsCreatingModule] = useState(false);

  const handleCreateModule = async () => {
    if (!newModuleName.trim()) {
      toast.error("El nombre del módulo es requerido");
      return;
    }
    setIsCreatingModule(true);
    const nextOrder = modules.length;
    const { error } = await supabase.from('modules').insert({
      course_id: id,
      title: newModuleName,
      order_index: nextOrder
    });
    setIsCreatingModule(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Módulo "${newModuleName}" creado. Ya puedes agregarle contenido.`);
    queryClient.invalidateQueries({ queryKey: ['modules', id] });
    setIsModuleDialogOpen(false);
    setNewModuleName("");
  };

  // Create Lesson handler
  const handleCreateLesson = async (moduleId: string) => {
    const mod = modules.find((m: any) => m.id === moduleId);
    const nextOrder = mod?.lessons?.length || 0;
    const { data: newLesson, error } = await supabase.from('lessons').insert({
      module_id: moduleId,
      title: `Nueva clase ${nextOrder + 1}`,
      order_index: nextOrder,
      is_free_preview: false
    }).select().single();
    if (error) { toast.error(error.message); return; }
    toast.success("Clase creada. Seléccionala para editarla.");
    queryClient.invalidateQueries({ queryKey: ['modules', id] });
    setSelectedLesson(newLesson);
  };

  // Save Lesson handler
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const handleSaveLesson = async () => {
    if (!selectedLesson) return;
    setIsSavingLesson(true);
    const { error } = await supabase.from('lessons').update({
      title: lessonTitle,
      is_free_preview: lessonIsFree,
      video_url: lessonVideoUrl || null,
      content: lessonContent || null,
    }).eq('id', selectedLesson.id);
    setIsSavingLesson(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Clase guardada correctamente");
    // Update local selected lesson so unsaved changes tracking resets
    setSelectedLesson({ ...selectedLesson, title: lessonTitle, is_free_preview: lessonIsFree, video_url: lessonVideoUrl, content: lessonContent });
    queryClient.invalidateQueries({ queryKey: ['modules', id] });
  };

  // Delete Lesson handler
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<any>(null);
  const handleDeleteLesson = async (lessonId: string) => {
    // First verify the lesson exists by trying to fetch it
    const { data: existing } = await supabase.from('lessons').select('id').eq('id', lessonId).single();
    if (!existing) {
      toast.error("No se encontró la clase o no tienes permisos para eliminarla.");
      setDeleteLessonTarget(null);
      return;
    }
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (error) { toast.error(error.message); setDeleteLessonTarget(null); return; }
    // Verify it was actually deleted
    const { data: check } = await supabase.from('lessons').select('id').eq('id', lessonId).single();
    if (check) {
      toast.error("No se pudo eliminar la clase. Verifica los permisos RLS en Supabase.");
      setDeleteLessonTarget(null);
      return;
    }
    toast.success("Clase eliminada");
    setDeleteLessonTarget(null);
    if (selectedLesson?.id === lessonId) setSelectedLesson(null);
    queryClient.invalidateQueries({ queryKey: ['modules', id] });
  };

  // Delete Module handler — delete lessons first to avoid RLS cascade issues
  const [deleteModuleTarget, setDeleteModuleTarget] = useState<any>(null);
  const handleDeleteModule = async (moduleId: string) => {
    // First delete all lessons in this module
    await supabase.from('lessons').delete().eq('module_id', moduleId);
    // Then delete the module
    const { error } = await supabase.from('modules').delete().eq('id', moduleId);
    if (error) { toast.error(error.message); return; }
    toast.success("Módulo eliminado");
    setDeleteModuleTarget(null);
    queryClient.invalidateQueries({ queryKey: ['modules', id] });
  };

  // Rename Module handler
  const [renameModuleTarget, setRenameModuleTarget] = useState<any>(null);
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const handleRenameModule = async () => {
    if (!renameModuleTarget || !editModuleTitle.trim()) return;
    const { error } = await supabase.from('modules').update({ title: editModuleTitle }).eq('id', renameModuleTarget.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Módulo renombrado");
    setRenameModuleTarget(null);
    queryClient.invalidateQueries({ queryKey: ['modules', id] });
  };

  // Quiz Questions - fetched from Supabase
  const { data: quizQuestions = [] } = useQuery({
    queryKey: ['quiz', selectedLesson?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('quiz_questions').select('*').eq('lesson_id', selectedLesson!.id).order('order_index');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedLesson?.id
  });

  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [newQuizQuestion, setNewQuizQuestion] = useState("");
  const [newQuizOptions, setNewQuizOptions] = useState(["", "", "", ""]);
  const [newQuizCorrectIndex, setNewQuizCorrectIndex] = useState(0);

  const openQuizDialogForCreate = () => {
    setEditingQuizId(null);
    setNewQuizQuestion("");
    setNewQuizOptions(["", "", "", ""]);
    setNewQuizCorrectIndex(0);
    setIsQuizDialogOpen(true);
  };

  const openQuizDialogForEdit = (q: any) => {
    setEditingQuizId(q.id);
    setNewQuizQuestion(q.question);
    // Pad options to always have 4 slots
    const opts = [...(q.options as string[])];
    while (opts.length < 4) opts.push("");
    setNewQuizOptions(opts);
    setNewQuizCorrectIndex(q.correct_index);
    setIsQuizDialogOpen(true);
  };

  const handleSaveQuizQuestion = async () => {
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

    if (editingQuizId) {
      // Update existing
      const { error } = await supabase.from('quiz_questions').update({
        question: newQuizQuestion,
        options: filteredOptions,
        correct_index: newQuizCorrectIndex,
      }).eq('id', editingQuizId);
      if (error) { toast.error(error.message); return; }
      toast.success("Pregunta actualizada");
    } else {
      // Insert new
      const { error } = await supabase.from('quiz_questions').insert({
        lesson_id: selectedLesson!.id,
        question: newQuizQuestion,
        options: filteredOptions,
        correct_index: newQuizCorrectIndex,
        order_index: quizQuestions.length
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Pregunta agregada al Quiz correctamente");
    }
    queryClient.invalidateQueries({ queryKey: ['quiz', selectedLesson?.id] });
    setIsQuizDialogOpen(false);
  };

  const handleDeleteQuizQuestion = async (questionId: string) => {
    const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId);
    if (error) { toast.error(error.message); return; }
    toast.success("Pregunta eliminada");
    queryClient.invalidateQueries({ queryKey: ['quiz', selectedLesson?.id] });
  };

  const handleUpdateQuizQuestion = async (questionId: string, updates: any) => {
    const { error } = await supabase.from('quiz_questions').update(updates).eq('id', questionId);
    if (error) { toast.error(error.message); return; }
    toast.success("Pregunta actualizada");
    queryClient.invalidateQueries({ queryKey: ['quiz', selectedLesson?.id] });
  };

  // Update tracked states when switching lessons
  useEffect(() => {
    if (selectedLesson) {
      setLessonTitle(selectedLesson.title || "");
      setLessonIsFree(!!selectedLesson.is_free_preview);
      setLessonVideoUrl(selectedLesson.video_url || "");
      setLessonContent(selectedLesson.content || "");
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
    if (lessonIsFree !== !!selectedLesson.is_free_preview) {
      unsavedChanges.push({ field: "Preview Gratuita", original: selectedLesson.is_free_preview ? "Sí" : "No", new: lessonIsFree ? "Sí" : "No" });
    }
    if (lessonVideoUrl !== (selectedLesson.video_url || "")) {
      unsavedChanges.push({ field: "URL del Video", original: selectedLesson.video_url || "(Vacío)", new: lessonVideoUrl || "(Vacío)" });
    }
  }

  const handleBackClick = () => {
    if (unsavedChanges.length > 0) {
      setIsConfirmLeaveOpen(true);
    } else {
      navigate(`/dashboard/hubs/${course?.hub_id}/cursos`);
    }
  };

  if (isLoading || loadingModules) return <ProfesorLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></ProfesorLayout>;
  if (!course) return <ProfesorLayout><p className="p-8 text-center text-muted-foreground">Curso no encontrado</p></ProfesorLayout>;

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
                    <Button onClick={handleCreateModule} disabled={isCreatingModule}>
                      {isCreatingModule ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isCreatingModule ? 'Creando...' : 'Añadir Módulo'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Accordion type="multiple" defaultValue={modules.map((m: any) => m.id)} className="space-y-1">
              {modules.map((mod: any) => (
                <AccordionItem key={mod.id} value={mod.id} className="overflow-hidden rounded-lg border">
                  <div className="flex items-center">
                    <AccordionTrigger className="flex-1 px-3 py-2 text-sm hover:no-underline">
                      <div className="flex items-center gap-2 text-left flex-1 min-w-0">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1">{mod.title}</span>
                      </div>
                    </AccordionTrigger>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mr-1">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setRenameModuleTarget(mod); setEditModuleTitle(mod.title); }}>
                          <Pencil className="mr-2 h-4 w-4" /> Renombrar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-white" onClick={() => setDeleteModuleTarget(mod)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <AccordionContent className="px-2 pb-2">
                    {mod.lessons?.map((lesson: any) => (
                      <div key={lesson.id} className="flex items-center gap-1 group">
                        <button
                          onClick={() => setSelectedLesson(lesson)}
                          className={`flex-1 rounded-md px-3 py-2 text-left text-xs transition-colors ${selectedLesson?.id === lesson.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}
                        >
                          {lesson.title}
                        </button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-destructive hover:text-white" onClick={() => setDeleteLessonTarget(lesson)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="mt-1 w-full text-xs" onClick={() => handleCreateLesson(mod.id)}>
                      <Plus className="mr-1 h-3 w-3" />Agregar clase
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {modules.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-6">Aún no hay módulos. Crea uno con el botón +</p>
            )}
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
                          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:bg-destructive hover:text-white" onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}>
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
                    <AccordionTrigger>Quiz ({quizQuestions.length} preguntas)</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      {quizQuestions.map((q: any) => (
                        <Card key={q.id}>
                          <CardContent className="space-y-2 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium flex-1">{q.question}</p>
                              <div className="flex gap-1 shrink-0">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-primary hover:text-white" onClick={() => openQuizDialogForEdit(q)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-destructive hover:text-white" onClick={() => {
                                  if (confirm(`¿Eliminar la pregunta "${q.question.substring(0,30)}..."?`)) handleDeleteQuizQuestion(q.id);
                                }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            {(q.options as string[]).map((opt: string, oi: number) => (
                              <div key={oi} className={`flex items-center gap-2 px-2 py-1 rounded ${oi === q.correct_index ? 'bg-green-500/10 text-green-700 font-medium' : 'text-muted-foreground'}`}>
                                <span className="text-xs w-5">{oi === q.correct_index ? '✅' : `${oi + 1}.`}</span>
                                <span className="text-sm">{opt}</span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))}
                      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto mt-2" onClick={openQuizDialogForCreate}>
                            <Plus className="mr-1 h-4 w-4" />Agregar pregunta nueva
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>{editingQuizId ? 'Editar Pregunta' : 'Nueva Pregunta'}</DialogTitle>
                            <DialogDescription>
                              {editingQuizId ? 'Modifica la pregunta y las opciones. Marca el círculo de la respuesta correcta.' : 'Escribe la pregunta y define las posibles respuestas. Marca el círculo de la respuesta correcta.'}
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
                                      className="shrink-0 text-muted-foreground hover:bg-destructive hover:text-white mt-0.5"
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
                            <Button onClick={handleSaveQuizQuestion}>{editingQuizId ? 'Guardar Cambios' : 'Guardar Pregunta'}</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button className="w-full sm:w-auto" onClick={handleSaveLesson} disabled={isSavingLesson}>
                  {isSavingLesson ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSavingLesson ? 'Guardando...' : 'Guardar clase'}
                </Button>
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
            <Button variant="destructive" className="w-full sm:w-auto order-3 sm:order-1" onClick={() => navigate(`/dashboard/hubs/${course?.hub_id}/cursos`)}>
              Salir sin guardar
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsConfirmLeaveOpen(false)}>Cancelar</Button>
              <Button className="w-full sm:w-auto" onClick={async () => {
                // Save course title
                if (course && courseTitle !== course.title) {
                  await supabase.from('courses').update({ title: courseTitle }).eq('id', course.id);
                  queryClient.invalidateQueries({ queryKey: ['courses'] });
                }
                // Save current lesson if selected
                if (selectedLesson) {
                  await supabase.from('lessons').update({
                    title: lessonTitle,
                    is_free_preview: lessonIsFree,
                    video_url: lessonVideoUrl || null,
                  }).eq('id', selectedLesson.id);
                  queryClient.invalidateQueries({ queryKey: ['modules', id] });
                }
                toast.success("Todos los cambios fueron guardados exitosamente."); 
                navigate(`/dashboard/hubs/${course?.hub_id}/cursos`);
              }}>Guardar y salir</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Module Dialog */}
      <Dialog open={!!renameModuleTarget} onOpenChange={(open) => { if (!open) setRenameModuleTarget(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Renombrar módulo</DialogTitle>
            <DialogDescription>Escribe el nuevo nombre para este módulo.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={editModuleTitle} 
              onChange={e => setEditModuleTitle(e.target.value)} 
              placeholder="Nombre del módulo"
              onKeyDown={e => { if (e.key === 'Enter') handleRenameModule(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameModuleTarget(null)}>Cancelar</Button>
            <Button onClick={handleRenameModule}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Module Confirmation */}
      <AlertDialog open={!!deleteModuleTarget} onOpenChange={(open) => { if (!open) setDeleteModuleTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> ¿Eliminar módulo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el módulo <span className="font-semibold">"{deleteModuleTarget?.title}"</span> y todas sus clases de forma permanente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteModule(deleteModuleTarget.id)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lesson Confirmation */}
      <AlertDialog open={!!deleteLessonTarget} onOpenChange={(open) => { if (!open) setDeleteLessonTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> ¿Eliminar clase?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la clase <span className="font-semibold">"{deleteLessonTarget?.title}"</span> de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteLesson(deleteLessonTarget.id)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </ProfesorLayout>
  );
}
