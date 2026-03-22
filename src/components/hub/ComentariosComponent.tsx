import { useState } from "react";
import { comments as mockComments, getCurrentAlumno } from "@/data/mockData";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime } from "@/data/mockData";
import { toast } from "sonner";

interface Props {
  lessonId: string;
}

export function ComentariosComponent({ lessonId }: Props) {
  const user = getCurrentAlumno();
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [respondiendo, setRespondiendo] = useState<string | null>(null);
  const [comentariosLista, setComentariosLista] = useState(mockComments.filter(c => c.lessonId === lessonId));
  
  // Agrupar respuestas
  const comentariosPrincipales = comentariosLista.filter(c => !c.parentId);
  
  const handleEnviarComentario = () => {
    if (!nuevoComentario.trim()) return;
    const newComment = {
      id: `com-new-${Date.now()}`,
      lessonId,
      userId: user.id,
      userName: user.name,
      text: nuevoComentario,
      createdAt: new Date().toISOString(),
      isRead: true,
    };
    setComentariosLista([newComment, ...comentariosLista]);
    setNuevoComentario('');
    toast.success("Comentario publicado");
  };

  const handleEnviarRespuesta = (parentId: string, indexStr: string) => {
    const texto = (document.getElementById(`reply-input-${indexStr}`) as HTMLTextAreaElement)?.value;
    if (!texto?.trim()) return;
    
    const newReply = {
      id: `reply-new-${Date.now()}`,
      lessonId,
      userId: user.id,
      userName: user.name,
      text: texto,
      createdAt: new Date().toISOString(),
      parentId,
      isRead: true,
    };
    
    setComentariosLista([...comentariosLista, newReply]);
    setRespondiendo(null);
    toast.success("Respuesta publicada");
  };
  
  return (
    <div className="space-y-8 max-w-3xl">
      {/* Formulario para nuevo comentario */}
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 border bg-muted">
          <AvatarFallback className="text-primary font-bold bg-primary/10">{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea 
            placeholder="Escribe un comentario o pregunta sobre esta clase..." 
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            rows={3}
            className="resize-none bg-background focus-visible:ring-primary/20"
          />
          <div className="flex justify-end mt-2">
            <Button 
              size="sm" 
              onClick={handleEnviarComentario}
              disabled={!nuevoComentario.trim()}
              className="px-6 font-semibold shadow-sm"
            >
              Publicar
            </Button>
          </div>
        </div>
      </div>
      
      {/* Lista de comentarios */}
      <div className="space-y-6">
        {comentariosPrincipales.map((comentario, i) => {
            const respuestas = comentariosLista.filter(r => r.parentId === comentario.id);
            const indexStr = i.toString();
            return (
          <div key={comentario.id} className="space-y-4">
            {/* Comentario principal */}
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 border bg-card">
                <AvatarFallback className="font-semibold">{comentario.userName.charAt(0)}</AvatarFallback>
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
                        const isProfesor = respuesta.userId.startsWith('prof-');
                        return (
                        <div key={respuesta.id} className="flex gap-3">
                            <Avatar className="h-8 w-8 border bg-card">
                                <AvatarFallback className="text-xs">{respuesta.userName.charAt(0)}</AvatarFallback>
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
                <Avatar className="h-8 w-8 border bg-muted">
                  <AvatarFallback className="text-primary text-xs bg-primary/10">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col items-end gap-2">
                  <Textarea 
                    id={`reply-input-${indexStr}`}
                    placeholder="Escribe tu respuesta..." 
                    rows={2}
                    className="resize-none text-sm bg-background border-primary/20 focus-visible:ring-primary/20"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setRespondiendo(null)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={() => handleEnviarRespuesta(comentario.id, indexStr)}>
                      Responder
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
