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
  unit: 'per_gb_month' | 'flat_month' | 'per_profesor_month';
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const UNIT_LABELS: Record<string, string> = {
  per_gb_month: 'por GB/mes',
  flat_month: 'mensual fijo (USD)',
  per_profesor_month: 'por profesor/mes (USD)',
};

// Assumptions used for storage estimation
const AVG_GB_PER_LESSON = 1.0;    // 1 GB promedio por clase de video (conservador)
const AVG_GB_PER_EBOOK  = 0.05;   // 50 MB promedio por ebook PDF
const EST_TOTAL_PROFESSORS = 50;  // Número estimado de profesores pagos para amortizar costos fijos

// ─── Suggestion Engine ────────────────────────────────────────────────────────

interface PlanSuggestions {
  estimatedMonthlyCostPerProf: number;
  estimatedStorageGB: number;
  suggestedPrice: number;
  suggestedPriceAnnual: number;
  breakdownLines: string[];
}

function computeSuggestions(plan: PlanConfig, costs: PlatformCost[]): PlanSuggestions {
  // Use effective values (cap -1 to reasonable maximums for estimation)
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
        `• ${cost.name}: $${cost.amount} fijo ÷ ${EST_TOTAL_PROFESSORS} profesores = $${splitCost.toFixed(2)}/mes por profesor`
      );
    } else if (cost.unit === 'per_profesor_month') {
      monthlyCostPerProf += cost.amount;
      breakdownLines.push(
        `• ${cost.name}: $${cost.amount}/mes por profesor`
      );
    }
  });

  // Suggested price: 3× markup, minimum floor per plan
  const floors: Record<string, number> = { gratis: 0, basico: 9, pro: 29, enterprise: 99 };
  const floor = floors[plan.key] ?? 0;
  const suggestedMonthly = plan.key === 'gratis'
    ? 0
    : Math.max(Math.ceil(monthlyCostPerProf * 3), floor);

  // Annual = 10 months (2 months free)
  const suggestedAnnual = Math.ceil(suggestedMonthly * 10);

  return {
    estimatedMonthlyCostPerProf: monthlyCostPerProf,
    estimatedStorageGB: storageGB,
    suggestedPrice: suggestedMonthly,
    suggestedPriceAnnual: suggestedAnnual,
    breakdownLines,
  };
}

// ─── Field suggestion helper ──────────────────────────────────────────────────

function getSuggestionForField(
  fieldKey: string,
  planKey: string,
  suggestions: PlanSuggestions,
  hasCosts: boolean
): string | null {
  if (!hasCosts) return null;

  const tierDefaults: Record<string, Record<string, string>> = {
    gratis: {
      price: `Sugerido: $0 — Plan de captación, el costo de $${suggestions.estimatedMonthlyCostPerProf.toFixed(2)}/mes lo absorbes tú`,
      price_annual: `Sugerido: $0`,
      max_hubs: 'Sugerido: 1 — Limitar para incentivar upgrade',
      max_students: 'Sugerido: 30 — Suficiente para validar, no para escalar',
      max_courses: 'Sugerido: 3 — Muestra valor sin dar toda la plataforma',
      max_lessons_per_course: 'Sugerido: 10 — Mini-cursos de muestra',
      max_ebooks: 'Sugerido: 1 — Un solo ebook de demostración',
    },
    basico: {
      price: `Sugerido: $${suggestions.suggestedPrice} — Cubre tus costos ($${suggestions.estimatedMonthlyCostPerProf.toFixed(2)}) con margen ×3`,
      price_annual: `Sugerido: $${suggestions.suggestedPriceAnnual} — Equivale a 10 meses (2 gratis)`,
      max_hubs: 'Sugerido: 3 — Permite diversificarse sin saturar',
      max_students: 'Sugerido: 100 — Rango cómodo para profesores nuevos',
      max_courses: 'Sugerido: 10 — Suficiente para un catálogo inicial',
      max_lessons_per_course: 'Sugerido: 30 — Cursos completos y bien estructurados',
      max_ebooks: 'Sugerido: 5 — Material de apoyo variado',
    },
    pro: {
      price: `Sugerido: $${suggestions.suggestedPrice} — Margen ×3 sobre costo de $${suggestions.estimatedMonthlyCostPerProf.toFixed(2)}/mes`,
      price_annual: `Sugerido: $${suggestions.suggestedPriceAnnual} — Anual con 2 meses gratis`,
      max_hubs: 'Sugerido: 10 — Multi-academia para creadores establecidos',
      max_students: 'Sugerido: 500 — Audiencia media-grande',
      max_courses: 'Sugerido: 30 — Catálogo amplio y diverso',
      max_lessons_per_course: 'Sugerido: -1 (ilimitado) — Sin restricciones de contenido',
      max_ebooks: 'Sugerido: 20 — Biblioteca de recursos robusta',
    },
    enterprise: {
      price: `Sugerido: $${suggestions.suggestedPrice} — Para grandes operadores, margen alto justificado`,
      price_annual: `Sugerido: $${suggestions.suggestedPriceAnnual} — Anual con descuento por volumen`,
      max_hubs: 'Sugerido: -1 (ilimitado) — Sin restricciones',
      max_students: 'Sugerido: -1 (ilimitado) — Sin restricciones',
      max_courses: 'Sugerido: -1 (ilimitado) — Sin restricciones',
      max_lessons_per_course: 'Sugerido: -1 (ilimitado) — Sin restricciones',
      max_ebooks: 'Sugerido: -1 (ilimitado) — Sin restricciones',
    },
  };

  return tierDefaults[planKey]?.[fieldKey] ?? null;
}

// ─── Empty cost form ──────────────────────────────────────────────────────────

// ─── Profitability Badge ──────────────────────────────────────────────────────

function getProfitabilityBadge(
  plan: PlanConfig,
  planSug: PlanSuggestions,
  hasCosts: boolean,
  fallbackBadge: string
): { label: string; className: string } {
  // No costs yet → fall back to plan key badge
  if (!hasCosts || planSug.estimatedMonthlyCostPerProf === 0) {
    return { label: plan.key, className: fallbackBadge };
  }

  const cost  = planSug.estimatedMonthlyCostPerProf;
  const price = plan.price;

  // Gratis is always an intentional loss — mark it as bait plan
  if (plan.key === 'gratis') {
    return {
      label: '🎣 Plan anzuelo',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    };
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminConfiguracion() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [costs, setCosts] = useState<PlatformCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cost CRUD state
  const [costDialog, setCostDialog] = useState<{ open: boolean; editing: PlatformCost | null }>({ open: false, editing: null });
  const [costForm, setCostForm] = useState<Omit<PlatformCost, 'id'>>(EMPTY_COST);
  // Separate string state for the amount input: prevents falsy-0 from clearing the field while typing decimals (e.g. 0.03)
  const [amountStr, setAmountStr] = useState('');
  const [savingCost, setSavingCost] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [plansRes, costsRes] = await Promise.all([
        supabase.from('plan_configs').select('*').order('price', { ascending: true }),
        supabase.from('platform_costs').select('*').order('created_at', { ascending: true }),
      ]);
      if (plansRes.data) setPlans(plansRes.data);
      if (plansRes.error) toast.error("Error cargando planes: " + plansRes.error.message);
      if (costsRes.data) setCosts(costsRes.data);
      if (costsRes.error) toast.error("Error cargando costos: " + costsRes.error.message);
      setLoading(false);
    }
    load();
  }, []);

  // ── Plan saving ────────────────────────────────────────────────────────────
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
      toast.success("Configuración guardada correctamente");
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Cost CRUD ──────────────────────────────────────────────────────────────
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
    if (!costForm.name.trim()) { toast.error("El nombre del costo es obligatorio"); return; }
    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) { toast.error("Ingresa un monto válido mayor que 0 (ej. 0.03)"); return; }
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
      toast.error("Error: " + err.message);
    } finally {
      setSavingCost(false);
    }
  };

  const handleDeleteCost = async (id: string) => {
    if (!confirm("¿Eliminar este costo? Las sugerencias se recalcularán.")) return;
    setDeletingId(id);
    const { error } = await supabase.from('platform_costs').delete().eq('id', id);
    if (error) { toast.error(error.message); }
    else { setCosts(prev => prev.filter(c => c.id !== id)); toast.success("Costo eliminado"); }
    setDeletingId(null);
  };

  // ── Suggestions ────────────────────────────────────────────────────────────
  const suggestions = useMemo(
    () => Object.fromEntries(plans.map(p => [p.key, computeSuggestions(p, costs)])),
    [plans, costs]
  );
  const hasCosts = costs.length > 0;

  // ── Plan form fields ───────────────────────────────────────────────────────
  const fields: { key: string; label: string }[] = [
    { key: 'price',                label: 'Precio mensual (USD)' },
    { key: 'price_annual',         label: 'Precio anual (USD)' },
    { key: 'max_hubs',             label: 'Máx. Academias (-1 = ilimitado)' },
    { key: 'max_students',         label: 'Máx. Alumnos (-1 = ilimitado)' },
    { key: 'max_courses',          label: 'Máx. Cursos (-1 = ilimitado)' },
    { key: 'max_lessons_per_course', label: 'Máx. Clases por Curso (-1 = ilimitado)' },
    { key: 'max_ebooks',           label: 'Máx. Ebooks (-1 = ilimitado)' },
  ];

  const planColors: Record<string, { badge: string; accent: string }> = {
    gratis:     { badge: 'bg-slate-100 text-slate-700 border-slate-200',   accent: 'border-t-slate-400' },
    basico:     { badge: 'bg-blue-100 text-blue-700 border-blue-200',       accent: 'border-t-blue-500' },
    pro:        { badge: 'bg-violet-100 text-violet-700 border-violet-200', accent: 'border-t-violet-500' },
    enterprise: { badge: 'bg-amber-100 text-amber-700 border-amber-200',    accent: 'border-t-amber-500' },
  };

  // ──────────────────────────────────────────────────────────────────────────

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

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold">Configuración de Planes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define costos operativos y configura los límites y precios de cada plan. Las sugerencias se calculan automáticamente basadas en tus costos reales.
          </p>
        </div>

        {/* ── SECTION 1: Costos Operativos ── */}
        <Card>
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Costos Operativos</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Añade todos tus costos de infraestructura. Se usan para calcular sugerencias de precios y límites en cada plan.
                  </CardDescription>
                </div>
              </div>
              <Button size="sm" onClick={openAddCost}>
                <Plus className="mr-1.5 h-4 w-4" /> Añadir Costo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {costs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                <DollarSign className="h-10 w-10 opacity-30" />
                <p className="font-medium">Sin costos registrados</p>
                <p className="text-xs max-w-xs">
                  Registra tus costos reales (storage, hosting, herramientas) para obtener sugerencias de precios precisas.
                </p>
                <Button size="sm" variant="outline" onClick={openAddCost}>
                  <Plus className="mr-1.5 h-4 w-4" /> Añadir primer costo
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Monto</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unidad</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Notas</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costs.map(cost => (
                      <tr key={cost.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{cost.name}</td>
                        <td className="px-4 py-3 text-right font-mono text-primary font-semibold">
                          ${Number(cost.amount).toFixed(cost.unit === 'per_gb_month' ? 4 : 2)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                            {UNIT_LABELS[cost.unit]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell max-w-[200px] truncate">
                          {cost.notes || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCost(cost)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteCost(cost.id)}
                              disabled={deletingId === cost.id}
                            >
                              {deletingId === cost.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SECTION 2: Configuración de Planes ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Límites y Precios por Plan</h2>
            {hasCosts && (
              <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                ✦ Sugerencias activas
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan, idx) => {
              const planSug = suggestions[plan.key];
              const colors = planColors[plan.key] || { badge: 'bg-gray-100 text-gray-700 border-gray-200', accent: 'border-t-gray-400' };
              return (
                <Card key={plan.key} className={`overflow-hidden border-t-4 ${colors.accent}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="capitalize text-base">{plan.name}</CardTitle>
                      {(() => {
                        const badge = getProfitabilityBadge(plan, planSug, hasCosts, colors.badge);
                        return (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${badge.className}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                    {hasCosts && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Costo est. por prof: <span className="font-semibold text-foreground">${planSug.estimatedMonthlyCostPerProf.toFixed(2)}/mes</span>
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fields.map(f => {
                      const currentVal = plan[f.key as keyof PlanConfig] as number;
                      const hint = getSuggestionForField(f.key, plan.key, planSug, hasCosts);
                      return (
                        <div key={f.key} className="space-y-1.5">
                          <Label className="text-xs font-medium">{f.label}</Label>
                          <Input
                            type="number"
                            value={currentVal}
                            onChange={e => updatePlan(idx, f.key, Number(e.target.value))}
                            min={-1}
                            className="h-8 text-sm"
                          />
                          {currentVal === -1 && (
                            <p className="text-xs text-emerald-600 font-medium">∞ Ilimitado</p>
                          )}
                          {hint && (
                            <p className="text-[11px] text-primary/70 leading-snug flex items-start gap-1">
                              <HelpCircle className="h-3 w-3 mt-0.5 shrink-0 text-primary/50" />
                              <span>{hint}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {plans.length === 0 && (
            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
              <p className="font-medium">No hay planes configurados.</p>
              <p className="text-sm mt-1">
                Ejecuta el script <code>supabase_plan_limits.sql</code> en Supabase para inicializar los planes.
              </p>
            </div>
          )}
        </div>

        {/* ── SECTION 3: Explanation of suggestions ── */}
        {hasCosts && plans.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                ¿Por qué estas sugerencias?
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
                  <li>• <strong>Precio anual sugerido:</strong> Precio mensual × 10 (2 meses gratis de regalo)</li>
                </ul>
              </div>

              <div className="space-y-4">
                <p className="font-medium text-foreground">Desglose por plan:</p>
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
                      <div className="pt-1 border-t text-xs flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          Costo total estimado:{' '}
                          <strong className="text-foreground">${s.estimatedMonthlyCostPerProf.toFixed(2)}/mes por profesor</strong>
                        </span>
                        <span>
                          Precio mensual sugerido:{' '}
                          <strong className="text-primary">${s.suggestedPrice}/mes</strong>
                          {plan.key !== 'gratis' && <span className="text-muted-foreground"> (margen ×3)</span>}
                        </span>
                        <span>
                          Precio anual sugerido:{' '}
                          <strong className="text-primary">${s.suggestedPriceAnnual}/año</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border">
                <strong>Nota:</strong> Estas son <em>sugerencias basadas en costos mínimos</em>. El precio real debe contemplar también tu tiempo, soporte al cliente, costos de marketing y la propuesta de valor diferencial de tu plataforma. Un margen ×3–×5 sobre el costo base es estándar en SaaS B2B.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Save button ── */}
        <Button className="w-full sm:w-auto gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Guardar cambios de planes
        </Button>
      </div>

      {/* ── Cost Dialog (Add / Edit) ── */}
      <Dialog open={costDialog.open} onOpenChange={(o) => !o && setCostDialog({ open: false, editing: null })}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {costDialog.editing ? 'Editar Costo' : 'Añadir Costo Operativo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre del costo</Label>
              <Input
                placeholder="Ej. Bunny.net Storage, Supabase Pro, Dominio..."
                value={costForm.name}
                onChange={e => setCostForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monto</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="ej. 0.03"
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unidad</Label>
                <Select
                  value={costForm.unit}
                  onValueChange={(v) => setCostForm(f => ({ ...f, unit: v as PlatformCost['unit'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_gb_month">Por GB/mes (storage)</SelectItem>
                    <SelectItem value="flat_month">Mensual fijo (USD)</SelectItem>
                    <SelectItem value="per_profesor_month">Por profesor/mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea
                placeholder="Describe para qué es este costo..."
                rows={2}
                className="resize-none"
                value={costForm.notes}
                onChange={e => setCostForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="rounded-lg bg-muted/40 border p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">¿Qué unidad usar?</p>
              <p>• <strong>Por GB/mes:</strong> Para storage (Bunny.net, S3, Supabase Storage)</p>
              <p>• <strong>Mensual fijo:</strong> Para servicios con precio plano (hosting, dominio)</p>
              <p>• <strong>Por profesor/mes:</strong> Para costos que escalan con usuarios (herramientas CRM, soporte)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCostDialog({ open: false, editing: null })}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCost} disabled={savingCost}>
              {savingCost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {costDialog.editing ? 'Guardar cambios' : 'Añadir costo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
