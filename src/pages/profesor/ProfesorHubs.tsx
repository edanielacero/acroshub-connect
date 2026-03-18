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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Mis HUBs</h1>
          <Button className="w-full sm:w-auto" onClick={() => toast.info("Funcionalidad de crear HUB próximamente")}><Plus className="mr-2 h-4 w-4" />Crear HUB</Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profHubs.map(hub => (
            <Card key={hub.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <FolderOpen className="h-14 w-14 text-primary/40" />
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold">{hub.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{hub.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{hub.coursesCount} cursos · {hub.studentsCount} alumnos</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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
