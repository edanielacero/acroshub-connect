import { AdminLayout } from "@/components/layout/AdminLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { profesores, alumnos } from "@/data/mockData";
import { Users, UserCheck, GraduationCap, AlertTriangle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { parseISO, differenceInDays } from "date-fns";
import { formatDateProject } from "@/lib/utils";

const planPrices = {
  gratis: { mensual: 0, anual: 0 },
  basico: { mensual: 30, anual: 300 },
  pro: { mensual: 50, anual: 500 },
  enterprise: { mensual: 100, anual: 1000 }
};

export default function AdminDashboard() {
  const activeProfs = profesores.filter(p => p.status === 'activo');

  const today = new Date();

  // 1. Renovación próxima (0 a 7 días)
  const upcomingRenewals = profesores.filter(p => {
    if (p.plan === 'gratis' || !p.currentPeriodEnd || p.status !== 'activo') return false;
    const endDate = parseISO(p.currentPeriodEnd);
    const diff = differenceInDays(endDate, today);
    return diff >= 0 && diff <= 7;
  });

  // 2. Estado de gracia (1 a 5 días tarde, aún "activos" en bd hasta suspensión)
  const inGracePeriod = profesores.filter(p => {
    if (p.plan === 'gratis' || !p.currentPeriodEnd || p.status !== 'activo') return false;
    const endDate = parseISO(p.currentPeriodEnd);
    const diff = differenceInDays(today, endDate);
    return diff > 0 && diff <= 5;
  });

  // 3. Downgrades programados
  const scheduledDowngrades = profesores.filter(p => p.scheduledDowngradePlan);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getAmountOwed = (prof: any) => {
    if (!prof.plan || !prof.billingCycle || prof.plan === 'gratis') return 0;
    return planPrices[prof.plan as keyof typeof planPrices]?.[prof.billingCycle as 'mensual' | 'anual'] || 0;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard title="Total profesores" value={profesores.length} icon={<Users className="h-6 w-6" />} />
          <MetricCard title="Profesores activos" value={activeProfs.length} icon={<UserCheck className="h-6 w-6" />} />
          <MetricCard title="Total alumnos" value={alumnos.length} icon={<GraduationCap className="h-6 w-6" />} />
        </div>

        <div className="pt-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas / Acciones pendientes
            </h2>
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
              <Link to="/admin/profesores">Directorio completo</Link>
            </Button>
          </div>

          <div className="grid gap-6">
            {/* Renovación Próxima */}
            <Card className="border-orange-200">
              <CardHeader className="bg-orange-50/50 pb-4">
                <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Renovación próxima (próximos 7 días)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {upcomingRenewals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Profesor</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead>Faltan</TableHead>
                          <TableHead>Plan actual</TableHead>
                          <TableHead>Monto esperado</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingRenewals.map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium whitespace-nowrap">{p.name}</TableCell>
                            <TableCell>{formatDateProject(p.currentPeriodEnd)}</TableCell>
                            <TableCell className="text-orange-600 font-medium">
                              {differenceInDays(parseISO(p.currentPeriodEnd!), today)} días
                            </TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{p.plan}</Badge></TableCell>
                            <TableCell>${getAmountOwed(p)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild><Link to={`/admin/profesores/${p.id}`}>Ver</Link></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="p-6 text-sm text-muted-foreground text-center">No hay renovaciones en los próximos 7 días.</p>
                )}
              </CardContent>
            </Card>

            {/* Estado de gracia */}
            <Card className="border-destructive/30">
              <CardHeader className="bg-destructive/10 pb-4">
                <CardTitle className="text-destructive text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" /> Profesores en estado de gracia (Atrasados)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {inGracePeriod.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Profesor</TableHead>
                          <TableHead>Vencimiento original</TableHead>
                          <TableHead>Días de atraso</TableHead>
                          <TableHead>Plan atrasado</TableHead>
                          <TableHead>Monto adeudado</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inGracePeriod.map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium whitespace-nowrap">{p.name}</TableCell>
                            <TableCell>{formatDateProject(p.currentPeriodEnd)}</TableCell>
                            <TableCell className="text-destructive font-medium">
                              {differenceInDays(today, parseISO(p.currentPeriodEnd!))} días
                            </TableCell>
                            <TableCell><Badge variant="outline" className="capitalize border-destructive text-destructive">{p.plan}</Badge></TableCell>
                            <TableCell className="font-medium">${getAmountOwed(p)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild><Link to={`/admin/profesores/${p.id}`}>Ver / Suspender</Link></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="p-6 text-sm text-muted-foreground text-center">No hay profesores en estado de gracia.</p>
                )}
              </CardContent>
            </Card>

            {/* Downgrades programados */}
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50/50 pb-4">
                <CardTitle className="text-blue-800 text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Downgrades programados (A fin de ciclo)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {scheduledDowngrades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Profesor</TableHead>
                          <TableHead>Fecha de Downgrade</TableHead>
                          <TableHead>Plan actual</TableHead>
                          <TableHead>Plan futuro</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scheduledDowngrades.map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium whitespace-nowrap">{p.name}</TableCell>
                            <TableCell>{formatDateProject(p.currentPeriodEnd)}</TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{p.plan}</Badge></TableCell>
                            <TableCell><Badge className="capitalize bg-orange-100 text-orange-800 hover:bg-orange-100 border-none">{p.scheduledDowngradePlan}</Badge></TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild><Link to={`/admin/profesores/${p.id}`}>Ver</Link></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="p-6 text-sm text-muted-foreground text-center">No hay downgrades programados actualmente.</p>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
