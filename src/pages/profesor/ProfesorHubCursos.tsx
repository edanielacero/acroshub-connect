import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { hubs, courses } from "@/data/mockData";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen, GripVertical, Plus } from "lucide-react";
import { toast } from "sonner";

export default function ProfesorHubCursos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hub = hubs.find(h => h.id === id);
  const hubCourses = courses.filter(c => c.hubId === id);

  if (!hub) return <ProfesorLayout><p className="p-8 text-center text-muted-foreground">HUB no encontrado</p></ProfesorLayout>;

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/hubs')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cursos en {hub.name}</h1>
            <p className="text-sm text-muted-foreground">Gestiona y organiza el contenido educativo de este HUB.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
          <h3 className="font-semibold text-lg items-center flex gap-2"><BookOpen className="h-5 w-5 text-primary" /> Inventario de Cursos</h3>
          <Button size="sm" className="w-full sm:w-auto" onClick={() => toast.info("Editor de curso próximamente")}>
            <Plus className="mr-1 h-4 w-4" />Crear curso
          </Button>
        </div>

        <div className="space-y-3">
          {hubCourses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
                <p>Todavía no hay cursos en este HUB.</p>
              </CardContent>
            </Card>
          ) : (
            hubCourses.map(c => (
              <Card key={c.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground shrink-0 hidden sm:block" />
                    <div className="h-10 w-10 shrink-0 bg-primary/10 text-primary rounded-md flex items-center justify-center">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base truncate">{c.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{c.modules.length} Módulos · {c.price === 0 ? 'Gratis' : `$${c.price}`}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto shrink-0">
                    <Link to={`/dashboard/cursos/${c.id}`}>Editar Contenido</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </ProfesorLayout>
  );
}
