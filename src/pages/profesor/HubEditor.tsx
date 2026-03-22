import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { useProfesorData } from "@/hooks/useProfesorData";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function HubEditor() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { hubs, isLoading } = useProfesorData();
  const hub = hubs.find((h: any) => h.id === id);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (hub) {
      setName(hub.name || '');
      setSlug(hub.slug || '');
      setDescription(hub.description || '');
      setColor(hub.primary_color || '#2563EB');
    }
  }, [hub]);

  const handleSave = async () => {
    if (!name || !slug) return toast.error("Nombre y Slug son obligatorios");
    setIsSaving(true);
    const { error } = await supabase.from('hubs').update({ name, slug, description, primary_color: color }).eq('id', id);
    setIsSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Cambios guardados correctamente");
    queryClient.invalidateQueries({ queryKey: ['hubs'] });
  };

  if (isLoading) {
    return <ProfesorLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></ProfesorLayout>;
  }

  if (!hub) return <ProfesorLayout><p className="p-8 text-center text-muted-foreground">HUB no encontrado</p></ProfesorLayout>;

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/dashboard/hubs"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <h1 className="text-2xl font-bold">Editar HUB</h1>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="personalizacion">Personalización</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre del HUB</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input value={slug} onChange={e => setSlug(e.target.value)} />
                <p className="text-xs text-muted-foreground break-all">acroshub.com/{slug}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
            </div>
          </TabsContent>

          <TabsContent value="personalizacion" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Color primario</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer" />
                  <Input value={color} onChange={e => setColor(e.target.value)} className="flex-1 sm:max-w-32" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
                  Subir logo
                </div>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Label>Imagen de portada</Label>
              <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground sm:p-8">
                Arrastra una imagen o haz clic para seleccionar
              </div>
            </div>
          </TabsContent>

        </Tabs>

        <Button className="w-full sm:w-auto" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </ProfesorLayout>
  );
}
