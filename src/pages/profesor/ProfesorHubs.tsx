import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { getCurrentProfesor, hubs } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FolderOpen, Plus } from "lucide-react";
import { toast } from "sonner";

export default function ProfesorHubs() {
  const prof = getCurrentProfesor();
  const profHubs = hubs.filter(h => h.profesorId === prof.id);

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mis HUBs</h1>
          <Button onClick={() => toast.info("Funcionalidad de crear HUB próximamente")}><Plus className="mr-2 h-4 w-4" />Crear HUB</Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profHubs.map(hub => (
            <Card key={hub.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-36 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <FolderOpen className="h-14 w-14 text-primary/40" />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">{hub.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{hub.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{hub.coursesCount} cursos · {hub.studentsCount} alumnos</p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/dashboard/hubs/${hub.id}`}>Editar</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="flex-1">
                    <Link to={`/${hub.slug}`}>Ver como alumno</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProfesorLayout>
  );
}
