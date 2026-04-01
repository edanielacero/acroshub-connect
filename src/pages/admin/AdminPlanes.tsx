import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, TrendingUp, Info, HelpCircle, DollarSign, Server } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface PlatformCost {
  id: string;
  name: string;
  amount: number;
  unit: 'per_gb_month' | 'flat_month' | 'flat_year';
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const UNIT_LABELS: Record<string, string> = {
  per_gb_month: 'por GB/mes',
  flat_month: 'Mensual fijo',
  flat_year: 'Anual fijo',
};

const AVG_GB_PER_LESSON = 1.0;
const AVG_GB_PER_EBOOK  = 0.05;
const EST_TOTAL_PROFESSORS = 50;

// ─── Suggestion Engine ────────────────────────────────────────────────────────

interface PlanSuggestions {
  estimatedMonthlyCostPerProf: number;
  estimatedStorageGB: number;
  suggestedPrice: number;
  suggestedPriceAnnual: number;
  breakdownLines: string[];
}

function computeSuggestions(plan: PlanConfig, costs: PlatformCost[]): PlanSuggestions {
  const effectiveCourses  = plan.max_courses === -1            ? 60 : plan.max_courses;
  const effectiveLessons  = plan.max_lessons_per_course === -1 ? 60 : plan.max_lessons_per_course;
  const effectiveEbooks   = plan.max_ebooks === -1             ? 40 : plan.max_ebooks;

  const totalLessons   = effectiveCourses * effectiveLessons;
  const storageGB      = (totalLessons * AVG_GB_PER_LESSON) + (effectiveEbooks * AVG_GB_PER_EBOOK);
  const breakdownLines: string[] = [];

  let monthlyCostPerProf = 0;

  costs.forEach(cost => {
    if (cost.unit === 'per_gb_month') {
      const storageCost = storageGB * cost.amount;
      monthlyCostPerProf += storageCost;
      breakdownLines.push(
        `• ${cost.name}: ${storageGB.toFixed(1)} GB × $${cost.amount}/GB = $${storageCost.toFixed(2)}/mes por profesor`
      );
    } else if (cost.unit === 'flat_month') {
      const splitCost = cost.amount / EST_TOTAL_PROFESSORS;
      monthlyCostPerProf += splitCost;
      breakdownLines.push(
        `• ${cost.name}: $${cost.amount.toFixed(2)}/mes ÷ ${EST_TOTAL_PROFESSORS} profs = $${splitCost.toFixed(2)}/mes`
      );
    } else if (cost.unit === 'flat_year') {
      const splitCost = (cost.amount / 12) / EST_TOTAL_PROFESSORS;
      monthlyCostPerProf += splitCost;
      const monthlyAmount = cost.amount / 12;
      breakdownLines.push(
        `• ${cost.name}: $${cost.amount.toFixed(2)}/año ($${monthlyAmount.toFixed(2)}/mes) ÷ ${EST_TOTAL_PROFESSORS} profs = $${splitCost.toFixed(2)}/mes`
      );
    }
  });

  const floors: Record<string, number> = { gratis: 0, basico: 9, pro: 29, enterprise: 99 };
  const floor = floors[plan.key] ?? 0;
  const suggestedMonthly = plan.key === 'gratis' ? 0 : Math.max(Math.ceil(monthlyCostPerProf * 3), floor);
  const suggestedAnnual = Math.ceil(suggestedMonthly * 10);

  return {
    estimatedMonthlyCostPerProf: monthlyCostPerProf,
    estimatedStorageGB: storageGB,
    suggestedPrice: suggestedMonthly,
    suggestedPriceAnnual: suggestedAnnual,
    breakdownLines,
  };
}

function getSuggestionForField(
  fieldKey: string,
  planKey: string,
  suggestions: PlanSuggestions,
  hasCosts: boolean
): string | null {
  if (!hasCosts) return null;

  const tierDefaults: Record<string, Record<string, string>> = {
    gratis: {
      price: 'Sug: $0',
      price_annual: 'Sug: $0',
      max_hubs: 'Sug: 1',
      max_students: 'Sug: 30',
      max_courses: 'Sug: 3',
      max_lessons_per_course: 'Sug: 10',
      max_ebooks: 'Sug: 1',
    },
    basico: {
      price: `Sug: $${suggestions.suggestedPrice}`,
      price_annual: `Sug: $${suggestions.suggestedPriceAnnual}`,
      max_hubs: 'Sug: 3',
      max_students: 'Sug: 100',
      max_courses: 'Sug: 10',
      max_lessons_per_course: 'Sug: 30',
      max_ebooks: 'Sug: 5',
    },
    pro: {
      price: `Sug: $${suggestions.suggestedPrice}`,
      price_annual: `Sug: $${suggestions.suggestedPriceAnnual}`,
      max_hubs: 'Sug: 10',
      max_students: 'Sug: 500',
      max_courses: 'Sug: 30',
      max_lessons_per_course: 'Ilimitado',
      max_ebooks: 'Sug: 20',
    },
    enterprise: {
      price: `Sug: $${suggestions.suggestedPrice}`,
      price_annual: `Sug: $${suggestions.suggestedPriceAnnual}`,
      max_hubs: 'Ilimitado',
      max_students: 'Ilimitado',
      max_courses: 'Ilimitado',
      max_lessons_per_course: 'Ilimitado',
      max_ebooks: 'Ilimitado',
    },
  };

  return tierDefaults[planKey]?.[fieldKey] ?? null;
}

function getProfitabilityBadge(
  plan: PlanConfig,
  planSug: PlanSuggestions,
  hasCosts: boolean,
  fallbackBadge: string
): { label: string; className: string } {
  if (!hasCosts || planSug.estimatedMonthlyCostPerProf === 0) {
    return { label: plan.key, className: fallbackBadge };
  }

  const cost  = planSug.estimatedMonthlyCostPerProf;
  const price = plan.price;

  if (plan.key === 'gratis') {
    return { label: '🎣 Plan anzuelo', className: 'bg-slate-100 text-slate-600 border-slate-200' };
  }

  if (price === 0) {
    return { label: '✗ Sin ingresos', className: 'bg-red-100 text-red-700 border-red-200' };
  }

  const mult = price / cost;
  const multStr = `×${mult.toFixed(1)}`;

  if (mult >= 5)  return { label: `✨ Excelente (${multStr})`,     className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (mult >= 3)  return { label: `✓ Muy rentable (${multStr})`, className: 'bg-green-100 text-green-700 border-green-200' };
  if (mult >= 1.5) return { label: `✓ Rentable (${multStr})`,    className: 'bg-teal-100 text-teal-700 border-teal-200' };
  if (mult >= 1)  return { label: `≈ Equilibrio (${multStr})`,   className: 'bg-amber-100 text-amber-700 border-amber-200' };
  return              { label: `✗ No rentable (${multStr})`,  className: 'bg-red-100 text-red-700 border-red-200' };
}

const EMPTY_COST: Omit<PlatformCost, 'id'> = {
  name: '',
  amount: 0,
  unit: 'per_gb_month',
  notes: '',
};

export default function AdminPlanes() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [costs, setCosts] = useState<PlatformCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [costDialog, setCostDialog] = useState<{ open: boolean; editing: PlatformCost | null }>({ open: false, editing: null });
  const [costForm, setCostForm] = useState<Omit<PlatformCost, 'id'>>(EMPTY_COST);
  const [amountStr, setAmountStr] = useState('');
  const [savingCost, setSavingCost] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [plansRes, costsRes] = await Promise.all([
        supabase.from('plan_configs').select('*').order('price', { ascending: true }),
        supabase.from('platform_costs').select('*').order('created_at', { ascending: true }),
      ]);
      if (plansRes.data) setPlans(plansRes.data);
      if (costsRes.data) setCosts(costsRes.data);
      setLoading(false);
    }
    load();
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
          updated_at: new Date().toISOString(),
        }).eq('id', plan.id);
        if (error) throw error;
      }
      toast.success("Configuración de planes guardada");
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openAddCost = () => {
    setCostForm(EMPTY_COST);
    setAmountStr('');
    setCostDialog({ open: true, editing: null });
  };

  const openEditCost = (cost: PlatformCost) => {
    setCostForm({ name: cost.name, amount: cost.amount, unit: cost.unit, notes: cost.notes });
    setAmountStr(String(cost.amount));
    setCostDialog({ open: true, editing: cost });
  };

  const handleSaveCost = async () => {
    const parsedAmount = parseFloat(amountStr);
    if (!costForm.name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Datos de costo inválidos");
      return;
    }
    const finalForm = { ...costForm, amount: parsedAmount };
    setSavingCost(true);
    try {
      if (costDialog.editing) {
        const { data, error } = await supabase.from('platform_costs').update({
          ...finalForm, updated_at: new Date().toISOString(),
        }).eq('id', costDialog.editing.id).select().single();
        if (error) throw error;
        setCosts(prev => prev.map(c => c.id === costDialog.editing!.id ? data : c));
        toast.success("Costo actualizado");
      } else {
        const { data, error } = await supabase.from('platform_costs').insert(finalForm).select().single();
        if (error) throw error;
        setCosts(prev => [...prev, data]);
        toast.success("Costo añadido");
      }
      setCostDialog({ open: false, editing: null });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCost(false);
    }
  };

  const handleDeleteCost = async (id: string) => {
    if (!confirm("¿Eliminar este costo?")) return;
    setDeletingId(id);
    const { error } = await supabase.from('platform_costs').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { setCosts(prev => prev.filter(c => c.id !== id)); toast.success("Costo eliminado"); }
    setDeletingId(null);
  };

  const suggestions = useMemo(
    () => Object.fromEntries(plans.map(p => [p.key, computeSuggestions(p, costs)])),
    [plans, costs]
  );
  const hasCosts = costs.length > 0;

  const fields = [
    { key: 'price', label: 'Precio mensual (USD)' },
    { key: 'price_annual', label: 'Precio anual (USD)' },
    { key: 'max_hubs', label: 'Máx. Academias (-1 = ∞)' },
    { key: 'max_students', label: 'Máx. Alumnos (-1 = ∞)' },
    { key: 'max_courses', label: 'Máx. Cursos (-1 = ∞)' },
    { key: 'max_lessons_per_course', label: 'Máx. Clases/Curso (-1 = ∞)' },
    { key: 'max_ebooks', label: 'Máx. Ebooks (-1 = ∞)' },
  ];

  const planColors: Record<string, { badge: string; accent: string }> = {
    gratis: { badge: 'bg-slate-100 text-slate-700 border-slate-200', accent: 'border-t-slate-400' },
    basico: { badge: 'bg-blue-100 text-blue-700 border-blue-200', accent: 'border-t-blue-500' },
    pro: { badge: 'bg-violet-100 text-violet-700 border-violet-200', accent: 'border-t-violet-500' },
    enterprise: { badge: 'bg-amber-100 text-amber-700 border-amber-200', accent: 'border-t-amber-500' },
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in pb-10">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Planes</h1>
          <p className="text-sm text-muted-foreground mt-1">Configura límites, precios y analiza costos operativos.</p>
        </div>

        <Card>
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Costos Operativos</CardTitle>
              </div>
              <Button size="sm" onClick={openAddCost}><Plus className="mr-1.5 h-4 w-4" /> Añadir Costo</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {costs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground italic">Sin costos registrados</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left px-4 py-3 font-medium">Nombre</th>
                      <th className="text-right px-4 py-3 font-medium">Monto</th>
                      <th className="text-left px-4 py-3 font-medium">Unidad</th>
                      <th className="text-right px-4 py-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costs.map(cost => (
                      <tr key={cost.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{cost.name}</td>
                        <td className="px-4 py-3 text-right font-mono text-primary font-semibold">${Number(cost.amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs opacity-70">{UNIT_LABELS[cost.unit]}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCost(cost)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCost(cost.id)} disabled={deletingId === cost.id}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, idx) => {
            const planSug = suggestions[plan.key];
            const colors = planColors[plan.key] || { badge: 'bg-gray-100', accent: 'border-t-gray-400' };
            const badge = getProfitabilityBadge(plan, planSug, hasCosts, colors.badge);
            return (
              <Card key={plan.key} className={`overflow-hidden border-t-4 ${colors.accent}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="capitalize text-base">{plan.name}</CardTitle>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.className}`}>{badge.label}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map(f => {
                    const hintResource = getSuggestionForField(f.key, plan.key, planSug, hasCosts);
                    return (
                      <div key={f.key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] uppercase font-bold opacity-60 tracking-tight">{f.label}</Label>
                          {hintResource && (
                            <span className="text-[10px] font-medium text-primary/70">{hintResource}</span>
                          )}
                        </div>
                        <Input type="number" value={plan[f.key as keyof PlanConfig] as number} onChange={e => updatePlan(idx, f.key, Number(e.target.value))} className="h-8 text-sm" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── SECTION 3: Explanation of suggestions ── */}
        {hasCosts && plans.length > 0 && (
          <Card className="border-primary/20 bg-primary/5 mt-8">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Desglose de Rentabilidad y Sugerencias
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-5 text-sm">
              <div className="space-y-2">
                <p className="font-medium text-foreground">Supuestos de estimación usados:</p>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>• <strong>Tamaño de clase de video:</strong> ~{AVG_GB_PER_LESSON} GB promedio por clase (conservador para HD)</li>
                  <li>• <strong>Tamaño de ebook PDF:</strong> ~{AVG_GB_PER_EBOOK * 1000} MB promedio por ebook</li>
                  <li>• <strong>Profesores para amortizar costos fijos:</strong> {EST_TOTAL_PROFESSORS} profesores pagos estimados</li>
                  <li>• <strong>Margen de precio sugerido:</strong> ×3 sobre el costo real por profesor</li>
                </ul>
              </div>

              <div className="space-y-4">
                <p className="font-medium text-foreground">Desglose exacto por plan:</p>
                {plans.map(plan => {
                  const s = suggestions[plan.key];
                  if (s.breakdownLines.length === 0) return null;
                  const colors = planColors[plan.key] || { badge: 'bg-gray-100 text-gray-700 border-gray-200', accent: '' };
                  return (
                    <div key={plan.key} className="rounded-lg border bg-card p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                          {plan.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ~{s.estimatedStorageGB.toFixed(1)} GB de storage estimado por profesor
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {s.breakdownLines.map((line, i) => (
                          <li key={i} className="text-xs text-muted-foreground font-mono">{line}</li>
                        ))}
                      </ul>
                      <div className="pt-1 border-t text-xs flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <span>
                          Costo total de operación:{' '}
                          <strong className="text-foreground">${s.estimatedMonthlyCostPerProf.toFixed(2)}/mes por profesor</strong>
                        </span>
                        <span>
                          Precio sugerido a cobrar:{' '}
                          <strong className="text-primary">${s.suggestedPrice}/mes</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Button className="w-full sm:w-auto mt-6" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar configuración de planes</Button>
      </div>

      <Dialog open={costDialog.open} onOpenChange={(o) => !o && setCostDialog({ open: false, editing: null })}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>{costDialog.editing ? 'Editar Costo' : 'Añadir Costo'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Nombre</Label><Input value={costForm.name} onChange={e => setCostForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Monto</Label><Input type="text" value={amountStr} onChange={e => setAmountStr(e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Unidad</Label>
                <Select value={costForm.unit} onValueChange={(v) => setCostForm(f => ({ ...f, unit: v as PlatformCost['unit'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_gb_month">Por GB/mes</SelectItem>
                    <SelectItem value="flat_month">Mensual fijo</SelectItem>
                    <SelectItem value="flat_year">Anual fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCostDialog({ open: false, editing: null })}>Cancelar</Button>
            <Button onClick={handleSaveCost} disabled={savingCost}>{savingCost && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{costDialog.editing ? 'Guardar' : 'Añadir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
