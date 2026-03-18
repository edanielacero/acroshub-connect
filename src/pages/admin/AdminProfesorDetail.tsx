import { AdminLayout } from "@/components/layout/AdminLayout";
import { profesores, hubs, courses, alumnos, sales } from "@/data/mockData";
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
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/admin/profesores"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <h1 className="text-2xl font-bold">{prof.name}</h1>
          <Badge variant={prof.status === 'activo' ? 'default' : 'destructive'} className="capitalize">{prof.status}</Badge>
        </div>

        <Card>
          <CardContent className="p-6 grid sm:grid-cols-2 gap-4">
            <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{prof.email}</p></div>
            <div><p className="text-sm text-muted-foreground">Fecha de registro</p><p className="font-medium">{prof.createdAt}</p></div>
            <div><p className="text-sm text-muted-foreground">Plan actual</p><Badge variant="secondary" className="capitalize">{prof.plan}</Badge></div>
            <div><p className="text-sm text-muted-foreground">Stripe</p><p className="font-medium">{prof.stripeConnected ? '✅ Conectado' : '❌ No conectado'}</p></div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-3 gap-4">
          <MetricCard title="HUBs creados" value={profHubs.length} icon={<FolderOpen className="h-6 w-6" />} />
          <MetricCard title="Cursos" value={profCourses.length} icon={<BookOpen className="h-6 w-6" />} />
          <MetricCard title="Alumnos" value={profStudents} icon={<Users className="h-6 w-6" />} />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.success("Plan actualizado")}>Cambiar plan</Button>
          <Button variant={prof.status === 'activo' ? 'destructive' : 'default'} onClick={() => toast.success(`Profesor ${prof.status === 'activo' ? 'suspendido' : 'activado'}`)}>
            {prof.status === 'activo' ? 'Suspender' : 'Activar'}
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Historial de ventas</CardTitle></CardHeader>
          <CardContent>
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
                    <TableCell>{s.date}</TableCell>
                    <TableCell>{s.alumnoName}</TableCell>
                    <TableCell>{s.courseTitle}</TableCell>
                    <TableCell>${s.amount}</TableCell>
                    <TableCell className="capitalize">{s.method}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
