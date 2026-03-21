import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { getCurrentProfesor, sales, courses, comments } from "@/data/mockData";
import { Users, DollarSign, BookOpen, Crown, Calendar, AlertCircle, AlertTriangle, CalendarClock, MessageSquare } from "lucide-react";
import { parseISO, differenceInDays, addMonths } from "date-fns";
import { formatDateProject } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ProfesorDashboard() {
  const prof = getCurrentProfesor();
  const profSales = sales.filter(s => s.profesorId === prof.id);
  const thisMonth = profSales.filter(s => s.date.startsWith('2025-03'));
  const profCourses = courses.filter(c => c.profesorId === prof.id);
  const totalStudents = new Set(profSales.map(s => s.alumnoId)).size;
  const thisMonthAmount = thisMonth.reduce((a, s) => a + s.amount, 0).toFixed(2);
  const thisMonthCount = thisMonth.length;
  
  const today = new Date();
  const daysUntilRenewal = prof.currentPeriodEnd ? differenceInDays(parseISO(prof.currentPeriodEnd), today) : null;

  // "Alumnos por renovar" (Próximos 7 días asumiendo pago mensual basado en fecha de venta)
  const upcomingStudentRenewals = profSales.map(sale => {
    const nextCharge = addMonths(parseISO(sale.date), 1);
    const diff = differenceInDays(nextCharge, today);
    return { ...sale, nextCharge, daysLeft: diff };
  }).filter(s => s.daysLeft >= 0 && s.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // "Comentarios no leídos" (Comentarios de alumnos en los cursos dictados por él)
  const profLessonIds = new Set(
    profCourses.flatMap(c => c.modules.flatMap(m => m.lessons.map(l => l.id)))
  );
  
  const unreadComments = comments
    .filter(c => profLessonIds.has(c.lessonId) && c.userId !== prof.id)
    .sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <h1 className="text-2xl font-bold">Dashboard</h1>

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
        
        {prof.plan !== 'freemium' && daysUntilRenewal !== null && daysUntilRenewal >= 0 && daysUntilRenewal <= 7 && (
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

        <div className="grid gap-6 lg:grid-cols-2 pt-6 border-t mt-8">
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
                          <TableCell className="font-medium whitespace-nowrap">{s.alumnoName}</TableCell>
                          <TableCell className="text-muted-foreground">{s.courseTitle}</TableCell>
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

          {/* Comentarios no leídos */}
          <Card>
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Comentarios No Leídos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {unreadComments.length > 0 ? (
                <ul className="divide-y divide-border">
                  {unreadComments.map(comment => (
                    <li key={comment.id} className="p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{comment.userName}</p>
                            <span className="text-xs text-muted-foreground">{formatDateProject(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 italic">"{comment.text}"</p>
                          <div className="flex justify-end mt-2">
                            <Button variant="link" size="sm" className="h-auto p-0 text-primary">Responder</Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center">
                  Tu bandeja de entrada está limpia. No hay preguntas sin leer.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProfesorLayout>
  );
}
