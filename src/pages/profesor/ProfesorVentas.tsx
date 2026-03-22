import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { useProfesorData } from "@/hooks/useProfesorData";
import { DollarSign, TrendingUp, Users, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ProfesorVentas() {
  const { enrollments: profSales, courses, ebooks, isLoading } = useProfesorData();

  const mappedSales = profSales.map(s => {
    const isCourse = s.product_type === 'course';
    const product = isCourse ? courses.find(c => c.id === s.product_id) : ebooks.find(e => e.id === s.product_id);
    return {
      id: s.id,
      date: new Date(s.created_at).toISOString().split('T')[0],
      amount: 0, // En Fase 1 el Enrollment no guarda el monto directo aún
      alumnoId: s.alumno_id,
      alumnoName: s.profiles?.full_name || 'Desconocido',
      courseTitle: product?.title || 'Producto',
      method: s.access_type === 'lifetime' ? 'Pago único' : 'Suscripción'
    };
  });

  const totalAmount = mappedSales.reduce((a, s) => a + s.amount, 0);
  const today = new Date();
  const thisMonthString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthSales = mappedSales.filter(s => s.date.startsWith(thisMonthString));
  const thisMonthAmount = thisMonthSales.reduce((a, s) => a + s.amount, 0);
  const newStudents = new Set(thisMonthSales.map(s => s.alumnoId)).size;

  const chartData = [
    { month: 'Oct', ventas: 0 },
    { month: 'Nov', ventas: 0 },
    { month: 'Dic', ventas: 0 },
    { month: 'Ene', ventas: 0 },
    { month: 'Feb', ventas: 0 },
    { month: 'Mar', ventas: thisMonthAmount },
  ];

  if (isLoading) {
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
        <h1 className="text-2xl font-bold">Reportes de Ventas</h1>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard title="Ventas totales" value={`$${totalAmount.toFixed(2)}`} icon={<DollarSign className="h-6 w-6" />} />
          <MetricCard title="Ventas este mes" value={`$${thisMonthAmount.toFixed(2)}`} icon={<TrendingUp className="h-6 w-6" />} />
          <MetricCard title="Alumnos nuevos" value={newStudents} icon={<Users className="h-6 w-6" />} />
        </div>

        <Card>
          <CardHeader><CardTitle>Ventas por mes</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="ventas" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Transacciones recientes</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedSales.length > 0 ? mappedSales.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap">{s.date}</TableCell>
                      <TableCell className="whitespace-nowrap">{s.alumnoName}</TableCell>
                      <TableCell>{s.courseTitle}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">${s.amount}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{s.method}</Badge></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground p-8">
                        Aún no tienes ventas registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProfesorLayout>
  );
}
