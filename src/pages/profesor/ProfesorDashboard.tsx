import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { getCurrentProfesor, sales, courses } from "@/data/mockData";
import { Users, DollarSign, BookOpen, Crown, Calendar, AlertCircle, AlertTriangle } from "lucide-react";
import { parseISO, differenceInDays } from "date-fns";
import { formatDateProject } from "@/lib/utils";

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
      </div>
    </ProfesorLayout>
  );
}
