import { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { planConfigs } from "@/data/mockData";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, CalendarIcon } from "lucide-react";
import { platformSubscriptions as initialSubscriptions, PlatformSubscription } from "@/data/mockData";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatDateProject } from "@/lib/utils";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const getTypeBadgeClass = (type: string) => {
  switch (type) {
    case 'first_payment': return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'renewal': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'upgrade': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
    case 'downgrade': return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
    default: return '';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'first_payment': return 'Primer pago';
    case 'renewal': return 'Renovación';
    case 'upgrade': return 'Upgrade';
    case 'downgrade': return 'Downgrade';
    default: return type;
  }
};

export default function AdminVentas() {
  const [subs] = useState<PlatformSubscription[]>(initialSubscriptions);
  const [filterPlan, setFilterPlan] = useState("todos");
  const [filterCycle, setFilterCycle] = useState("todos");
  const [filterType, setFilterType] = useState("todos");
  
  type DateFilterType = 'current_month' | 'all' | 'custom';
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('current_month');
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [profesores, setProfesores] = useState<any[]>([]);

  useEffect(() => {
    async function loadProf() {
      const { data: profs } = await supabase.from('profiles').select('*').eq('role', 'profesor');
      if (profs) setProfesores(profs.map(p => ({ ...p, name: p.full_name })));
    }
    loadProf();
  }, []);

  const filteredSubs = useMemo(() => {
    return subs.filter(s => {
      if (s.type === 'downgrade' && s.amount === 0) return false;

      const matchPlan = filterPlan === "todos" || s.planTo === filterPlan;
      const matchCycle = filterCycle === "todos" || s.billingCycle === filterCycle;
      const matchType = filterType === "todos" || s.type === filterType;
      
      let matchDate = true;
      const saleDate = parseISO(s.createdAt);
      
      if (dateFilterType === 'current_month') {
        const now = new Date();
        matchDate = saleDate >= startOfMonth(now) && saleDate <= endOfMonth(now);
      } else if (dateFilterType === 'custom' && dateStart && dateEnd) {
        matchDate = saleDate >= parseISO(dateStart) && saleDate <= parseISO(dateEnd);
      }
      
      return matchPlan && matchCycle && matchDate && matchType;
    });
  }, [subs, filterPlan, filterCycle, filterType, dateFilterType, dateStart, dateEnd]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPlan, filterCycle, filterType, dateFilterType, dateStart, dateEnd]);

  const totalEarnings = filteredSubs.reduce((acc, curr) => acc + curr.amount, 0);

  const chartData = useMemo(() => {
    const dataByDate = filteredSubs.reduce((acc, sub) => {
      acc[sub.createdAt] = (acc[sub.createdAt] || 0) + sub.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(dataByDate).sort().map(date => ({
      date,
      total: dataByDate[date]
    }));
  }, [filteredSubs]);

  const totalPages = Math.ceil(filteredSubs.length / itemsPerPage);
  const paginatedSubs = filteredSubs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const metrics = useMemo(() => {
    const firstPayments = filteredSubs.filter(s => s.type === 'first_payment');
    const renewals = filteredSubs.filter(s => s.type === 'renewal');
    const upgrades = filteredSubs.filter(s => s.type === 'upgrade');
    // Para downgrades, contar todos (incluyendo los de $0 que normalmente se excluyen)
    const downgrades = subs.filter(s => {
      if (s.type !== 'downgrade') return false;
      const saleDate = parseISO(s.createdAt);
      if (dateFilterType === 'current_month') {
        const now = new Date();
        return saleDate >= startOfMonth(now) && saleDate <= endOfMonth(now);
      } else if (dateFilterType === 'custom' && dateStart && dateEnd) {
        return saleDate >= parseISO(dateStart) && saleDate <= parseISO(dateEnd);
      }
      return dateFilterType === 'all';
    });

    return {
      firstPayments: { count: firstPayments.length, total: firstPayments.reduce((a, c) => a + c.amount, 0) },
      renewals: { count: renewals.length, total: renewals.reduce((a, c) => a + c.amount, 0) },
      upgrades: { count: upgrades.length, total: upgrades.reduce((a, c) => a + c.amount, 0) },
      downgrades: { count: downgrades.length }
    };
  }, [filteredSubs, subs, dateFilterType, dateStart, dateEnd]);

  const getProfName = (id: string) => profesores.find(p => p.id === id)?.name || "Desconocido";

  const getDateFilterLabel = () => {
    if (dateFilterType === 'all') return "Todas las fechas";
    if (dateFilterType === 'current_month') return "Mes actual";
    if (dateStart && dateEnd) return `${dateStart} al ${dateEnd}`;
    return "Fechas personalizadas";
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <h1 className="text-2xl font-bold">Resumen de Ventas (Suscripciones)</h1>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Recaudado (Filtros Aplicados)</p>
              <h2 className="text-3xl font-bold mt-1">${totalEarnings.toFixed(2)}</h2>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase">Primeros pagos</p>
              <p className="text-2xl font-bold">{metrics.firstPayments.count}</p>
              <p className="text-sm text-green-600">${metrics.firstPayments.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase">Renovaciones</p>
              <p className="text-2xl font-bold">{metrics.renewals.count}</p>
              <p className="text-sm text-blue-600">${metrics.renewals.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase">Upgrades</p>
              <p className="text-2xl font-bold">{metrics.upgrades.count}</p>
              <p className="text-sm text-purple-600">${metrics.upgrades.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase">Downgrades</p>
              <p className="text-2xl font-bold">{metrics.downgrades.count}</p>
              <p className="text-sm text-orange-600">programados</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rendimiento Histórico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="h-[300px] w-full mt-4">
              {chartData.length > 0 ? (
                <ChartContainer config={{ total: { label: "Monto", color: "hsl(var(--primary))" } }} className="h-full w-full">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => {
                        try { return format(parseISO(value), 'd MMM', { locale: es }); } catch(e) { return value; }
                      }} 
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `$${value}`} 
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="var(--color-total)" 
                      strokeWidth={2} 
                      dot={{ r: 4, fill: "var(--color-total)" }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                  No hay datos suficientes para graficar.
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-4 bg-muted/30 p-4 rounded-lg border">
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-xs text-muted-foreground uppercase">Fecha</Label>
                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal bg-background">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {getDateFilterLabel()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3" align="start">
                    <div className="grid gap-3">
                      <Button variant={dateFilterType === 'current_month' ? 'default' : 'outline'} onClick={() => { setDateFilterType('current_month'); setIsDatePopoverOpen(false); }}>
                        Mes Actual
                      </Button>
                      <Button variant={dateFilterType === 'all' ? 'default' : 'outline'} onClick={() => { setDateFilterType('all'); setIsDatePopoverOpen(false); }}>
                        Todas las fechas
                      </Button>
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                        <div className="space-y-1">
                          <Label className="text-xs">Desde</Label>
                          <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Hasta</Label>
                          <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="h-8 text-xs" />
                        </div>
                        <Button className="col-span-2 h-8 mt-1" onClick={() => { setDateFilterType('custom'); setIsDatePopoverOpen(false); }}>
                          Aplicar rango
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-xs text-muted-foreground uppercase">Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="first_payment">Primer pago</SelectItem>
                    <SelectItem value="renewal">Renovación</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                    <SelectItem value="downgrade">Downgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-xs text-muted-foreground uppercase">Plan Adquirido</Label>
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los planes</SelectItem>
                    {planConfigs.map(p => <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-xs text-muted-foreground uppercase">Ciclo</Label>
                <Select value={filterCycle} onValueChange={setFilterCycle}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historial Global */}
        <Card>
          <CardHeader>
            <CardTitle>Transacciones en Plataforma</CardTitle>
            <p className="text-sm text-muted-foreground">Nota: Para registrar, editar o crear nuevos cobros, ingresa al panel individual del profesor.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Profesor</TableHead>
                    <TableHead>Tipo de transacción</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSubs.length > 0 ? paginatedSubs.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap">{formatDateProject(s.createdAt)}</TableCell>
                      <TableCell className="font-medium text-primary hover:underline cursor-pointer">
                        <Link to={`/admin/profesores/${s.tenantId}`}>{getProfName(s.tenantId)}</Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeClass(s.type)}>
                          {getTypeLabel(s.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {s.planFrom ? `${s.planFrom} → ${s.planTo}` : s.planTo}
                      </TableCell>
                      <TableCell className="capitalize">{s.billingCycle}</TableCell>
                      <TableCell className="capitalize">{s.method}</TableCell>
                      <TableCell className="text-right font-medium text-success">${s.amount}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">No hay transacciones registradas con estos filtros.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 pt-4 border-t mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSubs.length)} de {filteredSubs.length} registros
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
