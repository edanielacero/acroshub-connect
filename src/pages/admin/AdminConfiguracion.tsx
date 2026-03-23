import { AdminLayout } from "@/components/layout/AdminLayout";
import { planConfigs } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminConfiguracion() {
  const [plans, setPlans] = useState(planConfigs);

  const updatePlan = (idx: number, field: string, value: number) => {
    setPlans(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const fields = [
    { key: 'price', label: 'Precio mensual (USD)' },
    { key: 'priceAnnual', label: 'Precio anual (USD)' },
    { key: 'maxHubs', label: 'Máximo de Academias' },
    { key: 'maxStudents', label: 'Máximo de alumnos' },
    { key: 'maxCourses', label: 'Máximo de cursos' },
    { key: 'maxLessonsPerCourse', label: 'Máximo de clases por curso' },
    { key: 'maxEbooks', label: 'Máximo de ebooks' },
  ];

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
                      value={plan[f.key as keyof typeof plan]}
                      onChange={e => updatePlan(idx, f.key, Number(e.target.value))}
                      min={-1}
                    />
                    {plan[f.key as keyof typeof plan] === -1 && <p className="text-xs text-muted-foreground">Ilimitado</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="w-full sm:w-auto" onClick={() => toast.success("Configuración guardada correctamente")}>Guardar cambios</Button>
      </div>
    </AdminLayout>
  );
}
