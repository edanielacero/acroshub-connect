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
    { key: 'max_hubs', label: 'Máximo de Academias' },
    { key: 'max_students', label: 'Máximo de alumnos' },
    { key: 'max_courses', label: 'Máximo de cursos' },
    { key: 'max_lessons_per_course', label: 'Máximo de clases por curso' },
    { key: 'max_ebooks', label: 'Máximo de ebooks' },
  ];

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
        <h1 className="text-2xl font-bold">Configuración de Planes</h1>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, idx) => (
            <Card key={plan.key}>
              <CardHeader><CardTitle className="capitalize">{plan.name}</CardTitle></CardHeader>
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
                    {(plan[f.key as keyof PlanConfig] as number) === -1 && <p className="text-xs text-muted-foreground">Ilimitado</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="w-full sm:w-auto gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Guardar cambios
        </Button>
      </div>
    </AdminLayout>
  );
}
