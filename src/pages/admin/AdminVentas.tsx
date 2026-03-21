import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { profesores, planConfigs } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { PlatformSubscription, platformSubscriptions as initialSubscriptions } from "@/data/mockData";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function AdminVentas() {
  const [subs, setSubs] = useState<PlatformSubscription[]>(initialSubscriptions);
  const [filterPlan, setFilterPlan] = useState("todos");
  const [filterCycle, setFilterCycle] = useState("todos");
  
  type DateFilterType = 'current_month' | 'all' | 'custom';
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('current_month');
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const [newSaleProf, setNewSaleProf] = useState("");
  const [newSalePlan, setNewSalePlan] = useState("");
  const [newSaleCycle, setNewSaleCycle] = useState("mensual");

  const filteredSubs = useMemo(() => {
    return subs.filter(s => {
      const matchPlan = filterPlan === "todos" || s.planKey === filterPlan;
      const matchCycle = filterCycle === "todos" || s.billingCycle === filterCycle;
      
      let matchDate = true;
      const saleDate = parseISO(s.date);
      
      if (dateFilterType === 'current_month') {
        const now = new Date();
        matchDate = saleDate >= startOfMonth(now) && saleDate <= endOfMonth(now);
      } else if (dateFilterType === 'custom' && dateStart && dateEnd) {
        matchDate = saleDate >= parseISO(dateStart) && saleDate <= parseISO(dateEnd);
      }
      
      return matchPlan && matchCycle && matchDate;
    });
  }, [subs, filterPlan, filterCycle, dateFilterType, dateStart, dateEnd]);

  const totalEarnings = filteredSubs.reduce((acc, curr) => acc + curr.amount, 0);

  const chartData = useMemo(() => {
    const dataByDate = filteredSubs.reduce((acc, sub) => {
      acc[sub.date] = (acc[sub.date] || 0) + sub.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(dataByDate).sort().map(date => ({
      date,
      total: dataByDate[date]
    }));
  }, [filteredSubs]);

  const handleRegisterSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSaleProf || !newSalePlan) {
      toast.error("Selecciona profesor y plan");
      return;
    }

    const planData = planConfigs.find(p => p.key === newSalePlan);
    if (!planData) return;

    const amount = newSaleCycle === 'mensual' ? planData.price : planData.priceAnnual;
    
    const newSub: PlatformSubscription = {
      id: `sub-${Date.now()}`,
      profesorId: newSaleProf,
      planKey: newSalePlan,
      billingCycle: newSaleCycle as 'mensual' | 'anual',
      amount,
      method: 'manual',
      date: new Date().toISOString().split('T')[0],
    };

    setSubs([newSub, ...subs]);
    toast.success("Venta registrada correctamente");
    setNewSaleProf("");
    setNewSalePlan("");
  };

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
        <h1 className="text-2xl font-bold">Ventas de Plataforma</h1>

        {/* Top Dashboard: Total Generado */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Ganado (Filtros Aplicados)</p>
              <h2 className="text-4xl lg:text-5xl font-bold mt-2">${totalEarnings.toFixed(2)}</h2>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Dashboard 2: Gráfica y Filtros Abajo */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento en el tiempo</CardTitle>
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

            {/* Filtros */}
            <div className="grid gap-4 sm:grid-cols-3 bg-muted/30 p-4 rounded-lg border">
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
                <Label className="text-xs text-muted-foreground uppercase">Plan</Label>
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los planes</SelectItem>
                    {planConfigs.map(p => <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-xs text-muted-foreground uppercase">Membresía</Label>
                <Select value={filterCycle} onValueChange={setFilterCycle}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrar nueva venta */}
        <Card>
          <CardHeader><CardTitle>Registrar Venta Manual</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleRegisterSale} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="space-y-2 flex-1">
                <Label>Profesor</Label>
                <Select value={newSaleProf} onValueChange={setNewSaleProf}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar profesor..." /></SelectTrigger>
                  <SelectContent>
                    {profesores.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <Label>Plan</Label>
                <Select value={newSalePlan} onValueChange={setNewSalePlan}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar plan..." /></SelectTrigger>
                  <SelectContent>
                    {planConfigs.map(p => <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <Label>Modalidad</Label>
                <Select value={newSaleCycle} onValueChange={setNewSaleCycle}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full sm:w-auto">Registrar Pago</Button>
            </form>
          </CardContent>
        </Card>

        {/* Historial */}
        <Card>
          <CardHeader><CardTitle>Historial de Ventas</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Profesor</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Modalidad</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubs.length > 0 ? filteredSubs.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap">{s.date}</TableCell>
                      <TableCell className="font-medium">{getProfName(s.profesorId)}</TableCell>
                      <TableCell className="capitalize">{s.planKey}</TableCell>
                      <TableCell className="capitalize">{s.billingCycle}</TableCell>
                      <TableCell className="capitalize">{s.method}</TableCell>
                      <TableCell className="text-right font-medium text-success">${s.amount}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No hay ventas registradas con estos filtros.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
