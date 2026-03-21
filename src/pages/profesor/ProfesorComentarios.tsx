import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { getCurrentProfesor, courses, hubs, comments, getRelativeTime, getUnrepliedComments } from "@/data/mockData";
import { MessageSquare, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

export default function ProfesorComentarios() {
  const prof = getCurrentProfesor();
  const profCourses = courses.filter(c => c.profesorId === prof.id);
  const profLessonIds = new Set(profCourses.flatMap(c => c.modules.flatMap(m => m.lessons.map(l => l.id))));
  
  // All parent comments in professor's lessons that are pending (have no reply from professor)
  const allPending = getUnrepliedComments(prof.id);

  const getCommentLocation = (lessonId: string) => {
    for (const course of profCourses) {
      for (const mod of course.modules) {
        const lesson = mod.lessons.find(l => l.id === lessonId);
        if (lesson) return { courseTitle: course.title, lessonTitle: lesson.title, courseId: course.id, hubId: course.hubId };
      }
    }
    return null;
  };

  const isCommentReplied = (commentId: string) => {
    return comments.some(reply => reply.parentId === commentId && reply.userId === prof.id);
  };

  const [filterCourse, setFilterCourse] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredComments = allPending.filter(comment => {
    const loc = getCommentLocation(comment.lessonId);
    if (!loc) return false;
    
    // Course Filter
    if (filterCourse !== "all" && loc.courseId !== filterCourse) return false;

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!comment.userName.toLowerCase().includes(q) && !comment.text.toLowerCase().includes(q)) {
        return false;
      }
    }

    return true;
  });

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comentarios</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona y administra los comentarios de tus alumnos.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por alumno o comentario..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cursos</SelectItem>
              {profCourses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredComments.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Alumno</TableHead>
                      <TableHead className="w-[30%]">Comentario</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Clase</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComments.map(comment => {
                      const loc = getCommentLocation(comment.lessonId);
                      const hub = hubs.find(h => h.id === loc?.hubId);
                      
                      return (
                        <TableRow key={comment.id} className="group">
                          <TableCell>
                            <div className="font-medium">{comment.userName}</div>
                            {/* In a real app we'd map userId to email here */}
                            <div className="text-xs text-muted-foreground hidden sm:block">alumno@mail.com</div>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="max-w-[200px] sm:max-w-[300px] truncate cursor-default text-sm">
                                  {comment.text}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[400px]">
                                <p className="text-sm">{comment.text}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{loc?.courseTitle}</TableCell>
                          <TableCell className="text-muted-foreground text-sm truncate max-w-[150px]">{loc?.lessonTitle}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm">{getRelativeTime(comment.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            {hub && loc && (
                              <Button variant="default" size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white border-0 font-medium">
                                <Link to={`/dashboard/comentarios/responder?comentarioId=${comment.id}#comment-${comment.id}`}>Responder Comentario</Link>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-20 px-4 border rounded-xl bg-card border-dashed">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No hay comentarios</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              {searchQuery || filterCourse !== "all"
                ? "Ningún comentario coincide con los filtros de búsqueda actuales."
                 : "El panel está limpio. Tus alumnos no tienen preguntas pendientes."}
            </p>
            {(searchQuery || filterCourse !== "all") && (
              <Button variant="ghost" className="mt-4" onClick={() => { setSearchQuery(""); setFilterCourse("all"); }}>
                Borrar filtros
              </Button>
            )}
          </div>
        )}
      </div>
    </ProfesorLayout>
  );
}
