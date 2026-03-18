import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { getCurrentProfesor, sales } from "@/data/mockData";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ProfesorVentas() {
  const prof = getCurrentProfesor();
  const profSales = sales.filter(s => s.profesorId === prof.id);
  const totalAmount = profSales.reduce((a, s) => a + s.amount, 0);
  const thisMonthSales = profSales.filter(s => s.date.startsWith('2025-03'));
  const thisMonthAmount = thisMonthSales.reduce((a, s) => a + s.amount, 0);
  const newStudents = new Set(thisMonthSales.map(s => s.alumnoId)).size;

  const chartData = [
    { month: 'Oct', ventas: 0 },
    { month: 'Nov', ventas: 0 },
    { month: 'Dic', ventas: 0 },
    { month: 'Ene', ventas: 149.97 },
    { month: 'Feb', ventas: 249.96 },
    { month: 'Mar', ventas: thisMonthAmount },
  ];

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Reportes de Ventas</h1>

        <div className="grid sm:grid-cols-3 gap-4">
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
                <Line type="monotone" dataKey="ventas" stroke="hsl(217, 91%, 53%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Transacciones recientes</CardTitle></CardHeader>
          <CardContent>
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
                {profSales.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.date}</TableCell>
                    <TableCell>{s.alumnoName}</TableCell>
                    <TableCell>{s.courseTitle}</TableCell>
                    <TableCell className="font-medium">${s.amount}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{s.method}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ProfesorLayout>
  );
}
