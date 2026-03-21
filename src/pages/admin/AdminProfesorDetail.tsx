import { AdminLayout } from "@/components/layout/AdminLayout";
import { profesores, hubs, courses, sales } from "@/data/mockData";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/MetricCard";
import { FolderOpen, BookOpen, Users, ArrowLeft, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AdminProfesorDetail() {
  const { id } = useParams();
  const foundProf = profesores.find(p => p.id === id);
  const [prof, setProf] = useState(foundProf);

  useEffect(() => {
    setProf(foundProf);
  }, [foundProf]);

  if (!prof) return <AdminLayout><p>Profesor no encontrado</p></AdminLayout>;

  const profHubs = hubs.filter(h => h.profesorId === prof.id);
  const profCourses = courses.filter(c => c.profesorId === prof.id);
  const profSales = sales.filter(s => s.profesorId === prof.id);
  const profStudents = new Set(profSales.map(s => s.alumnoId)).size;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profEbooks: any[] = []; // Pendiente data mock para Ebooks

  const updateProf = (field: 'plan' | 'status', value: string) => {
    setProf(prev => prev ? { ...prev, [field]: value as never } : prev);
    toast.success(`${field === 'plan' ? 'Plan' : 'Estado'} actualizado`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="ghost" size="icon" asChild><Link to="/admin/profesores"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <h1 className="truncate text-2xl font-bold">{prof.name}</h1>
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-6 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6 items-end">
            <div><p className="text-sm text-muted-foreground mb-1">Email</p><p className="font-medium break-all">{prof.email}</p></div>
            <div><p className="text-sm text-muted-foreground mb-1">Fecha de registro</p><p className="font-medium">{prof.createdAt}</p></div>
            <div><p className="text-sm text-muted-foreground mb-1">Stripe</p><p className="font-medium">{prof.stripeConnected ? '✅ Conectado' : '❌ No conectado'}</p></div>
            
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">Plan actual</p>
              <Select value={prof.plan} onValueChange={(val) => updateProf('plan', val)}>
                <SelectTrigger className="w-[180px] h-9 text-sm capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="freemium">Freemium</SelectItem>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">Estado</p>
              <Select value={prof.status} onValueChange={(val) => updateProf('status', val)}>
                <SelectTrigger className={`w-[180px] h-9 text-sm font-medium capitalize ${prof.status === 'activo' ? 'text-success' : 'text-destructive'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="suspendido">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="HUBs creados" value={profHubs.length} icon={<FolderOpen className="h-6 w-6" />} />
          <MetricCard title="Cursos" value={profCourses.length} icon={<BookOpen className="h-6 w-6" />} />
          <MetricCard title="Ebooks" value={profEbooks.length} icon={<FileText className="h-6 w-6" />} />
          <MetricCard title="Alumnos" value={profStudents} icon={<Users className="h-6 w-6" />} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>HUBs del Profesor</CardTitle></CardHeader>
            <CardContent>
              {profHubs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cursos</TableHead>
                      <TableHead>Alumnos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profHubs.map(h => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.name}</TableCell>
                        <TableCell>{h.coursesCount}</TableCell>
                        <TableCell>{h.studentsCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No tiene HUBs creados.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Cursos Creados</CardTitle></CardHeader>
            <CardContent>
              {profCourses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profCourses.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium truncate max-w-[150px]">{c.title}</TableCell>
                        <TableCell>${c.price}</TableCell>
                        <TableCell>
                          <Badge variant={c.published ? 'default' : 'secondary'}>{c.published ? 'Publicado' : 'Borrador'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No tiene cursos creados.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Ebooks Creados</CardTitle></CardHeader>
          <CardContent>
            {profEbooks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No tiene ebooks publicados por el momento.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
