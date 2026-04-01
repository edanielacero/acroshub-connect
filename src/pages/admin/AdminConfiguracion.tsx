import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PlanConfig {
  id: string;
  key: string;
  name: string;
  price: number;
  price_annual: number;
  max_hubs: number;
  max_students: number;
  max_courses: number;
  max_lessons_per_course: number;
  max_ebooks: number;
}

export default function AdminConfiguracion() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPlans() {
      const { data, error } = await supabase
        .from('plan_configs')
        .select('*')
        .order('price', { ascending: true });
      if (data) setPlans(data);
      if (error) toast.error("Error cargando planes: " + error.message);
      setLoading(false);
    }
    loadPlans();
  }, []);

  const updatePlan = (idx: number, field: string, value: number) => {
    setPlans(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const plan of plans) {
        const { error } = await supabase.from('plan_configs').update({
          price: plan.price,
          price_annual: plan.price_annual,
          max_hubs: plan.max_hubs,
          max_students: plan.max_students,
          max_courses: plan.max_courses,
          max_lessons_per_course: plan.max_lessons_per_course,
          max_ebooks: plan.max_ebooks,
          updated_at: new Date().toISOString()
        }).eq('id', plan.id);
        if (error) throw error;
      }
      toast.success("Configuración guardada correctamente");
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'price', label: 'Precio mensual (USD)' },
    { key: 'price_annual', label: 'Precio anual (USD)' },
    { key: 'max_hubs', label: 'Máx. Academias (-1 = ilimitado)' },
    { key: 'max_students', label: 'Máx. Alumnos (-1 = ilimitado)' },
    { key: 'max_courses', label: 'Máx. Cursos (-1 = ilimitado)' },
    { key: 'max_lessons_per_course', label: 'Máx. Clases por Curso (-1 = ilimitado)' },
    { key: 'max_ebooks', label: 'Máx. Ebooks (-1 = ilimitado)' },
  ];

  const planColors: Record<string, string> = {
    gratis: 'bg-slate-100 text-slate-700 border-slate-200',
    basico: 'bg-blue-100 text-blue-700 border-blue-200',
    pro: 'bg-violet-100 text-violet-700 border-violet-200',
    enterprise: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Configuración de Planes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Los cambios aquí afectan en tiempo real los límites de todos los profesores. Usa <strong>-1</strong> para ilimitado.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, idx) => (
            <Card key={plan.key} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">{plan.name}</CardTitle>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${planColors[plan.key] || 'bg-gray-100 text-gray-700'}`}>
                    {plan.key}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {fields.map(f => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs">{f.label}</Label>
                    <Input
                      type="number"
                      value={plan[f.key as keyof PlanConfig] as number}
                      onChange={e => updatePlan(idx, f.key, Number(e.target.value))}
                      min={-1}
                    />
                    {(plan[f.key as keyof PlanConfig] as number) === -1 && (
                      <p className="text-xs text-muted-foreground">✓ Ilimitado</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {plans.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            <p className="font-medium">No hay planes configurados.</p>
            <p className="text-sm mt-1">
              Ejecuta el script <code>supabase_plan_limits.sql</code> en Supabase para inicializar los planes con valores por defecto.
            </p>
          </div>
        )}

        <Button className="w-full sm:w-auto gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Guardar cambios
        </Button>
      </div>
    </AdminLayout>
  );
}
