import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAlumnoData } from "@/hooks/useAlumnoData";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface Props {
  lessonId: string;
}

export function getRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `hace ${diffInSeconds} segundos`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `hace ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `hace ${diffInHours} horas`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'ayer';
  if (diffInDays < 30) return `hace ${diffInDays} días`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `hace ${diffInMonths} meses`;
  return `hace ${Math.floor(diffInMonths / 12)} años`;
}

export function ComentariosComponent({ lessonId }: Props) {
  const { profile } = useAlumnoData();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const userName = profile?.full_name || profile?.name || user?.email || 'Alumno';
  const userId = profile?.id || user?.id;
  const avatarUrl = user?.user_metadata?.avatar_url || (profile as any)?.avatar_url;
  
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [respondiendo, setRespondiendo] = useState<string | null>(null);

  // Fetch comments
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['comments', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, text, created_at, parent_id, is_read,
          profiles:user_id ( id, full_name, name, avatar_url, email )
        `)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    }
  });

  const comentariosLista = commentsData?.map(c => {
    const p = c.profiles as any;
    return {
      id: c.id,
      lessonId,
      userId: p?.id || 'unknown',
      userName: p?.full_name || p?.name || p?.email || 'Usuario',
      avatarUrl: p?.avatar_url,
      text: c.text,
      createdAt: c.created_at,
      parentId: c.parent_id,
      isRead: c.is_read
    };
  }) || [];
  
  const comentariosPrincipales = comentariosLista.filter(c => !c.parentId);

  // Mutations
  const { mutate: agregarComentario, isPending: isSubmitting } = useMutation({
    mutationFn: async ({ text, parentId }: { text: string; parentId?: string }) => {
      if (!userId) throw new Error("Debes iniciar sesión para comentar");
      const { error } = await supabase.from('comments').insert({
        lesson_id: lessonId,
        user_id: userId,
        text,
        parent_id: parentId || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['claseReproductor', lessonId] });
      setNuevoComentario('');
      setRespondiendo(null);
      toast.success("Comentario publicado");
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  const handleEnviarComentario = () => {
    if (!nuevoComentario.trim()) return;
    agregarComentario({ text: nuevoComentario });
  };

  const handleEnviarRespuesta = (parentId: string, indexStr: string) => {
    const text = (document.getElementById(`reply-input-${indexStr}`) as HTMLTextAreaElement)?.value;
    if (!text?.trim()) return;
    agregarComentario({ text, parentId });
  };
  
  if (isLoading) {
    return <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Formulario para nuevo comentario */}
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 border bg-muted overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
          ) : (
            <AvatarFallback className="text-primary font-bold bg-primary/10">{userName.charAt(0).toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <Textarea 
            placeholder="Escribe un comentario o pregunta sobre esta clase..." 
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            rows={3}
            className="resize-none bg-background focus-visible:ring-primary/20"
            disabled={isSubmitting}
          />
          <div className="flex justify-end mt-2">
            <Button 
              size="sm" 
              onClick={handleEnviarComentario}
              disabled={!nuevoComentario.trim() || isSubmitting}
              className="px-6 font-semibold shadow-sm"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Lista de comentarios */}
      <div className="space-y-6">
        {comentariosPrincipales.map((comentario, i) => {
            // Respuestas en orden cronológico (más antiguo primero)
            const respuestas = comentariosLista.filter(r => r.parentId === comentario.id).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            const indexStr = i.toString();
            return (
          <div key={comentario.id} className="space-y-4">
            {/* Comentario principal */}
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 border bg-card overflow-hidden">
                {comentario.avatarUrl ? (
                    <img src={comentario.avatarUrl} alt={comentario.userName} className="h-full w-full object-cover" />
                ) : (
                    <AvatarFallback className="font-semibold">{comentario.userName.charAt(0).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{comentario.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    {getRelativeTime(comentario.createdAt)}
                  </span>
                </div>
                <div className="mt-1 bg-muted/40 p-3 rounded-xl rounded-tl-none border border-muted-foreground/10 text-sm leading-relaxed text-foreground/90">
                  {comentario.text}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-1 h-auto py-1 px-2 text-xs font-medium text-muted-foreground hover:text-primary"
                  onClick={() => setRespondiendo(comentario.id)}
                >
                  Responder
                </Button>
              </div>
            </div>
            
            {/* Respuestas */}
            {respuestas.length > 0 && (
                <div className="ml-14 space-y-4 pl-4 border-l-2 border-muted">
                    {respuestas.map(respuesta => {
                        const isProfesor = respuesta.userId.includes('prof-'); // Temporal logic if you mix prof/alumno ids, otherwise just a visual detail.
                        return (
                        <div key={respuesta.id} className="flex gap-3">
                            <Avatar className="h-8 w-8 border bg-card overflow-hidden">
                                {respuesta.avatarUrl ? (
                                    <img src={respuesta.avatarUrl} alt={respuesta.userName} className="h-full w-full object-cover" />
                                ) : (
                                    <AvatarFallback className="text-xs">{respuesta.userName.charAt(0).toUpperCase()}</AvatarFallback>
                                )}
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-sm">{respuesta.userName}</span>
                                    {isProfesor && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 h-4 bg-blue-100 text-blue-700 hover:bg-blue-100 uppercase font-bold tracking-wider">Profesor</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {getRelativeTime(respuesta.createdAt)}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm bg-muted/40 p-2.5 rounded-lg rounded-tl-none border border-muted-foreground/10 text-foreground/90">{respuesta.text}</p>
                            </div>
                        </div>
                    )})}
                </div>
            )}
            
            {/* Formulario de respuesta */}
            {respondiendo === comentario.id && (
              <div className="flex gap-3 ml-14 mt-2">
                <Avatar className="h-8 w-8 border bg-muted overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback className="text-primary text-xs bg-primary/10">{userName.charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 flex flex-col items-end gap-2">
                  <Textarea 
                    id={`reply-input-${indexStr}`}
                    placeholder="Escribe tu respuesta..." 
                    rows={2}
                    className="resize-none text-sm bg-background border-primary/20 focus-visible:ring-primary/20"
                    autoFocus
                    disabled={isSubmitting}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setRespondiendo(null)} disabled={isSubmitting}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={() => handleEnviarRespuesta(comentario.id, indexStr)} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Responder"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )})}
      </div>
      
      {comentariosPrincipales.length === 0 && (
        <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
          <p className="text-muted-foreground font-medium">Sé el primero en comentar en esta clase.</p>
        </div>
      )}
    </div>
  );
}
