import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { alumnos, courses } from "@/data/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ProfesorAlumnos() {
  const [search, setSearch] = useState("");
  const filtered = alumnos.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Alumnos</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button><UserPlus className="mr-2 h-4 w-4" />Agregar alumno</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Agregar alumno manualmente</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Email del alumno</Label><Input type="email" placeholder="alumno@email.com" /></div>
                <div className="space-y-2">
                  <Label>Producto</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                    <SelectContent>
                      {courses.filter(c => c.profesorId === 'prof-1').map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Origen</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pago">Pago externo</SelectItem>
                      <SelectItem value="regalo">Regalo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Fecha de expiración (opcional)</Label><Input type="date" /></div>
                <Button className="w-full" onClick={() => toast.success("Alumno agregado correctamente")}>Agregar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cursos</TableHead>
                <TableHead>Fecha acceso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.email}</TableCell>
                  <TableCell>{a.purchasedCourses.length}</TableCell>
                  <TableCell className="text-muted-foreground">{a.createdAt}</TableCell>
                  <TableCell><Badge variant="default">Activo</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm">Ver</Button>
                    <Button variant="outline" size="sm" onClick={() => toast.success("Acceso revocado")}>Revocar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </ProfesorLayout>
  );
}
