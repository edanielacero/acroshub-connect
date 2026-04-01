import { useParams, useNavigate } from "react-router-dom";
import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { useState } from "react";
import { useProfesorData } from "@/hooks/useProfesorData";
import { useInvitations, useResendInvitation } from "@/hooks/useInvitations";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MoreHorizontal, AlertTriangle, Plus, Loader2, Clock, Copy, Send } from "lucide-react";
import { formatDateProject } from "@/lib/utils";
import { toast } from "sonner";
import { addDays, differenceInDays } from "date-fns";

export default function ProfesorAlumnoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: invitations = [] } = useInvitations();
  const resendInvitation = useResendInvitation();
  const { enrollments, courses, ebooks, pricingOptions, transactions, isLoading } = useProfesorData();

  const isInvId = id?.startsWith('inv-');
  const actualId = isInvId ? id?.replace('inv-', '') : id;

  // Find invitation if any
  const pendingInv = invitations.find((inv: any) => 
    (isInvId && inv.id === actualId) || (!isInvId && inv.alumno_id === id && inv.status === 'pending')
  );
  const isAccountPending = !!pendingInv;

  // Fetch profile if not found in enrollments (student with account but 0 products)
  const { data: standaloneProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['student_profile', actualId],
    queryFn: async () => {
      if (!actualId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', actualId)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !isInvId && !!actualId
  });

  const studentEnrollments = enrollments.filter(e => e.alumno_id === actualId);
  const studentProfile = studentEnrollments[0]?.profiles || standaloneProfile;
  
  const studentName = isInvId 
    ? pendingInv?.name || 'Alumno por invitar'
    : (studentProfile as any)?.full_name || pendingInv?.name || 'Alumno Desconocido';
    
  const studentFirstAccess = studentEnrollments.length > 0 
    ? studentEnrollments.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0].created_at 
    : (pendingInv?.created_at || new Date().toISOString());

  // History of payments from transactions table
  const studentTransactions = transactions.filter(t => t.alumno_id === actualId);
  const payments = studentTransactions.map(t => ({
    id: t.id,
    createdAt: t.created_at,
    productId: t.product_id,
    amount: Number(t.amount),
    currency: t.currency || 'USD',
    method: t.method || 'manual',
    notes: t.notes
  }));

  // Unique products for "Productos con acceso" section
  const uniqueProductIds = Array.from(new Set(studentEnrollments.map(e => e.product_id)));
  
  let activeProducts = uniqueProductIds.map(pid => {
    // Get the most relevant/recent enrollment for this product
    const relevantEnrollment = studentEnrollments
      .filter(e => e.product_id === pid && e.status === 'active')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
    if (!relevantEnrollment) return null;
      
    const isCourse = relevantEnrollment.product_type === 'course';
    const product = isCourse ? courses.find(c => c.id === pid) : ebooks.find(book => book.id === pid);
    const isSub = relevantEnrollment.access_type === 'subscription';
    
    let expirationDate: string | null = null;
    if (relevantEnrollment.expires_at) {
      expirationDate = relevantEnrollment.expires_at;
    } else if (isSub) {
      const productPrice = pricingOptions.find(p => p.product_id === pid && (p.type === 'monthly' || p.type === 'annual'));
      if (productPrice) {
        const d = new Date(relevantEnrollment.created_at);
        if (productPrice.type === 'monthly') expirationDate = new Date(d.setMonth(d.getMonth() + 1)).toISOString();
        else if (productPrice.type === 'annual') expirationDate = new Date(d.setFullYear(d.getFullYear() + 1)).toISOString();
      }
    }
    
    const lastTx = studentTransactions
      .filter(t => t.product_id === pid)
      .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    let subLabel = isSub ? 'Suscripción' : 'Único Pago';
    let paidPrice = 0;
    
    if (lastTx) {
      paidPrice = Number(lastTx.amount);
      if (isSub) {
        if (/\banual\b/i.test(lastTx.notes || '')) subLabel = 'Anual';
        else if (/\bmensual\b/i.test(lastTx.notes || '')) subLabel = 'Mensual';
        else {
          const priceMatch = pricingOptions.find(p => p.product_id === pid && p.type !== 'one-time' && Number(p.price) === paidPrice);
          if (priceMatch) subLabel = priceMatch.type === 'annual' ? 'Anual' : 'Mensual';
        }
      }
    } else {
      const productPrice = pricingOptions.find(p => p.product_id === pid && (isSub ? p.type !== 'one-time' : p.type === 'one-time'));
      if (productPrice) {
        paidPrice = Number(productPrice.price);
        if (isSub) subLabel = productPrice.type === 'annual' ? 'Anual' : 'Mensual';
      }
    }

    return {
      enrollmentId: relevantEnrollment.id,
      productId: pid,
      productTitle: product?.title || 'Producto desconocido',
      productType: isCourse ? 'Curso' : 'Ebook',
      subscriptionType: subLabel,
      paidPrice,
      accessDate: relevantEnrollment.created_at,
      expirationDate, 
      status: relevantEnrollment.status, 
    };
  }).filter(Boolean); // Filter out nulls from products that are not active

  if (isInvId && pendingInv?.product_id) {
    const isCourse = pendingInv.product_type === 'course';
    const product = isCourse ? courses.find(c => c.id === pendingInv.product_id) : ebooks.find(book => book.id === pendingInv.product_id);
    activeProducts.push({
      enrollmentId: 'pending-' + pendingInv.id,
      productId: pendingInv.product_id,
      productTitle: product?.title || 'Producto por confirmar',
      productType: isCourse ? 'Curso' : 'Ebook',
      subscriptionType: pendingInv.access_type === 'lifetime' ? 'Único Pago' : 'Suscripción',
      paidPrice: pendingInv.amount ? Number(pendingInv.amount) : 0,
      accessDate: pendingInv.created_at,
      expirationDate: null, 
      status: 'pending', 
    });
  }
  


  // Backward compatibility: if no transactions but has enrollments, show enrollments as payments
  if (payments.length === 0 && studentEnrollments.length > 0) {
    studentEnrollments.forEach(e => {
      const isSub = e.access_type === 'subscription';
      const productPrice = pricingOptions.find(p => 
        p.product_id === e.product_id && 
         (isSub ? (p.type === 'monthly' || p.type === 'annual') : p.type === 'one-time')
      );
       
      payments.push({
        id: 'legacy-' + e.id,
        createdAt: e.created_at,
        productId: e.product_id,
        amount: productPrice ? Number(productPrice.price) : 0,
        currency: productPrice?.currency || 'USD',
        method: 'asignación directa',
        notes: isSub ? 'Suscripción asignada' : 'Pago único asignado'
      });
    });
  }

  // Modal States
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newExpirationDate, setNewExpirationDate] = useState("");

  // New Payment Form State
  const [payProduct, setPayProduct] = useState("");
  const [paySubscription, setPaySubscription] = useState<string>("free");
  const [payNotes, setPayNotes] = useState("");

  // Pagination State for History
  const [paymentPage, setPaymentPage] = useState(1);
  const paymentsPerPage = 5;
  const totalPaymentPages = Math.ceil(payments.length / paymentsPerPage);
  const paginatedPayments = payments.slice((paymentPage - 1) * paymentsPerPage, paymentPage * paymentsPerPage);

  const allProducts = [
    ...courses.map((c: any) => ({ ...c, type: 'course' as const })),
    ...ebooks.map((e: any) => ({ ...e, type: 'ebook' as const })),
  ];
  const selectedPayProduct = allProducts.find(p => p.id === payProduct);

  const productPrices = pricingOptions.filter(p => p.product_id === payProduct);

  const handleProductChange = (val: string) => {
    setPayProduct(val);
    const prices = pricingOptions.filter(p => p.product_id === val);
    if (prices.length > 0) {
      setPaySubscription(prices[0].type);
    } else {
      setPaySubscription('free');
    }
  };

  if (isLoading || loadingProfile) {
    return (
      <ProfesorLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProfesorLayout>
    );
  }

  if (activeProducts.length === 0 && studentEnrollments.length === 0 && !isAccountPending && !standaloneProfile) {
    return (
      <ProfesorLayout>
        <div className="p-8 text-center text-muted-foreground">Alumno no encontrado o sin cursos</div>
      </ProfesorLayout>
    );
  }

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvId) {
      toast.error("El alumno aún no ha activado su cuenta. Asigne productos mediante una nueva invitación.");
      return;
    }
    
    if (!payProduct || !paySubscription) {
      toast.error("Selecciona producto y suscripción.");
      return;
    }
    
    const mappedAccessType = (paySubscription === 'one-time' || paySubscription === 'free') ? 'lifetime' : 'subscription';
    const selectedPrice = productPrices.find(p => p.type === paySubscription);
    const amount = selectedPrice ? Number(selectedPrice.price) : 0;

    // 1. Insert Transaction
    const { error: txError } = await supabase.from('transactions').insert({
      alumno_id: actualId,
      product_id: payProduct,
      product_type: selectedPayProduct?.type || 'course',
      amount: amount,
      currency: selectedPrice?.currency || 'USD',
      method: 'manual',
      notes: payNotes || (mappedAccessType === 'lifetime' ? 'Pago único manual' : 'Suscripción mensual manual')
    });

    if (txError) {
      toast.error(txError.message);
      return;
    }

    // 2. Ensure Enrollment exists or is updated
    const existingEnrollment = studentEnrollments.find(e => e.product_id === payProduct);
    
    if (existingEnrollment) {
      // Update existing enrollment status and potentially extend expiration
      let updateData: any = { status: 'active', access_type: mappedAccessType };
      
      if (mappedAccessType === 'subscription') {
        const d = existingEnrollment.expires_at ? new Date(existingEnrollment.expires_at) : new Date();
        if (paySubscription === 'monthly') d.setMonth(d.getMonth() + 1);
        else if (paySubscription === 'annual') d.setFullYear(d.getFullYear() + 1);
        updateData.expires_at = d.toISOString();
      } else {
        updateData.expires_at = null; // Lifetime access
      }

      await supabase.from('enrollments').update(updateData).eq('id', existingEnrollment.id);
    } else {
      // Create new enrollment
      let expires_at = null;
      if (mappedAccessType === 'subscription') {
        const d = new Date();
        if (paySubscription === 'monthly') d.setMonth(d.getMonth() + 1);
        else if (paySubscription === 'annual') d.setFullYear(d.getFullYear() + 1);
        expires_at = d.toISOString();
      }

      const { error: enrollError } = await supabase.from('enrollments').insert({
        alumno_id: actualId,
        product_id: payProduct,
        product_type: selectedPayProduct?.type || 'course',
        access_type: mappedAccessType,
        status: 'active',
        expires_at
      });
      
      if (enrollError) {
        toast.error("Error al asignar el producto: " + enrollError.message);
        return;
      }
    }

    toast.success("Pago registrado y acceso actualizado.");
    queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    setPayProduct("");
    setPaySubscription("free");
    setPayNotes("");
  };

  const statusBadge = (expirationDate: string | null) => {
    if (!expirationDate) return <Badge className="bg-success text-white">Activo</Badge>;
    const days = differenceInDays(new Date(expirationDate), new Date());
    if (days < 0) return <Badge variant="destructive">Expirado</Badge>;
    if (days <= 7) return <Badge className="bg-orange-500 text-white hover:bg-orange-600">Por expirar</Badge>;
    return <Badge className="bg-success hover:bg-success/80 text-white">Activo</Badge>;
  };



  const getMethodBadge = (m: string) => {
    switch(m) {
      case 'stripe': return "bg-blue-100 text-blue-800";
      case 'paypal': return "bg-sky-100 text-sky-800";
      case 'transfer': return "bg-gray-100 text-gray-800";
      case 'cash': return "bg-green-100 text-green-800";
      case 'crypto': return "bg-orange-100 text-orange-800";
      case 'magic_code': return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getMethodLabel = (m: string) => {
    switch(m) {
      case 'stripe': return 'Stripe';
      case 'paypal': return 'PayPal';
      case 'transfer': return 'Transferencia';
      case 'cash': return 'Efectivo';
      case 'crypto': return 'Cripto';
      case 'magic_code': return 'Código Mágico';
      case 'manual': return 'Manual';
      case 'asignación directa': return 'Asignación directa';
      default: return m;
    }
  };

  const expiringSub = activeProducts.find(p => p.expirationDate && differenceInDays(new Date(p.expirationDate), new Date()) <= 7 && differenceInDays(new Date(p.expirationDate), new Date()) >= 0);

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in pb-10">

        {/* Pending activation banner */}
        {isAccountPending && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex items-start gap-3">
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Cuenta pendiente de activación</p>
              <p className="text-sm">Este alumno aún no ha activado su cuenta.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                className="text-xs flex items-center gap-1 text-yellow-800 font-semibold hover:text-yellow-900 transition-colors disabled:opacity-50"
                disabled={resendInvitation.isPending}
                onClick={async () => {
                  const result = await resendInvitation.mutateAsync(pendingInv);
                  if (result.emailSent) {
                    toast.success("Email de invitación reenviado");
                  } else {
                    toast.warning("No se pudo enviar el email. Se copió el link para envío manual.");
                    navigator.clipboard.writeText(result.activationLink);
                  }
                }}
              >
                {resendInvitation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Reenviar email
              </button>
              <button
                className="text-xs flex items-center gap-1 text-yellow-800 font-semibold hover:text-yellow-900 transition-colors"
                onClick={() => {
                  const link = `${window.location.origin}/activar-cuenta?token=${pendingInv.token}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Link copiado al portapapeles");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar link
              </button>
            </div>
          </div>
        )}
        
        {expiringSub && (
          <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-800 p-4 rounded-md flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-semibold">Atención: Suscripción por vencer</p>
              <p className="text-sm">El acceso del alumno a <span className="font-semibold">{expiringSub.productTitle}</span> vence en {differenceInDays(new Date(expiringSub.expirationDate!), new Date())} días.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/alumnos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{studentName}</h1>
        </div>

        {/* Info Grid */}
        <Card>
          <CardContent className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4 items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Email</p>
              <p className="font-semibold">{(studentProfile as any)?.email || pendingInv?.email || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Primer acceso</p>
              <p className="font-semibold">{formatDateProject(studentFirstAccess)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total pagado</p>
              <p className="font-bold text-2xl text-success">${totalPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Productos activos</p>
              <p className="font-semibold">{activeProducts.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Productos Con Acceso */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Productos con acceso</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeProducts.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">Este alumno no tiene acceso a ningún producto.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Suscripción</TableHead>
                      <TableHead>Fecha acceso</TableHead>
                      <TableHead>Expiración</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeProducts.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{p.productTitle}</TableCell>
                        <TableCell><Badge variant="outline" className="text-muted-foreground">{p.productType}</Badge></TableCell>
                        <TableCell className="capitalize font-medium">
                          {p.subscriptionType} {p.paidPrice > 0 ? `($${p.paidPrice})` : '($0)'}
                        </TableCell>
                        <TableCell>{formatDateProject(p.accessDate)}</TableCell>
                        <TableCell>{p.expirationDate ? formatDateProject(p.expirationDate) : 'Ilimitado'}</TableCell>
                        <TableCell>{statusBadge(p.expirationDate)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {p.expirationDate && p.subscriptionType !== 'Único Pago' && (
                                <DropdownMenuItem onClick={() => { 
                                  setSelectedProduct(p); 
                                  setNewExpirationDate(p.expirationDate ? p.expirationDate.split('T')[0] : ""); 
                                  setIsExtendOpen(true); 
                                }}>Extender acceso</DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive font-medium" onClick={() => { setSelectedProduct(p); setIsRevokeOpen(true); }}>Revocar acceso</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registrar Pago Manual (Inline Form) */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Registrar pago manual</CardTitle>
          </CardHeader>
          <CardContent>
             <form onSubmit={handleRegisterPayment} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2 lg:col-span-1">
                <Label>Producto</Label>
                <Select value={payProduct} onValueChange={handleProductChange}>
                  <SelectTrigger><SelectValue placeholder="Elegir..." /></SelectTrigger>
                  <SelectContent>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title} — Curso</SelectItem>
                    ))}
                    {ebooks.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.title} — Ebook</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {payProduct && (
                <div className="space-y-2 lg:col-span-1">
                  <Label>Tipo de acceso</Label>
                  <Select value={paySubscription} onValueChange={setPaySubscription}>
                    <SelectTrigger><SelectValue placeholder="Tipo..." /></SelectTrigger>
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

              <div className="space-y-2 md:col-span-1 lg:col-span-1">
                <Label>Notas (Opcional)</Label>
                <Input placeholder="Ej. Pago Parcial" value={payNotes} onChange={e => setPayNotes(e.target.value)} />
              </div>
              <div className="md:col-span-4 lg:col-span-1">
                <Button type="submit" className="w-full">Registrar</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Historial de Pagos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historial de pagos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {payments.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">Este alumno no tiene pagos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDateProject(p.createdAt)}</TableCell>
                        <TableCell className="font-medium text-muted-foreground">{courses.find(c => c.id === p.productId)?.title || ebooks.find(e => e.id === p.productId)?.title || 'Desconocido'}</TableCell>
                        <TableCell className="font-bold text-success">${p.amount.toFixed(2)} {p.currency || 'USD'}</TableCell>
                        <TableCell><Badge className={`border-none ${getMethodBadge(p.method)}`}>{getMethodLabel(p.method)}</Badge></TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate" title={p.notes || ''}>{p.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPaymentPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {(paymentPage - 1) * paymentsPerPage + 1} a {Math.min(paymentPage * paymentsPerPage, payments.length)} de {payments.length} pagos
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setPaymentPage(p => Math.max(1, p - 1))}
                        disabled={paymentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setPaymentPage(p => Math.min(totalPaymentPages, p + 1))}
                        disabled={paymentPage === totalPaymentPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progreso en Cursos */}
        <Card>
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full h-full p-6 [&[data-state=open]>div>svg]:rotate-180">
              <CardTitle className="text-lg">Progreso en cursos</CardTitle>
              <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                <ChevronDown className="h-5 w-5 transition-transform" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-6 pb-6 pt-0 space-y-6">
              {activeProducts.map((p, idx) => {
                const percent = 0; // MVP no progress tracking yet
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{p.productTitle}</span>
                      <span className="font-bold text-primary">{percent}% Completado</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>Última clase: Intro</span>
                      <span>Actividad: Reciente</span>
                    </div>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </Card>

      </div>

      {/* MODALS */}
      <Dialog open={isExtendOpen} onOpenChange={setIsExtendOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Extender acceso</DialogTitle></DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p><span className="font-semibold">Producto:</span> {selectedProduct.productTitle}</p>
                <p className="mt-1"><span className="font-semibold">Expiración actual:</span> {selectedProduct.expirationDate ? formatDateProject(selectedProduct.expirationDate) : 'Ilimitado'}</p>
              </div>
              <div className="space-y-2">
                <Label>Nueva fecha de expiración</Label>
                <Input 
                  type="date" 
                  value={newExpirationDate} 
                  onChange={e => setNewExpirationDate(e.target.value)} 
                  min={selectedProduct.expirationDate ? new Date(selectedProduct.expirationDate).toISOString().split('T')[0] : undefined}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtendOpen(false)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!selectedProduct) return;
              if (!newExpirationDate) { toast.error("Seleccione una fecha"); return; }
              
              if (selectedProduct.expirationDate && new Date(newExpirationDate) <= new Date(selectedProduct.expirationDate)) {
                toast.error("La nueva fecha debe ser posterior a la expiración actual.");
                return;
              }

              const { error } = await supabase.from('enrollments')
                .update({ expires_at: new Date(newExpirationDate).toISOString(), status: 'active' })
                .eq('id', selectedProduct.enrollmentId);
                
              if (error) { toast.error(error.message); return; }
              toast.success("Acceso extendido exitosamente"); 
              queryClient.invalidateQueries({ queryKey: ['enrollments'] });
              setIsExtendOpen(false); 
            }}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isRevokeOpen} onOpenChange={setIsRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive h-5 w-5" /> ¿Revocar acceso?</AlertDialogTitle>
            <AlertDialogDescription>
              El alumno perderá el acceso a <span className="font-semibold">{selectedProduct?.productTitle}</span> inmediatamente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
              if (!selectedProduct) return;
              await supabase.from('enrollments')
                .update({ status: 'canceled' })
                .eq('id', selectedProduct.enrollmentId);
              queryClient.invalidateQueries({ queryKey: ['enrollments'] });
              toast.success("Acceso revocado (historial preservado)");
              setIsRevokeOpen(false);
            }}>
              Revocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </ProfesorLayout>
  );
}
