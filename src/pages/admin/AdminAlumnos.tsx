import { AdminLayout } from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, UserPlus, Send, Loader2, CheckCircle, AlertTriangle, Copy, Trash2, GraduationCap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { toast } from "sonner";
import { formatDateProject } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

export default function AdminAlumnos() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Form State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitResult, setSubmitResult] = useState<null | "invited" | "already_active">(null);
  const [activationLink, setActivationLink] = useState("");
  const [emailSentStatus, setEmailSentStatus] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const resetForm = () => {
    setEmail(""); 
    setName(""); 
    setSubmitResult(null); 
    setEmailSentStatus(false); 
    setCopiedLink(false);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin_alumnos'],
    queryFn: async () => {
      const { data: profilesData, error: err1 } = await supabase.from('profiles').select('*').eq('role', 'alumno');
      if (err1) throw err1;
      const { data: enrollmentsData, error: err2 } = await supabase.from('enrollments').select('alumno_id, status');
      if (err2) throw err2;
      const { data: invitationsData, error: err3 } = await supabase.from('invitations').select('*').eq('status', 'pending');
      if (err3) throw err3;

      return {
        profiles: profilesData || [],
        enrollments: enrollmentsData || [],
        invitations: invitationsData || []
      };
    }
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name.trim()) { toast.error("Nombre y correo son obligatorios"); return; }
    
    setIsPending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/process-invitation', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ email, name, productId: null })
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Error al procesar invitación");
      
      setActivationLink(json.link || "");
      setEmailSentStatus(json.email_sent);
      setSubmitResult(json.is_new ? "invited" : "already_active");
      toast.success(json.is_new ? "Usuario invitado correctamente." : "El alumno ya existía en la plataforma.");
      
      queryClient.invalidateQueries({ queryKey: ['admin_alumnos'] });
    } catch (err: any) {
      toast.error(err.message || "Ocurrió un error inesperado al invitar al alumno.");
    } finally {
      setIsPending(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activationLink);
    setCopiedLink(true);
    toast.success("Link copiado al portapapeles");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const profiles = data?.profiles || [];
  const enrollments = data?.enrollments || [];
  const invitations = data?.invitations || [];

  const activeStudents = profiles.map(p => {
    const activeProducts = enrollments.filter(e => e.alumno_id === p.id && e.status === 'active').length;
    return {
      id: p.id,
      name: p.full_name || 'Sin nombre',
      email: p.email,
      productsCount: activeProducts,
      createdAt: p.created_at,
      status: "active"
    };
  });

  const activeEmails = new Set(profiles.map(p => p.email?.toLowerCase()));
  
  // Unique pending invitations grouped by email (so we don't duplicate pending rows in admin view if multiple profs invited them)
  const pendingByEmail = new Map();
  invitations.forEach(inv => {
    const em = inv.email.toLowerCase();
    if (!activeEmails.has(em) && !pendingByEmail.has(em)) {
      pendingByEmail.set(em, inv);
    }
  });

  const pendingStudents = Array.from(pendingByEmail.values()).map(inv => ({
    id: `inv-${inv.id}`,
    name: inv.name,
    email: inv.email,
    productsCount: 0,
    createdAt: inv.created_at,
    status: "pending"
  }));

  const allStudents = [...activeStudents, ...pendingStudents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const filtered = allStudents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              Directorio de Alumnos
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeStudents.length} alumnos registrados globalmente · {pendingStudents.length} pendientes
            </p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" /> Agregar alumno libre
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Crear cuenta de Alumno</DialogTitle>
                <DialogDescription>
                  Se creará una cuenta de alumno en Acroshub con acceso a 0 productos. El alumno recibirá un correo de bienvenida.
                </DialogDescription>
              </DialogHeader>

              {submitResult === "invited" && (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">¡Cuenta creada!</p>
                      <p className="text-sm text-green-700">
                        {emailSentStatus ? `Email de activación enviado a ${email}` : `Se creó el usuario para ${email}`}
                      </p>
                    </div>
                  </div>
                  
                  {!emailSentStatus && (
                    <Alert className="bg-orange-50 border-orange-200">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 text-xs text-pretty">
                        <strong>Nota:</strong> No se pudo enviar el correo de notificación. Comparte el siguiente enlace manualmente.
                      </AlertDescription>
                    </Alert>
                  )}

                  {activationLink && (
                    <div className="space-y-2">
                      <Label>Link de activación directo</Label>
                      <div className="flex gap-2">
                        <Input value={activationLink} readOnly className="text-xs bg-muted" />
                        <Button variant="outline" size="icon" onClick={handleCopyLink}>
                          {copiedLink ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => resetForm()}>Agregar otro alumno</Button>
                    <Button onClick={() => { setIsAddOpen(false); resetForm(); }}>Cerrar</Button>
                  </DialogFooter>
                </div>
              )}

              {submitResult === "already_active" && (
                <div className="space-y-4 py-2">
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <CheckCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Este correo ya está registrado en Acroshub como alumno. No es necesario volver a agregarlo. Su cuenta ya existe.
                    </AlertDescription>
                  </Alert>
                  <DialogFooter>
                    <Button onClick={() => { setIsAddOpen(false); resetForm(); }}>Cerrar</Button>
                  </DialogFooter>
                </div>
              )}

              {!submitResult && (
                <form onSubmit={handleInvite} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="inv-email">Email del alumno <span className="text-destructive">*</span></Label>
                    <Input id="inv-email" type="email" placeholder="alumno@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inv-name">Nombre del alumno <span className="text-destructive">*</span></Label>
                    <Input id="inv-name" placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</> : <><Send className="h-4 w-4 mr-2" /> Crear Alumno</>}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o email..." className="pl-9 bg-card" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cursos con acceso</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-nowrap">
                      {a.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal bg-muted">
                        {a.productsCount} {a.productsCount === 1 ? 'producto' : 'productos'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-nowrap">{formatDateProject(a.createdAt)}</TableCell>
                    <TableCell>
                      {a.status === 'active' ? (
                        <Badge className="bg-success text-white hover:bg-success/80 border-transparent">Activo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">Pendiente Inv.</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {a.status === 'active' ? (
                        <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary">
                          <Link to={`/admin/alumnos/${a.id}`}>Ver detalle</Link>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-muted-foreground pointer-events-none opacity-50">
                          En espera
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && search && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron alumnos con el término "{search}"
                    </TableCell>
                  </TableRow>
                )}
                {filtered.length === 0 && !search && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Todavía no existen alumnos en la plataforma.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
