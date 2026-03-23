import { AdminLayout } from "@/components/layout/AdminLayout";
import { useEffect } from "react";
import { planConfigs } from "@/data/mockData";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { formatDateProject } from "@/lib/utils";

export default function AdminProfesores() {
  const [profesores, setProfesores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: profs } = await supabase.from('profiles').select('*').eq('role', 'profesor');
        if (profs) {
          setProfesores(profs.map(p => ({
            ...p,
            name: p.full_name,
            currentPeriodEnd: p.current_period_end,
            currentPeriodStart: p.current_period_start,
            billingCycle: p.billing_cycle,
            scheduledDowngradePlan: p.scheduled_downgrade_plan,
            createdAt: p.created_at,
            stripeConnected: p.stripe_connected
          })));
        }
      } catch (error) {
        console.error("Error fetching profesores:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPlan, setNewPlan] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const handleAddProfesor = () => {
    if (!newName || !newEmail || !newPlan) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }
    toast.success("Profesor agregado correctamente");
    setIsAddOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPlan("");
    setNewNotes("");
  };

  const filtered = profesores.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "todos" || p.plan === planFilter;
    const matchStatus = statusFilter === "todos" || p.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  if (loading) return <AdminLayout><div className="p-10 text-center animate-pulse">Cargando profesores...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Profesores</h1>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto"><UserPlus className="mr-2 h-4 w-4" />Agregar profesor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Agregar nuevo profesor</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre completo <span className="text-destructive">*</span></Label>
                  <Input 
                    placeholder="Ej. Juan Pérez" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input 
                    type="email" 
                    placeholder="profesor@email.com" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plan inicial <span className="text-destructive">*</span></Label>
                  <Select value={newPlan} onValueChange={setNewPlan}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
                    <SelectContent>
                      {planConfigs.map(plan => (
                        <SelectItem key={plan.key} value={plan.key}>
                          {plan.name} {plan.price > 0 ? `— $${plan.price}/mes` : '— Gratis'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Input 
                    placeholder="Información adicional..." 
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleAddProfesor}>Crear profesor</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_160px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los planes</SelectItem>
              <SelectItem value="gratis">Gratis</SelectItem>
              <SelectItem value="basico">Básico</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="suspendido">Suspendido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card">
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
                  <TableCell className="font-medium whitespace-nowrap">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{p.email}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{p.plan}</Badge></TableCell>
                  <TableCell>
                    <Badge className={`capitalize text-white ${p.status === 'activo' ? 'bg-success hover:bg-success/80' : 'bg-destructive hover:bg-destructive/80'}`}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{formatDateProject(p.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/profesores/${p.id}`}>Ver</Link>
                      </Button>
                    </div>
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
