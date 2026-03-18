import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { getCurrentProfesor, hubs, sales, courses } from "@/data/mockData";
import { Users, DollarSign, BookOpen, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function ProfesorDashboard() {
  const prof = getCurrentProfesor();
  const profHubs = hubs.filter(h => h.profesorId === prof.id);
  const profSales = sales.filter(s => s.profesorId === prof.id);
  const thisMonth = profSales.filter(s => s.date.startsWith('2025-03'));
  const profCourses = courses.filter(c => c.profesorId === prof.id);
  const totalStudents = new Set(profSales.map(s => s.alumnoId)).size;

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button asChild className="w-full sm:w-auto"><Link to="/dashboard/hubs"><Plus className="mr-2 h-4 w-4" />Crear nuevo HUB</Link></Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard title="Total alumnos" value={totalStudents} icon={<Users className="h-6 w-6" />} />
          <MetricCard title="Ventas este mes" value={`$${thisMonth.reduce((a, s) => a + s.amount, 0).toFixed(2)}`} icon={<DollarSign className="h-6 w-6" />} />
          <MetricCard title="Cursos publicados" value={profCourses.length} icon={<BookOpen className="h-6 w-6" />} />
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Mis HUBs</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profHubs.map(hub => (
              <Card key={hub.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <FolderOpen className="h-12 w-12 text-primary/40" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{hub.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{hub.coursesCount} cursos · {hub.studentsCount} alumnos</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to={`/dashboard/hubs/${hub.id}`}>Editar</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="flex-1">
                      <Link to={`/${hub.slug}`}>Ver</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ProfesorLayout>
  );
}
