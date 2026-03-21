import { useParams, useNavigate } from "react-router-dom";
import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { useMemo, useState, useEffect } from "react";
import { alumnos, courses, studentPayments, getCurrentProfesor, lessonProgress, StudentPayment } from "@/data/mockData";
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
import { ArrowLeft, ChevronDown, ChevronUp, MoreHorizontal, AlertTriangle, Plus } from "lucide-react";
import { formatDateProject } from "@/lib/utils";
import { toast } from "sonner";
import { addDays, differenceInDays } from "date-fns";

export default function ProfesorAlumnoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const prof = getCurrentProfesor();

  const baseAlumno = useMemo(() => alumnos.find(a => a.id === id), [id]);

  // States to mimic mutations
  const [payments, setPayments] = useState<StudentPayment[]>(
    studentPayments.filter(sp => sp.userId === id && sp.tenantId === prof.id)
  );
  const [activeProducts, setActiveProducts] = useState(
    baseAlumno?.purchasedCourses.map((cId, idx) => ({
      courseId: cId,
      course: courses.find(c => c.id === cId),
      origin: idx === 0 ? 'stripe' : 'manual',
      type: 'Curso',
      subscriptionType: idx === 0 ? 'Mensual' : 'Único Pago',
      accessDate: baseAlumno.createdAt,
      expirationDate: idx === 0 ? addDays(new Date(baseAlumno.createdAt), 30).toISOString() : null,
    })) || []
  );

  // Modal States
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // New Payment Form State
  const [payProduct, setPayProduct] = useState("");
  const [payAmount, setPayAmount] = useState("0");
  const [paySubscription, setPaySubscription] = useState("");
  const [payNotes, setPayNotes] = useState("");

  useEffect(() => {
    if (payProduct) {
      const course = courses.find(c => c.id === payProduct);
      if (course) {
        setPayAmount(course.price.toString());
      }
    } else {
      setPayAmount("0");
    }
  }, [payProduct]);

  if (!baseAlumno) {
    return (
      <ProfesorLayout>
        <div className="p-8 text-center text-muted-foreground">Alumno no encontrado</div>
      </ProfesorLayout>
    );
  }

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payProduct || !payAmount || !paySubscription) {
      toast.error("Completa producto, monto y tipo de suscripción obligatoriamente.");
      return;
    }
    const newPayment: StudentPayment = {
      id: "sp-" + Math.random().toString(36).substr(2, 9),
      tenantId: prof.id,
      userId: baseAlumno.id,
      productId: payProduct,
      amount: parseFloat(payAmount),
      method: 'manual' as any,
      notes: payNotes,
      createdAt: new Date().toISOString()
    };
    
    // Create enrollment if it doesn't exist
    if (!activeProducts.find(p => p.courseId === payProduct)) {
      setActiveProducts(prev => [...prev, {
        courseId: payProduct,
        course: courses.find(c => c.id === payProduct),
        origin: 'manual',
        type: 'Curso',
        subscriptionType: paySubscription === 'unico' ? 'Único Pago' : (paySubscription === 'mensual' ? 'Mensual' : 'Anual'),
        accessDate: new Date().toISOString(),
        expirationDate: paySubscription === 'unico' ? null : addDays(new Date(), paySubscription === 'mensual' ? 30 : 365).toISOString(),
      }]);
    }
    
    setPayments(prev => [newPayment, ...prev]);
    toast.success("Pago registrado correctamente");
    setPayProduct("");
    setPayAmount("0");
    setPaySubscription("");
    setPayNotes("");
  };

  const statusBadge = (expirationDate: string | null) => {
    if (!expirationDate) return <Badge className="bg-success text-white">Activo</Badge>;
    const days = differenceInDays(new Date(expirationDate), new Date());
    if (days < 0) return <Badge variant="destructive">Expirado</Badge>;
    if (days <= 7) return <Badge className="bg-orange-500 text-white hover:bg-orange-600">Por expirar</Badge>;
    return <Badge className="bg-success hover:bg-success/80 text-white">Activo</Badge>;
  };

  const originBadge = (origin: string) => {
    switch (origin) {
      case 'stripe': return <Badge className="bg-blue-100 text-blue-800 border-none">Stripe</Badge>;
      case 'manual': return <Badge className="bg-gray-100 text-gray-800 border-none">Manual</Badge>;
      case 'gift': return <Badge className="bg-purple-100 text-purple-800 border-none">Regalo</Badge>;
      default: return <Badge variant="outline" className="capitalize">{origin}</Badge>;
    }
  };

  const getMethodBadge = (m: string) => {
    switch(m) {
      case 'stripe': return "bg-blue-100 text-blue-800";
      case 'paypal': return "bg-sky-100 text-sky-800";
      case 'transfer': return "bg-gray-100 text-gray-800";
      case 'cash': return "bg-green-100 text-green-800";
      case 'crypto': return "bg-orange-100 text-orange-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const expiringSub = activeProducts.find(p => p.expirationDate && differenceInDays(new Date(p.expirationDate), new Date()) <= 7 && differenceInDays(new Date(p.expirationDate), new Date()) >= 0);

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        
        {expiringSub && (
          <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-800 p-4 rounded-md flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-semibold">Atención: Suscripción por vencer</p>
              <p className="text-sm">El acceso del alumno a <span className="font-semibold">{expiringSub.course?.title}</span> vence en {differenceInDays(new Date(expiringSub.expirationDate!), new Date())} días.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/alumnos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{baseAlumno.name}</h1>
        </div>

        {/* Info Grid */}
        <Card>
          <CardContent className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4 items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Email</p>
              <p className="font-semibold">{baseAlumno.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Primer acceso</p>
              <p className="font-semibold">{formatDateProject(baseAlumno.createdAt)}</p>
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
                      <TableHead>Origen</TableHead>
                      <TableHead>Fecha acceso</TableHead>
                      <TableHead>Expiración</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeProducts.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{p.course?.title}</TableCell>
                        <TableCell><Badge variant="outline" className="text-muted-foreground">{p.type}</Badge></TableCell>
                        <TableCell className="capitalize font-medium">{p.subscriptionType || 'Único Pago'}</TableCell>
                        <TableCell>{originBadge(p.origin)}</TableCell>
                        <TableCell>{formatDateProject(p.accessDate)}</TableCell>
                        <TableCell>{p.expirationDate ? formatDateProject(p.expirationDate) : 'Ilimitado'}</TableCell>
                        <TableCell>{statusBadge(p.expirationDate)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedProduct(p); setIsExtendOpen(true); }}>Extender acceso</DropdownMenuItem>
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
            <form onSubmit={handleRegisterPayment} className="grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
              <div className="space-y-2 lg:col-span-1">
                <Label>Producto</Label>
                <Select value={payProduct} onValueChange={setPayProduct}>
                  <SelectTrigger><SelectValue placeholder="Elegir..." /></SelectTrigger>
                  <SelectContent>
                    {courses.filter(c => c.profesorId === prof.id).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 lg:col-span-1">
                <Label>Monto</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" step="0.01" className="pl-7" placeholder="0.00" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2 lg:col-span-1">
                <Label>Suscripción</Label>
                <Select value={paySubscription} onValueChange={setPaySubscription}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                    <SelectItem value="unico">Único pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    {payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDateProject(p.createdAt)}</TableCell>
                        <TableCell className="font-medium text-muted-foreground">{courses.find(c => c.id === p.productId)?.title || 'Desconocido'}</TableCell>
                        <TableCell className="font-bold text-success">${p.amount.toFixed(2)}</TableCell>
                        <TableCell><Badge className={`border-none capitalize ${getMethodBadge(p.method)}`}>{p.method}</Badge></TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate" title={p.notes || ''}>{p.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                const completed = lessonProgress.filter(lp => lp.userId === baseAlumno.id).length || 5;
                const total = p.course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) || 10;
                const percent = Math.min(100, Math.round((completed / total) * 100));

                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{p.course?.title}</span>
                      <span className="font-bold text-primary">{percent}% Completado</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>Última clase: Módulo 1 - Intro</span>
                      <span>Actividad: {formatDateProject(new Date().toISOString())}</span>
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
                <p><span className="font-semibold">Producto:</span> {selectedProduct.course?.title}</p>
                <p className="mt-1"><span className="font-semibold">Expiración actual:</span> {selectedProduct.expirationDate ? formatDateProject(selectedProduct.expirationDate) : 'Ilimitado'}</p>
              </div>
              <div className="space-y-2">
                <Label>Nueva fecha de expiración</Label>
                <Input type="date" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtendOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success("Acceso extendido exitosamente"); setIsExtendOpen(false); }}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isRevokeOpen} onOpenChange={setIsRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive h-5 w-5" /> ¿Revocar acceso?</AlertDialogTitle>
            <AlertDialogDescription>
              El alumno perderá el acceso a <span className="font-semibold">{selectedProduct?.course?.title}</span> inmediatamente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
              setActiveProducts(prev => prev.filter(p => p.courseId !== selectedProduct.courseId));
              toast.success("Acceso revocado");
            }}>
              Revocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </ProfesorLayout>
  );
}
