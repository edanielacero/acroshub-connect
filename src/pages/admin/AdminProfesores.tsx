import { AdminLayout } from "@/components/layout/AdminLayout";
import { profesores } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminProfesores() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filtered = profesores.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "todos" || p.plan === planFilter;
    const matchStatus = statusFilter === "todos" || p.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Profesores</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los planes</SelectItem>
              <SelectItem value="freemium">Freemium</SelectItem>
              <SelectItem value="basico">Básico</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="suspendido">Suspendido</SelectItem>
            </SelectContent>
          </Select>
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
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.email}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{p.plan}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'activo' ? 'default' : 'destructive'} className="capitalize">{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.createdAt}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/profesores/${p.id}`}>Ver</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.success(`Profesor ${p.status === 'activo' ? 'suspendido' : 'activado'}`)}>
                      {p.status === 'activo' ? 'Suspender' : 'Activar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
