import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { useProfesorData } from "@/hooks/useProfesorData";
import { useInvitations, useInviteStudent, useResendInvitation, useDeleteInvitation } from "@/hooks/useInvitations";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, UserPlus, Send, Clock, RefreshCw, Copy, CheckCircle, Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDateProject } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

export default function ProfesorAlumnos() {
  const { user } = useAuth();
  const { enrollments: profSales, courses, ebooks, profile, isLoading, pricingOptions, transactions } = useProfesorData();
  const { data: invitations = [], isLoading: loadingInv } = useInvitations();
  const inviteStudent = useInviteStudent();
  const resendInvitation = useResendInvitation();
  const deleteInvitation = useDeleteInvitation();

  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [accessType, setAccessType] = useState<string>("free");
  const [activationLink, setActivationLink] = useState("");
  const [submitResult, setSubmitResult] = useState<null | "invited" | "already_invited" | "already_active">(null);
  const [emailSentStatus, setEmailSentStatus] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const resetForm = () => {
    setEmail(""); setName(""); setProductId(""); setAccessType("lifetime");
    setActivationLink(""); setSubmitResult(null); setEmailSentStatus(false); setCopiedLink(false);
  };

  // Derive product info
  const allProducts = [
    ...courses.map((c: any) => ({ ...c, type: 'course' as const })),
    ...ebooks.map((e: any) => ({ ...e, type: 'ebook' as const })),
  ];
  const selectedProduct = allProducts.find(p => p.id === productId);

  // Derive prices for selected product
  const productPrices = pricingOptions.filter(p => p.product_id === productId);

  const handleProductChange = (val: string) => {
    setProductId(val);
    const prices = pricingOptions.filter(p => p.product_id === val);
    if (prices.length > 0) {
      setAccessType(prices[0].type); // Default to first available pricing type
    } else {
      setAccessType('free');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !productId) { toast.error("Email y producto son obligatorios"); return; }
    if (!name.trim()) { toast.error("El nombre del alumno es obligatorio"); return; }
    
    // Map the specific pricing tier back to the DB access_type enum
    const mappedAccessType = (accessType === 'one-time' || accessType === 'free') ? 'lifetime' : 'subscription';

    try {
      const result = await inviteStudent.mutateAsync({
        email,
        name: name || email.split("@")[0],
        productId,
        productType: selectedProduct?.type || 'course',
        productTitle: selectedProduct?.title || 'Producto',
        profesorName: profile?.full_name || 'Tu profesor',
        accessType: mappedAccessType,
        amount: productPrices.find(p => p.type === accessType)?.price || 0,
        currency: productPrices.find(p => p.type === accessType)?.currency || 'USD',
      });

      setSubmitResult(result.status);
      if (result.status === 'invited') {
        const invRes = result as any;
        setActivationLink(invRes.activationLink || "");
        setEmailSentStatus(!!invRes.emailSent);
        toast.success(invRes.emailSent ? "¡Invitación enviada por email!" : "¡Invitación creada!");
      } else if (result.status === 'already_active') {
        toast.success("Alumno ya activo — acceso asignado directamente");
      }
    } catch (err: any) {
      console.error("Error en handleInvite:", err);
      toast.error(err?.message || "Error al enviar la invitación. Revisa la consola para más detalles.");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activationLink);
    setCopiedLink(true);
    toast.success("Link copiado al portapapeles");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleResend = async (inv: any) => {
    const result = await resendInvitation.mutateAsync(inv);
    if (result.emailSent) {
      toast.success("Invitación reenviada correctamente");
    } else {
      navigator.clipboard.writeText(result.activationLink);
      toast.warning("No se pudo enviar email. Link copiado para envío manual.");
    }
  };

  const handleCancelInvitation = async (invId: string) => {
    if (confirm("¿Estás seguro de que deseas cancelar esta invitación?")) {
      const id = invId.replace('inv-', '');
      await deleteInvitation.mutateAsync(id);
      toast.success("Invitación cancelada");
    }
  };


  // Fetch profiles for all invited emails to check if they "have an account"
  const invitedEmails = invitations.map((i: any) => i.email);
  const { data: invitedProfiles = [] } = useQuery({
    queryKey: ['invited_profiles', invitedEmails],
    queryFn: async () => {
      if (invitedEmails.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('email', invitedEmails);
      if (error) throw error;
      return data || [];
    },
    enabled: invitedEmails.length > 0
  });

  const invitedProfilesMap = new Map();
  invitedProfiles.forEach((p: any) => invitedProfilesMap.set(p.email.toLowerCase(), p));

  // Build active list from Enrollments
  const activeStudentsMap = new Map();
  
  // 1. From Enrollments (Current and Canceled)
  profSales.forEach((s: any) => {
    const email = s.profiles?.email?.toLowerCase();
    const id = s.alumno_id;
    const key = email || id;
    
    if (key && !activeStudentsMap.has(key)) {
      activeStudentsMap.set(key, {
        id: s.alumno_id,
        name: s.profiles?.full_name || "Alumno sin nombre",
        email: s.profiles?.email || "",
        productsCount: 0,
        createdAt: s.created_at,
        status: "active",
      });
    }
    
    if (key && s.status === 'active') {
      activeStudentsMap.get(key).productsCount++;
    }
  });

  // 2. From Transactions (Ensures visibility if enrollment was deleted)
  transactions.forEach((tx: any) => {
    const id = tx.alumno_id;
    const email = tx.profiles?.email?.toLowerCase();
    const key = email || id;
    
    // Check if either email key or student ID is already in the map
    const existing = activeStudentsMap.has(key) || Array.from(activeStudentsMap.values()).find(s => s.id === id);
    if (!existing) {
      const inv = invitations.find(i => i.alumno_id === id);
      activeStudentsMap.set(key, {
        id: id,
        name: tx.profiles?.full_name || inv?.name || "Alumno",
        email: tx.profiles?.email || inv?.email || "",
        productsCount: 0,
        createdAt: tx.created_at,
        status: "active",
      });
    }
  });

  // 3. From Invitations (Profile exists but no enrollment yet)
  invitations.forEach((inv: any) => {
    const email = inv.email.toLowerCase();
    const profile = invitedProfilesMap.get(email);
    if (profile && !activeStudentsMap.has(email)) {
      activeStudentsMap.set(email, {
        id: profile.id,
        name: profile.full_name || inv.name,
        email: inv.email,
        productsCount: 0,
        createdAt: inv.created_at,
        status: "active",
      });
    }
  });

  const activeStudents = Array.from(activeStudentsMap.values());

  // Pending = Invitations where NO profile exists yet
  const pendingStudents = invitations
    .filter((inv: any) => !invitedProfilesMap.has(inv.email.toLowerCase()))
    .map((inv: any) => ({
      id: `inv-${inv.id}`,
      invitationId: inv.id,
      invitationToken: inv.token,
      name: inv.name,
      email: inv.email,
      productsCount: inv.product_id ? 1 : 0,
      createdAt: inv.created_at,
      status: "pending",
    }));

  const allStudents = [...pendingStudents, ...activeStudents];
  const filtered = allStudents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading || loadingInv) {
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
          <div>
            <h1 className="text-2xl font-bold">Alumnos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeStudents.length} activos · {pendingStudents.length} pendientes
            </p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" /> Agregar alumno
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Agregar alumno</DialogTitle>
                <DialogDescription>
                  El alumno recibirá un link para activar su cuenta y acceder al contenido.
                </DialogDescription>
              </DialogHeader>

              {/* Result: invited */}
              {submitResult === "invited" && (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">¡Invitación creada!</p>
                      <p className="text-sm text-green-700">
                        {emailSentStatus 
                          ? `Email enviado a ${email}`
                          : `Se creó la invitación para ${email}`}
                      </p>
                    </div>
                  </div>
                  
                  {!emailSentStatus && (
                    <Alert className="bg-orange-50 border-orange-200">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 text-xs text-pretty">
                        <strong>Nota:</strong> No se pudo enviar el email automáticamente. 
                        Asegúrate de haber desplegado la Edge Function y configurado Resend. 
                        <strong>Comparte el link manualmente:</strong>
                      </AlertDescription>
                    </Alert>
                  )}

                  {activationLink && (
                    <div className="space-y-2">
                      <Label>Link de activación</Label>
                      <div className="flex gap-2">
                        <Input value={activationLink} readOnly className="text-xs bg-muted" />
                        <Button variant="outline" size="icon" onClick={handleCopyLink}>
                          {copiedLink ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => resetForm()}>Invitar otro alumno</Button>
                    <Button onClick={() => { setIsAddOpen(false); resetForm(); }}>Cerrar</Button>
                  </DialogFooter>
                </div>
              )}

              {/* Result: already invited */}
              {submitResult === "already_invited" && (
                <div className="space-y-4 py-2">
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Este alumno ya tiene una invitación pendiente.
                    </AlertDescription>
                  </Alert>
                  {activationLink && (
                    <div className="space-y-2">
                      <Label>Link de activación (reenviar manualmente)</Label>
                      <div className="flex gap-2">
                        <Input value={activationLink} readOnly className="text-xs bg-muted" />
                        <Button variant="outline" size="icon" onClick={handleCopyLink}>
                          {copiedLink ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button onClick={() => { setIsAddOpen(false); resetForm(); }}>Cerrar</Button>
                  </DialogFooter>
                </div>
              )}

              {/* Result: already active */}
              {submitResult === "already_active" && (
                <div className="space-y-4 py-2">
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      El alumno ya tenía cuenta activa — acceso asignado directamente.
                    </AlertDescription>
                  </Alert>
                  <DialogFooter>
                    <Button onClick={() => { setIsAddOpen(false); resetForm(); }}>Cerrar</Button>
                  </DialogFooter>
                </div>
              )}

              {/* Invite form */}
              {!submitResult && (
                <form onSubmit={handleInvite} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="inv-email">Email del alumno <span className="text-destructive">*</span></Label>
                    <Input
                      id="inv-email"
                      type="email"
                      placeholder="alumno@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inv-name">Nombre del alumno <span className="text-destructive">*</span></Label>
                    <Input
                      id="inv-name"
                      placeholder="Nombre completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Producto a asignar <span className="text-destructive">*</span></Label>
                    <Select value={productId} onValueChange={handleProductChange} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.title} — Curso</SelectItem>
                        ))}
                        {ebooks.map((e: any) => (
                          <SelectItem key={e.id} value={e.id}>{e.title} — Ebook</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {productId && (
                    <div className="space-y-1.5">
                    <Label>Tipo de acceso <span className="text-destructive">*</span></Label>
                    <Select value={accessType} onValueChange={setAccessType}>
                      <SelectTrigger>
                          <SelectValue placeholder="Seleccionar acceso..." />
                        </SelectTrigger>
                        <SelectContent>
                          {productPrices.map(p => (
                            <SelectItem key={p.id} value={p.type}>
                              {p.type === 'one-time' ? 'Pago Único' : `Suscripción ${p.type === 'monthly' ? 'Mensual' : 'Anual'}`} - ${p.price} {p.currency}
                            </SelectItem>
                          ))}
                          {productPrices.length === 0 && (
                            <SelectItem value="free">
                              Acceso completo gratuito
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={inviteStudent.isPending}>
                      {inviteStudent.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</>
                      ) : (
                        <><Send className="h-4 w-4 mr-2" /> Enviar invitación</>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    {allStudents.length === 0
                      ? "Aún no tienes alumnos. Clic en \"Agregar alumno\" para empezar."
                      : "No se encontraron alumnos."}
                  </TableCell>
                </TableRow>
              ) : filtered.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium whitespace-nowrap">{a.name}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {a.email || "—"}
                  </TableCell>
                  <TableCell>{a.productsCount}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDateProject(a.createdAt)}
                  </TableCell>
                  <TableCell>
                    {a.status === "active" ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 pointer-events-none">Activo</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 pointer-events-none">Pendiente</Badge>
                    )}
                  </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/dashboard/alumnos/${a.id}`}>Ver</Link>
                        </Button>
                        
                        {a.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground"
                              onClick={() => handleResend({ id: a.invitationId, token: a.invitationToken, email: a.email, name: a.name })}
                              disabled={resendInvitation.isPending}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              Reenviar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleCancelInvitation(a.invitationId)}
                              disabled={deleteInvitation.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
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
