import { AdminLayout } from "@/components/layout/AdminLayout";
import { profesores, hubs, courses, sales } from "@/data/mockData";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/MetricCard";
import { FolderOpen, BookOpen, Users, ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function AdminProfesorDetail() {
  const { id } = useParams();
  const prof = profesores.find(p => p.id === id);
  if (!prof) return <AdminLayout><p>Profesor no encontrado</p></AdminLayout>;

  const profHubs = hubs.filter(h => h.profesorId === prof.id);
  const profCourses = courses.filter(c => c.profesorId === prof.id);
  const profSales = sales.filter(s => s.profesorId === prof.id);
  const profStudents = new Set(profSales.map(s => s.alumnoId)).size;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="ghost" size="icon" asChild><Link to="/admin/profesores"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <h1 className="truncate text-2xl font-bold">{prof.name}</h1>
            <Badge variant={prof.status === 'activo' ? 'default' : 'destructive'} className="w-fit capitalize">{prof.status}</Badge>
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium break-all">{prof.email}</p></div>
            <div><p className="text-sm text-muted-foreground">Fecha de registro</p><p className="font-medium">{prof.createdAt}</p></div>
            <div><p className="text-sm text-muted-foreground">Plan actual</p><Badge variant="secondary" className="capitalize">{prof.plan}</Badge></div>
            <div><p className="text-sm text-muted-foreground">Stripe</p><p className="font-medium">{prof.stripeConnected ? '✅ Conectado' : '❌ No conectado'}</p></div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard title="HUBs creados" value={profHubs.length} icon={<FolderOpen className="h-6 w-6" />} />
          <MetricCard title="Cursos" value={profCourses.length} icon={<BookOpen className="h-6 w-6" />} />
          <MetricCard title="Alumnos" value={profStudents} icon={<Users className="h-6 w-6" />} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => toast.success("Plan actualizado")}>Cambiar plan</Button>
          <Button className="w-full sm:w-auto" variant={prof.status === 'activo' ? 'destructive' : 'default'} onClick={() => toast.success(`Profesor ${prof.status === 'activo' ? 'suspendido' : 'activado'}`)}>
            {prof.status === 'activo' ? 'Suspender' : 'Activar'}
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Historial de ventas</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profSales.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap">{s.date}</TableCell>
                      <TableCell className="whitespace-nowrap">{s.alumnoName}</TableCell>
                      <TableCell>{s.courseTitle}</TableCell>
                      <TableCell className="whitespace-nowrap">${s.amount}</TableCell>
                      <TableCell className="capitalize whitespace-nowrap">{s.method}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
