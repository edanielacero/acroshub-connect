import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Loader2, Save, Calendar, BookOpen, Clock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { formatDateProject } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminAlumnoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Profile edit state
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("activo");

  // Credential edit state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);

  // Grant access state
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [grantProductId, setGrantProductId] = useState("");

  // Revoke state
  const [enrollmentToRevoke, setEnrollmentToRevoke] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin_alumno_detail', id],
    queryFn: async () => {
      if (!id) return null;
      if (id.startsWith('inv-')) return { isInv: true, invId: id.replace('inv-', '') };

      const { data: profile, error: pErr } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (pErr) throw pErr;

      const { data: enrollments, error: eErr } = await supabase.from('enrollments').select('*').eq('alumno_id', id);
      if (eErr) throw eErr;

      const { data: allCourses } = await supabase.from('courses').select('id, title, profesor_id');
      const { data: allEbooks } = await supabase.from('ebooks').select('id, title, profesor_id');
      const { data: professors } = await supabase.from('profiles').select('id, full_name').eq('role', 'profesor');

      return { profile, enrollments: enrollments || [], courses: allCourses || [], ebooks: allEbooks || [], professors: professors || [] };
    },
    enabled: !!id
  });

  useEffect(() => {
    if (data && !data.isInv && data.profile) {
      setEditName(data.profile.full_name || "");
      setEditStatus(data.profile.status || "activo");
      setNewEmail(data.profile.email || "");
    }
  }, [data]);

  // --- Mutations ---

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No ID");
      const { error } = await supabase.from('profiles').update({
        full_name: editName,
        status: editStatus
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil actualizado");
      queryClient.invalidateQueries({ queryKey: ['admin_alumno_detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin_alumnos'] });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  const revokeMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Acceso revocado");
      queryClient.invalidateQueries({ queryKey: ['admin_alumno_detail', id] });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  const grantMutation = useMutation({
    mutationFn: async ({ productId, type }: { productId: string, type: 'course' | 'ebook' }) => {
      const { error } = await supabase.from('enrollments').insert({
        alumno_id: id,
        product_id: productId,
        product_type: type,
        access_type: 'lifetime',
        status: 'active'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Acceso otorgado correctamente");
      setIsGrantOpen(false);
      setGrantProductId("");
      queryClient.invalidateQueries({ queryKey: ['admin_alumno_detail', id] });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  const handleCredentialsUpdate = async () => {
    if (!adminPassword.trim()) { toast.error("Debes ingresar tu contraseña de superadmin."); return; }
    if (!newEmail.trim() && !newPassword.trim()) { toast.error("Ingresa un nuevo email o contraseña para actualizar."); return; }

    setIsUpdatingCredentials(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/admin-update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          targetUserId: id,
          adminPassword: adminPassword,
          newEmail: newEmail !== data?.profile?.email ? newEmail : undefined,
          newPassword: newPassword || undefined,
          newName: editName,
          newStatus: editStatus
        })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      toast.success("Credenciales actualizadas correctamente.");
      setIsCredentialsOpen(false);
      setAdminPassword("");
      setNewPassword("");
      setShowAdminPw(false);
      setShowNewPw(false);
      queryClient.invalidateQueries({ queryKey: ['admin_alumno_detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin_alumnos'] });
    } catch (err: any) {
      toast.error(err.message || "Error actualizando credenciales.");
    } finally {
      setIsUpdatingCredentials(false);
    }
  };

  // --- Render ---

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  if (!data || data.isInv) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <Clock className="h-12 w-12 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-bold">Usuario Pendiente</h2>
          <p className="text-muted-foreground max-w-sm text-center">Este usuario aún no ha activado su cuenta. No se puede editar hasta que se registre.</p>
          <Button onClick={() => navigate('/admin/alumnos')} variant="outline">Volver a alumnos</Button>
        </div>
      </AdminLayout>
    );
  }

  const { profile, enrollments, courses, ebooks, professors } = data;

  const getProfessorName = (profId: string) => professors.find((p: any) => p.id === profId)?.full_name || "Desconocido";

  const activeProductsParams = enrollments.map((e: any) => {
    const isCourse = e.product_type === 'course';
    const product = isCourse ? courses.find((c: any) => c.id === e.product_id) : ebooks.find((b: any) => b.id === e.product_id);
    return {
      id: e.id,
      productId: e.product_id,
      title: product?.title || 'Producto desconocido',
      type: isCourse ? 'Curso' : 'Ebook',
      profName: getProfessorName(product?.profesor_id),
      date: e.created_at,
      status: e.status
    };
  });

  const allAvailableProducts = [
    ...courses.map((c: any) => ({ ...c, type: 'course' as const, profName: getProfessorName(c.profesor_id) })),
    ...ebooks.map((e: any) => ({ ...e, type: 'ebook' as const, profName: getProfessorName(e.profesor_id) }))
  ].sort((a, b) => a.title.localeCompare(b.title));

  const handleGrantSubmit = () => {
    if (!grantProductId) return toast.error("Selecciona un producto");
    const product = allAvailableProducts.find(p => p.id === grantProductId);
    if (!product) return;
    grantMutation.mutate({ productId: product.id, type: product.type });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
        {/* Back button */}
        <Button variant="ghost" className="gap-2 shrink-0 -ml-2" onClick={() => navigate('/admin/alumnos')}>
          <ArrowLeft className="h-4 w-4" /> Volver a Alumnos
        </Button>

        {/* ── PROFILE CARD ── Full width on top */}
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="bg-muted/30 pb-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Perfil del Alumno</CardTitle>
            <Button
              size="sm"
              className="gap-2 bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
              onClick={() => setIsCredentialsOpen(true)}
            >
              <ShieldCheck className="h-4 w-4" /> Cambiar Email / Contraseña
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Correo Electrónico</Label>
                <Input value={profile.email} readOnly disabled className="bg-muted text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">Usa el botón "Cambiar Email / Contraseña" para modificarlo.</p>
              </div>
              <div className="space-y-2">
                <Label>Estado de la cuenta</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo / Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full gap-2" onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar Perfil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── PRODUCTS TABLE ── Full width below */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/30 pb-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Productos con Acceso
            </CardTitle>
            <Dialog open={isGrantOpen} onOpenChange={setIsGrantOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Otorgar Acceso
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Otorgar Acceso a Producto</DialogTitle>
                  <DialogDescription>Selecciona un producto de cualquier profesor para darle acceso gratuito e inmediato.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Producto</Label>
                    <Select value={grantProductId} onValueChange={setGrantProductId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Busca o selecciona..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {allAvailableProducts.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title} ({p.type === 'course' ? 'Curso' : 'Ebook'}) — {p.profName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGrantOpen(false)}>Cancelar</Button>
                  <Button onClick={handleGrantSubmit} disabled={grantMutation.isPending}>
                    {grantMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirmar Acceso
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Profesor</TableHead>
                  <TableHead>Asignado en</TableHead>
                  <TableHead className="text-right pr-6">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeProductsParams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      El alumno no tiene acceso a ningún producto aún. Usa "Otorgar Acceso" para asignarle uno.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeProductsParams.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="pl-6 font-medium">{p.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-muted/50 text-[10px] uppercase font-bold tracking-wider">{p.type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.profName}</TableCell>
                      <TableCell className="text-nowrap text-muted-foreground text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDateProject(p.date)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setEnrollmentToRevoke(p.id)}
                        >
                          Revocar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ── CREDENTIAL CHANGE DIALOG ── */}
        <Dialog open={isCredentialsOpen} onOpenChange={(o) => { setIsCredentialsOpen(o); if (!o) { setAdminPassword(""); setNewPassword(""); setShowAdminPw(false); setShowNewPw(false); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-600" /> Modificar Credenciales
              </DialogTitle>
              <DialogDescription>
                Cambiar el email o la contraseña del alumno <strong>{profile.full_name}</strong>. Por seguridad, debes confirmar tu contraseña de superadmin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nuevo Email (dejar vacío para no cambiar)</Label>
                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder={profile.email} />
              </div>
              <div className="space-y-2">
                <Label>Nueva Contraseña (dejar vacío para no cambiar)</Label>
                <div className="relative">
                  <Input type={showNewPw ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <hr />
              <div className="space-y-2">
                <Label className="text-amber-700 font-semibold">Tu contraseña de Superadmin <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input type={showAdminPw ? "text" : "password"} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Tu contraseña actual de admin" required />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowAdminPw(!showAdminPw)}>
                    {showAdminPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">Requerida para confirmar tu identidad antes de modificar credenciales sensibles.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCredentialsOpen(false)}>Cancelar</Button>
              <Button onClick={handleCredentialsUpdate} disabled={isUpdatingCredentials} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                {isUpdatingCredentials ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Confirmar Cambio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── REVOKE CONFIRMATION ── */}
        <AlertDialog open={!!enrollmentToRevoke} onOpenChange={(o) => !o && setEnrollmentToRevoke(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Revocar acceso al alumno?</AlertDialogTitle>
              <AlertDialogDescription>
                Esto eliminará inmediatamente el acceso del alumno al producto seleccionado. Podrás volver a otorgarlo más adelante.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-white"
                onClick={() => {
                  if (enrollmentToRevoke) revokeMutation.mutate(enrollmentToRevoke);
                  setEnrollmentToRevoke(null);
                }}
              >
                Sí, Revocar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
