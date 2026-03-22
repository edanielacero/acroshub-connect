import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { useProfesorData } from "@/hooks/useProfesorData";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDateProject } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ProfesorAlumnos() {
  const { enrollments: profSales, courses, ebooks, isLoading } = useProfesorData();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newOrigin, setNewOrigin] = useState("");
  const [newExpiration, setNewExpiration] = useState("");

  const [isAdding, setIsAdding] = useState(false);

  const handleAddAlumno = async () => {
    if (!newEmail || !newProduct || !newOrigin) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }
    setIsAdding(true);
    
    // Look up user by email
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', 
      (await supabase.rpc('get_user_id_by_email', { email_input: newEmail })).data
    ).single();

    // If we can't find user by RPC, try direct lookup (profiles doesn't store email)
    // For now, create enrollment with the email as a note — the alumno_id needs to exist
    // Simple approach: search auth users isn't possible from client, so we'll insert by product only
    
    // Determine product type
    const isCourse = courses.some((c: any) => c.id === newProduct);
    const productType = isCourse ? 'course' : 'ebook';
    
    // For manual add, we need the alumno's profile ID. 
    // Since we can't look up by email from client, show helpful error
    toast.error("Función de agregar alumno por email requiere buscar usuarios. Por ahora, los alumnos se agregan automáticamente cuando compran un producto.");
    setIsAdding(false);
  };

  const uniqueStudentsMap = new Map();
  profSales.forEach((s: any) => {
    if (!uniqueStudentsMap.has(s.alumno_id)) {
      uniqueStudentsMap.set(s.alumno_id, {
        id: s.alumno_id,
        name: s.profiles?.full_name || 'Desconocido',
        email: 'protegido', 
        purchasedCourses: [],
        createdAt: s.created_at
      });
    }
    const student = uniqueStudentsMap.get(s.alumno_id);
    student.purchasedCourses.push(s.product_id);
  });
  
  const alumnosList = Array.from(uniqueStudentsMap.values());

  const filtered = alumnosList.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <ProfesorLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProfesorLayout>
    );
  }

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Alumnos</h1>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto"><UserPlus className="mr-2 h-4 w-4" />Agregar alumno</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Agregar alumno manualmente</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email del alumno <span className="text-destructive">*</span></Label>
                  <Input 
                    type="email" 
                    placeholder="alumno@email.com" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Producto <span className="text-destructive">*</span></Label>
                  <Select value={newProduct} onValueChange={setNewProduct}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                    <SelectContent>
                      {courses.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.title} (Curso)</SelectItem>
                      ))}
                      {ebooks.map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>{e.title} (Ebook)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Origen <span className="text-destructive">*</span></Label>
                  <Select value={newOrigin} onValueChange={setNewOrigin}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pago">Pago externo</SelectItem>
                      <SelectItem value="regalo">Regalo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de expiración (opcional)</Label>
                  <Input 
                    type="date" 
                    value={newExpiration}
                    onChange={(e) => setNewExpiration(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleAddAlumno}>Agregar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card">
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
                  <TableCell className="font-medium whitespace-nowrap">{a.name}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{a.email}</TableCell>
                  <TableCell>{a.purchasedCourses.length}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{formatDateProject(a.createdAt)}</TableCell>
                  <TableCell><Badge variant="default">Activo</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dashboard/alumnos/${a.id}`}>Ver</Link>
                      </Button>
                    </div>
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
