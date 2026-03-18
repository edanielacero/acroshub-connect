import { AdminLayout } from "@/components/layout/AdminLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { profesores, alumnos } from "@/data/mockData";
import { Users, UserCheck, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminDashboard() {
  const activeProfs = profesores.filter(p => p.status === 'activo');

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="grid sm:grid-cols-3 gap-4">
          <MetricCard title="Total profesores" value={profesores.length} icon={<Users className="h-6 w-6" />} />
          <MetricCard title="Profesores activos" value={activeProfs.length} icon={<UserCheck className="h-6 w-6" />} />
          <MetricCard title="Total alumnos" value={alumnos.length} icon={<GraduationCap className="h-6 w-6" />} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Profesores recientes</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/profesores">Ver todos</Link>
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profesores.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.email}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{p.plan}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'activo' ? 'default' : 'destructive'} className="capitalize">
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/profesores/${p.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
