import { useState } from "react";
import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { useProfesorData } from "@/hooks/useProfesorData";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Check, CornerDownRight, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

export default function ProfesorComentarios() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialReplyId = searchParams.get('reply');
  
  const { comments: profComments, lessons, courses, isLoading } = useProfesorData();
  
  const [replyingTo, setReplyingTo] = useState<string | null>(initialReplyId || null);
  const [replyText, setReplyText] = useState("");

  if (isLoading) {
    return (
      <ProfesorLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProfesorLayout>
    );
  }

  // Combine and sort comments
  // Main comments (that are not replies)
  const mainComments = profComments.filter(c => !c.parent_id);
  // Replies (including professor's own replies)
  const allReplies = profComments.filter(c => c.parent_id);
  
  const sortedMain = [...mainComments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getCommentLocation = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return null;
    const course = courses.find(c => c.id === (lesson as any).modules?.course_id);
    return {
      courseTitle: course?.title || 'Curso',
      lessonTitle: lesson.title
    };
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 60) return `hace ${diff}m`;
    if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`;
    return `hace ${Math.floor(diff / 1440)}d`;
  };

  const markAsRead = async (commentId: string) => {
    const { error } = await supabase.from('comments').update({ is_read: true }).eq('id', commentId);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    }
  };

  const handleReply = async (parentId: string, lessonId: string) => {
    if (!replyText.trim()) return;
    if (!user?.id) return;

    try {
      // 1. Insert reply
      const { error: insertError } = await supabase.from('comments').insert({
        lesson_id: lessonId,
        user_id: user.id,
        parent_id: parentId,
        text: replyText
      });
      if (insertError) throw insertError;

      // 2. Mark parent as read automatically
      await supabase.from('comments').update({ is_read: true }).eq('id', parentId);

      toast.success("Respuesta enviada correctamente");
      setReplyText("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    } catch (err: any) {
      toast.error(`Error al responder: ${err.message}`);
    }
  };

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comentarios de Alumnos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revisa las dudas de tus estudiantes y acompáñales en su aprendizaje.
          </p>
        </div>

        {sortedMain.length === 0 ? (
          <div className="text-center py-20 px-4 border rounded-xl bg-card border-dashed">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No hay comentarios todavía</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Las preguntas y aportes de tus alumnos aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedMain.map(comment => {
              const loc = getCommentLocation(comment.lesson_id);
              const isUnread = !comment.is_read && comment.user_id !== user?.id; // Don't highlight own comments
              const userName = (comment as any).profiles?.full_name || 'Bandeja';
              const replies = allReplies.filter(r => r.parent_id === comment.id).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

              return (
                <Card key={comment.id} className={`overflow-hidden transition-colors ${isUnread ? 'border-primary/40 bg-primary/5' : ''}`}>
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{userName}</span>
                            {isUnread && <Badge className="bg-primary hover:bg-primary px-1.5 py-0 text-[10px] uppercase h-5">Nuevo</Badge>}
                            <span className="text-xs text-muted-foreground ml-auto">{getRelativeTime(comment.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 mb-3 text-xs font-medium text-muted-foreground bg-muted/50 inline-flex px-2 py-1 rounded-md">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[200px] sm:max-w-none">{loc?.courseTitle}</span>
                            <span className="opacity-50">•</span>
                            <span className="truncate max-w-[200px] sm:max-w-none">{loc?.lessonTitle}</span>
                          </div>

                          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      </div>

                      {/* Botones de acción principal */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className={`h-8 text-xs font-medium ${replyingTo === comment.id ? 'bg-muted' : ''}`}
                        >
                          <CornerDownRight className="mr-1.5 h-3.5 w-3.5" /> 
                          {replyingTo === comment.id ? 'Cancelar respuesta' : 'Responder'}
                        </Button>
                        
                        {isUnread && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => markAsRead(comment.id)}
                            className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto"
                          >
                            <Check className="mr-1.5 h-3.5 w-3.5" /> Marcar como leído
                          </Button>
                        )}
                      </div>

                      {/* Área de respuesta (Expandida) */}
                      {replyingTo === comment.id && (
                        <div className="mt-4 bg-muted/30 p-4 rounded-lg border border-border/50 animate-in slide-in-from-top-2">
                          <Textarea 
                            placeholder={`Respondiendo a ${userName}...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={3}
                            className="text-sm resize-none bg-background focus-visible:ring-primary/20"
                            autoFocus
                          />
                          <div className="flex justify-end mt-3">
                            <Button 
                              size="sm" 
                              disabled={!replyText.trim()} 
                              onClick={() => handleReply(comment.id, comment.lesson_id)}
                              className="px-6"
                            >
                              Enviar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hilo de Respuestas (Tanto del profe como del alumno) */}
                    {replies.length > 0 && (
                      <div className="bg-muted/30 border-t px-5 py-4 space-y-4">
                        {replies.map((reply, idx) => {
                          const isProf = reply.user_id === user?.id;
                          const rName = (reply as any).profiles?.full_name || 'Usuario';
                          
                          return (
                            <div key={reply.id} className="flex gap-3 pl-4 border-l-2 border-primary/20">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-sm font-semibold ${isProf ? 'text-primary' : ''}`}>
                                    {isProf ? 'Tú (Profesor)' : rName}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground ml-auto">
                                    {getRelativeTime(reply.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground/80">{reply.text}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ProfesorLayout>
  );
}
