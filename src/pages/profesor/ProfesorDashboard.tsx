import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { useProfesorData } from "@/hooks/useProfesorData";
import { useAuth } from "@/contexts/AuthContext";
import { Users, DollarSign, BookOpen, Crown, Calendar, AlertCircle, AlertTriangle, CalendarClock, MessageSquare, Check, Circle, Loader2 } from "lucide-react";
import { parseISO, differenceInDays, addMonths } from "date-fns";
import { formatDateProject } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ProfesorDashboard() {
  const { user } = useAuth();
  const { hubs: profHubs, courses: profCourses, ebooks: profEbooks, enrollments: profSales, isLoading } = useProfesorData();

  const prof = {
    id: user?.id || '',
    plan: 'gratis',
    currentPeriodEnd: null as string | null,
    scheduledDowngradePlan: null,
    stripeConnected: false,
    manualPaymentLink: null,
  };

  const today = new Date();
  const thisMonth = profSales.filter(s => new Date(s.created_at).getMonth() === today.getMonth());
  const totalStudents = new Set(profSales.map(s => s.alumno_id)).size;
  const thisMonthAmount = "0.00"; 
  const thisMonthCount = thisMonth.length;
  
  // Onboarding Logic
  const hasHub = profHubs.length > 0;
  const hasProduct = profCourses.length > 0 || profEbooks.length > 0;
  const hasPayments = !!(prof.stripeConnected || prof.manualPaymentLink);
  const completedSteps = [hasHub, hasProduct, hasPayments].filter(Boolean).length;
  const progressPercent = Math.round((completedSteps / 3) * 100);
  const isOnboardingComplete = completedSteps === 3;
  
  const daysUntilRenewal = prof.currentPeriodEnd ? differenceInDays(parseISO(prof.currentPeriodEnd), today) : null;

  const upcomingStudentRenewals = profSales.map(sale => {
    const nextCharge = addMonths(new Date(sale.created_at), 1);
    const diff = differenceInDays(nextCharge, today);
    return { ...sale, nextCharge, daysLeft: diff };
  }).filter(s => s.daysLeft >= 0 && s.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (isLoading) {
    return (
      <ProfesorLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProfesorLayout>
    );
  }

  // "Comentarios sin responder" - placeholder until comments system is built
  const unreadComments: any[] = [];

  // Helper for relative time display
  const getRelativeTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 60) return `hace ${diff}m`;
    if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`;
    return `hace ${Math.floor(diff / 1440)}d`;
  };

  const getCommentLocation = (lessonId: string) => {
    return null;
  };

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        {/* Onboarding Flow */}
        {!isOnboardingComplete && (
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">¡Bienvenido a Acroshub! 👋</CardTitle>
              <CardDescription className="text-base text-muted-foreground/80">Sigue estos pasos para configurar tu academia y empezar a vender sin comisiones.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Progreso de configuración</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 w-full max-w-md bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500 ease-in-out" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-3">
                {/* Step 1 */}
                <Link to="/dashboard/hubs" className={`p-4 rounded-lg border transition-colors ${hasHub ? 'bg-background/60 border-green-200 opacity-75' : 'bg-background hover:border-primary cursor-pointer shadow-sm'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-1 ${hasHub ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                      {hasHub ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className={`font-semibold ${hasHub ? 'text-green-800 line-through' : ''}`}>1. Crea tu Academia</h4>
                      <p className="text-xs text-muted-foreground mt-1">Personaliza tu logo, colores y nombre de tu Hub.</p>
                    </div>
                  </div>
                </Link>

                {/* Step 2 */}
                <Link to={hasHub ? "/dashboard/hubs" : "#"} className={`p-4 rounded-lg border transition-colors ${hasProduct ? 'bg-background/60 border-green-200 opacity-75' : 'bg-background hover:border-primary shadow-sm'} ${!hasHub ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-1 ${hasProduct ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                      {hasProduct ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className={`font-semibold ${hasProduct ? 'text-green-800 line-through' : ''}`}>2. Sube un Producto</h4>
                      <p className="text-xs text-muted-foreground mt-1">Sube tu primer curso en video o E-book PDF.</p>
                    </div>
                  </div>
                </Link>

                {/* Step 3 */}
                <Link to="/dashboard/configuracion" className={`p-4 rounded-lg border transition-colors ${hasPayments ? 'bg-background/60 border-green-200 opacity-75' : 'bg-background hover:border-primary cursor-pointer shadow-sm'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-1 ${hasPayments ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                      {hasPayments ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className={`font-semibold ${hasPayments ? 'text-green-800 line-through' : ''}`}>3. Configura Pagos</h4>
                      <p className="text-xs text-muted-foreground mt-1">Conecta Stripe o provee un link para venta manual.</p>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Banners */}
        {prof.scheduledDowngradePlan && (
          <div className="flex items-start gap-3 p-4 border border-blue-200 bg-blue-50 text-blue-800 rounded-lg">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Downgrade programado</p>
              <p className="text-sm mt-1">Al finalizar tu ciclo actual ({formatDateProject(prof.currentPeriodEnd)}), tu cuenta pasará al plan <span className="font-semibold capitalize">{prof.scheduledDowngradePlan}</span>.</p>
            </div>
          </div>
        )}
        
        {prof.plan !== 'gratis' && daysUntilRenewal !== null && daysUntilRenewal >= 0 && daysUntilRenewal <= 7 && (
          <div className="flex items-start gap-3 p-4 border border-orange-200 bg-orange-50 text-orange-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-orange-600" />
            <div>
              <p className="font-semibold text-sm">Tu plan caduca pronto</p>
              <p className="text-sm mt-1">Faltan <span className="font-bold">{daysUntilRenewal === 0 ? "menos de 24 horas" : `${daysUntilRenewal} días`}</span> para el fin de tu ciclo ({formatDateProject(prof.currentPeriodEnd)}). Te sugerimos asegurar tu renovación a tiempo para evitar interrupciones.</p>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard title="Plan actual" value={prof.plan.toUpperCase()} icon={<Crown className="h-6 w-6" />} />
          <MetricCard title="Renovación" value={prof.currentPeriodEnd ? formatDateProject(prof.currentPeriodEnd) : 'N/A'} icon={<Calendar className="h-6 w-6" />} />
          <MetricCard title="Alumnos activos" value={totalStudents} icon={<Users className="h-6 w-6" />} />
          <MetricCard 
            title="Ventas del mes" 
            value={`$${thisMonthAmount}`} 
            description={`${thisMonthCount} transacción${thisMonthCount !== 1 ? 'es' : ''}`} 
            icon={<DollarSign className="h-6 w-6" />} 
          />
          <MetricCard title="Cursos" value={profCourses.length} icon={<BookOpen className="h-6 w-6" />} />
        </div>

        <div className="space-y-6 pt-6 border-t mt-8">
          {/* Alumnos por renovar */}
          <Card>
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" /> Alumnos por renovar (Próximos 7 días)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingStudentRenewals.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alumno</TableHead>
                        <TableHead>Curso / Suscripción</TableHead>
                        <TableHead>Siguiente cobro</TableHead>
                        <TableHead className="text-right">Alerta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingStudentRenewals.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium whitespace-nowrap">{s.profiles?.full_name || 'Desconocido'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {s.product_type === 'course' 
                              ? profCourses.find(c => c.id === s.product_id)?.title 
                              : profEbooks.find(e => e.id === s.product_id)?.title}
                          </TableCell>
                          <TableCell>{formatDateProject(s.nextCharge.toISOString())}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={s.daysLeft <= 2 ? "destructive" : "secondary"}>
                              {s.daysLeft === 0 ? "Hoy" : `Faltan ${s.daysLeft} días`}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center">
                  No hay renovaciones mensuales programadas en los próximos 7 días.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comentarios sin responder */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Comentarios sin responder
              </CardTitle>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium" size="sm" asChild>
                <Link to="/dashboard/comentarios">Responder Comentarios</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {unreadComments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alumno</TableHead>
                        <TableHead>Comentario</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unreadComments.map(comment => {
                        const loc = getCommentLocation(comment.lessonId);
                        const hub = profHubs.find(h => h.id === loc?.hubId);
                        return (
                          <TableRow key={comment.id}>
                            <TableCell className="font-medium">{comment.userName}</TableCell>
                            <TableCell>
                              <div className="max-w-[150px] truncate" title={comment.text}>
                                {comment.text.length > 50 ? comment.text.substring(0, 47) + '...' : comment.text}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {loc ? `${loc.courseTitle} → ${loc.lessonTitle}` : 'Desconocido'}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                              {getRelativeTime(comment.createdAt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  🎉 No tienes comentarios pendientes
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProfesorLayout>
  );
}
