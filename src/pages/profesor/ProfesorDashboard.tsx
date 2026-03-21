import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { getCurrentProfesor, sales, courses } from "@/data/mockData";
import { Users, DollarSign, BookOpen } from "lucide-react";

export default function ProfesorDashboard() {
  const prof = getCurrentProfesor();
  const profSales = sales.filter(s => s.profesorId === prof.id);
  const thisMonth = profSales.filter(s => s.date.startsWith('2025-03'));
  const profCourses = courses.filter(c => c.profesorId === prof.id);
  const totalStudents = new Set(profSales.map(s => s.alumnoId)).size;

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard title="Total alumnos" value={totalStudents} icon={<Users className="h-6 w-6" />} />
          <MetricCard title="Ventas este mes" value={`$${thisMonth.reduce((a, s) => a + s.amount, 0).toFixed(2)}`} icon={<DollarSign className="h-6 w-6" />} />
          <MetricCard title="Cursos publicados" value={profCourses.length} icon={<BookOpen className="h-6 w-6" />} />
        </div>
      </div>
    </ProfesorLayout>
  );
}
