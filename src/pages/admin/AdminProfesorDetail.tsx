import { AdminLayout } from "@/components/layout/AdminLayout";
import { platformSubscriptions } from "@/data/mockData";
import { supabase } from "@/lib/supabase";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/MetricCard";
import { FolderOpen, BookOpen, Users, ArrowLeft, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatDateProject } from "@/lib/utils";

const planPrices = {
  gratis: { mensual: 0, anual: 0 },
  basico: { mensual: 30, anual: 300 },
  pro: { mensual: 50, anual: 500 },
  enterprise: { mensual: 100, anual: 1000 }
};

const planLevels: Record<string, number> = { gratis: 0, basico: 1, pro: 2, enterprise: 3 };

export default function AdminProfesorDetail() {
  const { id } = useParams();
  const [prof, setProf] = useState<any>(null);
  const [profHubs, setProfHubs] = useState<any[]>([]);
  const [profCourses, setProfCourses] = useState<any[]>([]);
  const [profStudents, setProfStudents] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payType, setPayType] = useState<"first_payment" | "renewal" | "upgrade" | "downgrade">("first_payment");
  const [payPlan, setPayPlan] = useState<string>("");
  const [payCycle, setPayCycle] = useState<"mensual" | "anual">("mensual");
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payMethod, setPayMethod] = useState<"manual" | "stripe">("manual");
  const [payNotes, setPayNotes] = useState("");

  const [subs, setSubs] = useState(platformSubscriptions);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadProf() {
      if (!id) return;
      try {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (p) {
          setProf({
            ...p,
            name: p.full_name,
            currentPeriodEnd: p.current_period_end,
            currentPeriodStart: p.current_period_start,
            billingCycle: p.billing_cycle,
            scheduledDowngradePlan: p.scheduled_downgrade_plan,
            stripeConnected: p.stripe_connected
          });
        }
        
        const { data: hubsData } = await supabase.from('hubs').select('*').eq('profesor_id', id);
        if (hubsData) setProfHubs(hubsData);
        
        const { data: coursesData } = await supabase.from('courses').select('*').eq('profesor_id', id);
        if (coursesData) setProfCourses(coursesData);
        
        // Simular count de alumnos basado en la respuesta
        const { data: enrollments } = await supabase.from('enrollments').select('alumno_id');
        if (enrollments) {
           // En la vida real haríamos join con productos del profesor
           setProfStudents(new Set(enrollments.map(e => e.alumno_id)).size);
        }

      } catch (e) {
        console.error("Error loading prof details", e);
      } finally {
        setLoading(false);
      }
    }
    loadProf();
  }, [id]);

  useEffect(() => {
    if (!isModalOpen || !prof) return;

    if (payType === 'renewal') {
      setPayPlan(prof.plan);
      setPayCycle(prof.billingCycle || "mensual");
    } else if (payType === 'downgrade') {
      setPayCycle(prof.billingCycle || "mensual");
    }

    if (payType === 'downgrade') {
      setPayAmount("");
      return;
    }

    if (payPlan && payCycle) {
      const target = planPrices[payPlan as keyof typeof planPrices]?.[payCycle] || 0;
      const current = (prof.plan !== 'gratis' && prof.billingCycle) ? planPrices[prof.plan as keyof typeof planPrices]?.[prof.billingCycle] || 0 : 0;
      
      if (payType === 'first_payment' || payType === 'renewal') {
        setPayAmount(target);
      } else if (payType === 'upgrade') {
        setPayAmount(target - current > 0 ? target - current : 0);
      }
    }
  }, [isModalOpen, payType, payPlan, payCycle, prof]);

  if (!prof && !loading) return <AdminLayout><p>Profesor no encontrado</p></AdminLayout>;
  if (loading) return <AdminLayout><div className="p-10 text-center animate-pulse">Cargando detalles...</div></AdminLayout>;
  
  const profEbooks: any[] = [];
  const profSubs = subs.filter(s => s.tenantId === prof.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateProf = (field: keyof typeof prof, value: any) => {
    setProf(prev => prev ? { ...prev, [field]: value } : prev);
    if(field === 'status') toast.success(`Estado actualizado a ${value}`);
  };

  const handleRegisterPayment = () => {
    if (!payPlan || !payCycle) {
      toast.error("Complete todos los campos obligatorios");
      return;
    }
    
    if (payType === 'downgrade') {
      updateProf('scheduledDowngradePlan', payPlan);
      toast.success("Downgrade programado para el final del ciclo");
      setIsModalOpen(false);
      return;
    }

    const newSub = {
      id: `ps-${Date.now()}`,
      tenantId: prof.id,
      type: payType,
      planFrom: payType === 'first_payment' ? null : prof.plan,
      planTo: payPlan,
      billingCycle: payCycle,
      amount: Number(payAmount) || 0,
      method: payMethod,
      notes: payNotes || null,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setSubs([newSub, ...subs]);
    
    // Update locally
    const cDate = new Date();
    const nextDate = new Date();
    if (payCycle === 'anual') nextDate.setFullYear(nextDate.getFullYear() + 1);
    else nextDate.setMonth(nextDate.getMonth() + 1);

    setProf(prev => prev ? { 
      ...prev, 
      plan: payPlan as 'gratis'|'basico'|'pro'|'enterprise',
      billingCycle: payCycle,
      currentPeriodStart: payType === 'renewal' ? prev.currentPeriodStart : cDate.toISOString().split('T')[0],
      currentPeriodEnd: nextDate.toISOString().split('T')[0],
      scheduledDowngradePlan: null,
      status: 'activo'
    } : prev);

    toast.success("Transacción registrada correctamente");
    setIsModalOpen(false);
    setPayAmount("");
    setPayNotes("");
  };

  const availablePlans = Object.keys(planPrices).filter(k => {
    if (payType === 'upgrade') return planLevels[k] > planLevels[prof.plan];
    if (payType === 'downgrade') return planLevels[k] < planLevels[prof.plan];
    return true;
  });

  const getSubBadgeColor = (t: string) => {
    switch (t) {
      case 'first_payment': return "bg-green-100 text-green-800 hover:bg-green-100";
      case 'renewal': return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case 'upgrade': return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case 'downgrade': return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      default: return "";
    }
  };

  const totalPages = Math.ceil(profSubs.length / itemsPerPage);
  const paginatedSubs = profSubs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link to="/admin/profesores"><ArrowLeft className="h-5 w-5" /></Link></Button>
            <h1 className="truncate text-2xl font-bold">{prof.name}</h1>
          </div>
        </div>

        {/* Info General & Estado */}
        <Card>
          <CardContent className="grid gap-6 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-6 items-end">
            <div><p className="text-sm text-muted-foreground mb-1">Email</p><p className="font-medium break-all">{prof.email}</p></div>
            <div><p className="text-sm text-muted-foreground mb-1">Fecha de registro</p><p className="font-medium">{formatDateProject(prof.createdAt)}</p></div>
            <div><p className="text-sm text-muted-foreground mb-1">Stripe Payouts</p><p className="font-medium">{prof.stripeConnected ? '✅ Conectado' : '❌ No conectado'}</p></div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Estado</p>
              <div>
                <Badge className={`capitalize text-white ${prof.status === 'activo' ? 'bg-success hover:bg-success/80' : prof.status === 'gratis' ? 'bg-primary hover:bg-primary/80' : 'bg-destructive hover:bg-destructive/80'}`}>
                  {prof.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suscripción Panel */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Suscripción</CardTitle>
              <CardDescription>Gestiona el plan y los cobros de este profesor</CardDescription>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>Registrar Pago / Cambio</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nueva Transacción</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Trámite</Label>
                      <Select value={payType} onValueChange={(v) => setPayType(v as typeof payType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first_payment">Primer Pago</SelectItem>
                          <SelectItem value="renewal">Renovación</SelectItem>
                          <SelectItem value="upgrade">Upgrade</SelectItem>
                          <SelectItem value="downgrade">Downgrade programado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Método de cobro</Label>
                      <Select value={payMethod} onValueChange={(v) => setPayMethod(v as typeof payMethod)} disabled={payType === 'downgrade'}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="manual">Manual/Externo</SelectItem><SelectItem value="stripe">Stripe Automático</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plan Destino</Label>
                      <Select value={payPlan} onValueChange={setPayPlan} disabled={payType === 'renewal'}>
                        <SelectTrigger className="capitalize"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                        <SelectContent>
                          {availablePlans.map(k => <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Modalidad</Label>
                      <Select value={payCycle} onValueChange={(v) => setPayCycle(v as typeof payCycle)} disabled={payType === 'downgrade' || payType === 'renewal' || (prof.billingCycle === 'anual' && payType === 'upgrade')}>
                        <SelectTrigger className="capitalize"><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="mensual">Mensual</SelectItem><SelectItem value="anual">Anual</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>

                  {payType !== 'downgrade' && (
                    <div className="space-y-2">
                      <Label>Monto Final Cobrado (USD)</Label>
                      <Input type="number" placeholder="Ej: 30" value={payAmount} onChange={(e) => setPayAmount(e.target.valueAsNumber || "")} />
                      <span className="text-xs text-muted-foreground">Cantidad que el profesor pagó verdaderamente. Se auto-calculó el precio base.</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Notas internas (Opcional)</Label>
                    <Textarea placeholder="Razón del pago o notas adicionales..." value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button onClick={handleRegisterPayment}>{payType === 'downgrade' ? 'Programar Downgrade' : 'Registrar Pago'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Plan Vigente</Label>
                <p className="capitalize font-semibold text-lg mt-1">{prof.plan} {prof.billingCycle ? `(${prof.billingCycle})` : ''}</p>
              </div>
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Ciclo Iniciado</Label>
                <p className="font-medium mt-1">{prof.currentPeriodStart ? formatDateProject(prof.currentPeriodStart) : 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Renovación / Expiración</Label>
                <p className="font-medium mt-1">{prof.currentPeriodEnd ? formatDateProject(prof.currentPeriodEnd) : 'N/A'}</p>
              </div>
            </div>
            
            {prof.scheduledDowngradePlan && (
              <div className="mt-4 flex items-center justify-between p-3 border border-orange-200 bg-orange-50/50 rounded-lg text-orange-800">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  ⚠️ Existe un downgrade programado a plan "{prof.scheduledDowngradePlan}" para el {formatDateProject(prof.currentPeriodEnd)}
                </div>
                <Button 
                  variant="outline"
                  size="sm" 
                  className="h-8 border-orange-300 bg-white/60 text-orange-800 hover:bg-orange-200 hover:text-orange-950" 
                  onClick={() => updateProf('scheduledDowngradePlan', null)}
                >
                  Cancelar Downgrade
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de Pagos Local */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de Cobros</CardTitle>
          </CardHeader>
          <CardContent>
            {profSubs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Transacción</TableHead>
                      <TableHead>Plan (De → A)</TableHead>
                      <TableHead>Modalidad</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSubs.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap">{formatDateProject(s.createdAt)}</TableCell>
                        <TableCell>
                          <Badge className={getSubBadgeColor(s.type)} variant="secondary">{s.type.replace('_', ' ')}</Badge>
                          {s.method === 'stripe' && <span className="ml-2 text-xs text-muted-foreground">(Stripe)</span>}
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">
                          {s.planFrom ? `${s.planFrom} → ` : ''} <span className="text-foreground font-medium">{s.planTo}</span>
                        </TableCell>
                        <TableCell className="capitalize">{s.billingCycle}</TableCell>
                        <TableCell className="text-right font-medium">${s.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2 pt-4 border-t mt-4">
                    <div className="text-sm text-muted-foreground font-medium">
                      Página {currentPage} de {totalPages} ({profSubs.length} registros)
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
               <p className="text-sm text-muted-foreground text-center py-4">Aún no hay transacciones registradas para este profesor.</p>
            )}
          </CardContent>
        </Card>

        {/* Metricas de contenido */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Academias creadas" value={profHubs.length} icon={<FolderOpen className="h-6 w-6" />} />
          <MetricCard title="Cursos" value={profCourses.length} icon={<BookOpen className="h-6 w-6" />} />
          <MetricCard title="Ebooks" value={profEbooks.length} icon={<FileText className="h-6 w-6" />} />
          <MetricCard title="Alumnos" value={profStudents} icon={<Users className="h-6 w-6" />} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mantenemos Hubs y Cursos */}
          <Card>
            <CardHeader><CardTitle>Academias del Profesor</CardTitle></CardHeader>
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
                <p className="text-sm text-muted-foreground">No tiene Academias creadas.</p>
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

        {/* Zona de Peligro */}
        <div className="pt-6 border-t border-destructive/20 mt-8">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive text-lg">Zona de Peligro</CardTitle>
              <CardDescription>Acciones críticas que afectan el acceso de este profesor a la plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-sm">Estado de la cuenta: {prof.status === 'suspendido' ? 'Suspendida' : 'Activa'}</h4>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[600px]">Al suspender a un profesor, este perderá acceso a su panel administrativo y sus alumnos no podrán comprar nuevos cursos ni acceder temporalmente a sus contenidos.</p>
                </div>
                <Button 
                  variant={prof.status === 'suspendido' ? 'outline' : 'destructive'} 
                  onClick={() => updateProf('status', prof.status === 'suspendido' ? (prof.plan === 'gratis' ? 'gratis' : 'activo') : 'suspendido')}
                  className="w-full sm:w-auto"
                >
                  {prof.status === 'suspendido' ? 'Quitar Suspensión' : 'Suspender Profesor'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
