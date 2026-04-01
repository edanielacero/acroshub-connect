import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Settings } from "lucide-react";

export default function AdminConfiguracion() {
  const [manualPlanLink, setManualPlanLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'manual_plan_link')
        .maybeSingle();
      
      if (data) setManualPlanLink(data.value || '');
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('platform_settings').upsert({
        key: 'manual_plan_link',
        value: manualPlanLink
      });
      if (error) throw error;
      toast.success("Configuración global guardada correctamente");
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
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
      <div className="space-y-6 animate-fade-in pb-10">
        <div>
          <h1 className="text-2xl font-bold">Configuración Global</h1>
          <p className="text-sm text-muted-foreground mt-1">Ajustes generales de la plataforma Acroshub.</p>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3 border-b border-primary/10">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Ajustes de Plataforma</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Configura los enlaces operativos para todos los profesores.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2 max-w-xl">
              <Label className="font-semibold text-sm">Link de Compra Manual para Planes (Superadmin)</Label>
              <Input 
                value={manualPlanLink} 
                onChange={(e) => setManualPlanLink(e.target.value)} 
                placeholder="https://buy.stripe.com/..." 
                className="bg-white"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Este link aparecerá como botón de <strong>"Mejorar Plan"</strong> en el dashboard del profesor cuando detecte que su uso (Academias, Cursos, Alumnos, etc.) está cerca del límite.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full sm:w-auto" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios globales
        </Button>
      </div>
    </AdminLayout>
  );
}
