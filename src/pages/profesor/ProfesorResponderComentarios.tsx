import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { getCurrentProfesor, getUnrepliedComments, getRelativeTime, comments as mockComments, courses } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, MessageSquare, Play, Video } from "lucide-react";

export default function ProfesorResponderComentarios() {
  const [searchParams] = useSearchParams();
  const prof = getCurrentProfesor();
  
  // Track comments that have been locally handled in this session
  const [repliedCommentIds, setRepliedCommentIds] = useState<Set<string>>(new Set());
  
  // Filter out any locally replied comments
  const allPending = getUnrepliedComments(prof.id).filter(c => !repliedCommentIds.has(c.id));

  // Determine active comment
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  
  // State for replying inside the preview
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [activeReplyBoxId, setActiveReplyBoxId] = useState<string | null>(null);

  useEffect(() => {
    const paramId = searchParams.get("comentarioId");
    if (paramId && allPending.some(c => c.id === paramId)) {
      setActiveCommentId(paramId);
    } else if (allPending.length > 0 && !activeCommentId) {
      setActiveCommentId(allPending[0].id);
    } else if (allPending.length === 0) {
      setActiveCommentId(null);
    }
  }, [searchParams, allPending.length, activeCommentId]);

  // Auto-scroller for the active comment preview
  useEffect(() => {
    if (activeCommentId) {
      const el = document.getElementById(`preview-comment-${activeCommentId}`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [activeCommentId]);

  const activeComment = allPending.find(c => c.id === activeCommentId) || null;

  // Derive lesson details
  let lessonInfo: any = null;
  if (activeComment) {
    for (const course of courses) {
      for (const mod of course.modules) {
        const lesson = mod.lessons.find((l: any) => l.id === activeComment.lessonId);
        if (lesson) {
          lessonInfo = {
            courseTitle: course.title,
            moduleTitle: mod.title,
            lessonTitle: lesson.title,
            videoUrl: lesson.videoUrl,
            content: lesson.content,
            lessonId: lesson.id,
          };
          break;
        }
      }
      if (lessonInfo) break;
    }
  }

  // Get ALL comments for this lesson to build the true Player preview
  const lessonComments = lessonInfo ? mockComments.filter(c => c.lessonId === lessonInfo.lessonId) : [];
  const parentComments = lessonComments.filter(c => !c.parentId);

  const handleReplySubmit = (commentId: string) => {
    const text = replyTexts[commentId];
    if (!text?.trim()) return;
    
    // Simulate API Call
    toast.success("Respuesta publicada con éxito");
    
    setRepliedCommentIds(prev => {
      const newSet = new Set(prev);
      newSet.add(commentId);
      return newSet;
    });
    
    setActiveReplyBoxId(null);
    setReplyTexts(prev => ({ ...prev, [commentId]: "" }));
    
    // Auto-advance to next pending comment if any
    const idx = allPending.findIndex(c => c.id === commentId);
    if (idx !== -1 && idx < allPending.length - 1) {
      setActiveCommentId(allPending[idx + 1].id);
    }
  };

  if (allPending.length === 0 && repliedCommentIds.size > 0) {
    return (
      <ProfesorLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in text-center px-4">
          <div className="h-20 w-20 bg-success/10 text-success rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Todo al día!</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Has respondido a todos los comentarios pendientes de tus alumnos. Excelente trabajo manteniendo a tu comunidad activa.
          </p>
          <Button asChild size="lg">
            <Link to="/dashboard">Volver al Dashboard</Link>
          </Button>
        </div>
      </ProfesorLayout>
    );
  }

  return (
    <ProfesorLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild className="shrink-0 -ml-2">
            <Link to="/dashboard/comentarios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Responder Comentarios</h1>
        </div>

        {allPending.length === 0 ? (
          <Card className="flex-1 flex items-center justify-center border-dashed bg-card">
            <div className="text-center p-8">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No hay comentarios pendientes</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Tu bandeja de entrada está limpia.</p>
              <Button asChild variant="outline">
                <Link to="/dashboard">Ir al Dashboard</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="flex-1 overflow-hidden shadow-sm">
            <div className="flex h-full flex-col bg-background relative overflow-hidden">
                {activeComment && lessonInfo ? (
                  <ScrollArea className="flex-1" id="preview-scroll-container">
                    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
                      
                      {/* Fake Breadcrumb / Header */}
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {lessonInfo.courseTitle} <span className="text-muted-foreground/30">•</span> {lessonInfo.moduleTitle}
                      </div>

                      {/* Video Player Placeholder */}
                      <div className="aspect-video rounded-xl bg-slate-900 flex items-center justify-center text-slate-50 relative overflow-hidden shadow-lg border">
                        {lessonInfo.videoUrl ? (
                          <div className="text-center">
                            <Play className="mx-auto mb-3 h-16 w-16 fill-white opacity-80" />
                            <p className="text-sm font-medium">Previsualización del Reproductor (Simulada)</p>
                          </div>
                        ) : (
                          <div className="text-center opacity-50">
                            <Video className="mx-auto mb-2 h-10 w-10" />
                            <p className="text-sm">Lección sin video</p>
                          </div>
                        )}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                          Modo Previsualización
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="space-y-4">
                        <h1 className="text-3xl font-bold tracking-tight">{lessonInfo.lessonTitle}</h1>
                        {lessonInfo.content && (
                          <div className="prose prose-sm max-w-none break-words text-muted-foreground" dangerouslySetInnerHTML={{ __html: lessonInfo.content }} />
                        )}
                      </div>

                      <hr className="border-border" />

                      {/* Comments List (Player Look & Feel) */}
                      <div className="space-y-6 pb-20">
                        <h3 className="flex items-center gap-2 font-bold text-xl"><MessageSquare className="h-6 w-6" />Comentarios de la Clase</h3>
                        
                        <div className="space-y-5">
                          {parentComments.map(c => {
                            const replies = lessonComments.filter(r => r.parentId === c.id);
                            const isTargeted = activeCommentId === c.id;
                            
                            return (
                              <div 
                                key={c.id} 
                                id={`preview-comment-${c.id}`} 
                                className={`p-5 rounded-xl transition-all duration-500 border relative ${
                                  isTargeted 
                                    ? 'bg-blue-500/5 border-blue-500/40 ring-4 ring-blue-500/10 shadow-md' 
                                    : 'bg-card border-border'
                                }`}
                              >
                                {isTargeted && (
                                  <div className="absolute -top-3 left-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                    Objetivo
                                  </div>
                                )}
                                
                                <div className="flex gap-4">
                                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">{c.userName.charAt(0)}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold">{c.userName}</span>
                                      <span className="text-xs text-muted-foreground">{getRelativeTime(c.createdAt)}</span>
                                    </div>
                                    <p className={`text-sm ${isTargeted ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{c.text}</p>
                                    
                                    {/* Action Buttons */}
                                    <div className="mt-3">
                                      {isTargeted && activeReplyBoxId !== c.id && (
                                        <Button 
                                          size="sm" 
                                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                          onClick={() => setActiveReplyBoxId(c.id)}
                                        >
                                          Responder a este comentario
                                        </Button>
                                      )}
                                      {!isTargeted && activeReplyBoxId !== c.id && (
                                        <Button variant="ghost" size="sm" className="h-auto p-0 px-2 py-1 text-xs text-muted-foreground" onClick={() => setActiveReplyBoxId(c.id)}>
                                          Responder
                                        </Button>
                                      )}
                                    </div>
                                    
                                    {/* Inline Reply Box for this specific comment */}
                                    {activeReplyBoxId === c.id && (
                                      <div className="mt-4 p-4 rounded-lg border bg-background shadow-inner animate-in fade-in slide-in-from-top-2">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Tu respuesta</label>
                                        <Textarea 
                                          placeholder={`Escribe la respuesta para ${c.userName}...`} 
                                          className="min-h-[80px] bg-card resize-none focus-visible:ring-blue-500"
                                          value={replyTexts[c.id] || ""}
                                          onChange={(e) => setReplyTexts(prev => ({ ...prev, [c.id]: e.target.value }))}
                                        />
                                        <div className="flex justify-end gap-2 mt-3">
                                          <Button variant="ghost" size="sm" onClick={() => { setActiveReplyBoxId(null); setReplyTexts(prev => ({ ...prev, [c.id]: "" })); }}>Cancelar</Button>
                                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleReplySubmit(c.id)} disabled={!replyTexts[c.id]?.trim()}>
                                            Enviar Respuesta
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Existing Replies Render */}
                                {replies.length > 0 && (
                                  <div className="mt-4 ml-6 pl-4 border-l-2 space-y-4">
                                    {replies.map(r => (
                                      <div key={r.id} className="flex gap-3">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">{r.userName.charAt(0)}</div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-semibold">{r.userName}</span>
                                            {r.userId === prof.id && <span className="bg-primary/10 text-primary text-[10px] px-1.5 rounded uppercase font-bold tracking-wider">Profesor</span>}
                                            <span className="text-[10px] text-muted-foreground">{getRelativeTime(r.createdAt)}</span>
                                          </div>
                                          <p className="text-sm text-muted-foreground">{r.text}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/5">
                    Selecciona un comentario de la lista para previsualizar la lección
                  </div>
                )}
            </div>
          </Card>
        )}
      </div>
    </ProfesorLayout>
  );
}
