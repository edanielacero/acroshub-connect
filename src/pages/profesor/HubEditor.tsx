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
import { ArrowLeft, Loader2, UploadCloud, Trash2 } from "lucide-react";
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
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (hub) {
      setName(hub.name || '');
      setSlug(hub.slug || '');
      setDescription(hub.description || '');
      setColor(hub.primary_color || '#2563EB');
      setLogoUrl(hub.logo_url || '');
      setCoverUrl(hub.cover_url || '');
    }
  }, [hub]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Solo se permiten imágenes."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen supera los 5MB"); return; }
    
    setIsUploadingLogo(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `logo_${Date.now()}.${fileExt}`;
    const filePath = `${hub?.profesor_id}/${hub?.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from('hubs').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('hubs').getPublicUrl(filePath);      
      setLogoUrl(data.publicUrl);
      toast.success("Logo subido temporalmente. No olvides guardar cambios.");
    } catch (error: any) {
      toast.error(`Error al subir imagen: ${error.message}`);
    } finally {
      setIsUploadingLogo(false);
      event.target.value = "";
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Solo se permiten imágenes."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("La portada supera los 10MB"); return; }
    
    setIsUploadingCover(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `cover_${Date.now()}.${fileExt}`;
    const filePath = `${hub?.profesor_id}/${hub?.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from('hubs').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('hubs').getPublicUrl(filePath);      
      setCoverUrl(data.publicUrl);
      toast.success("Portada subida temporalmente. No olvides guardar cambios.");
    } catch (error: any) {
      toast.error(`Error al subir imagen: ${error.message}`);
    } finally {
      setIsUploadingCover(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!name || !slug) return toast.error("Nombre y Slug son obligatorios");
    setIsSaving(true);
    const { error } = await supabase.from('hubs').update({ 
      name, slug, description, primary_color: color, logo_url: logoUrl || null, cover_url: coverUrl || null 
    }).eq('id', id);
    setIsSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Cambios guardados correctamente");
    queryClient.invalidateQueries({ queryKey: ['hubs'] });
  };

  if (isLoading) {
    return <ProfesorLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></ProfesorLayout>;
  }

  if (!hub) return <ProfesorLayout><p className="p-8 text-center text-muted-foreground">Academia no encontrada</p></ProfesorLayout>;

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/dashboard/hubs"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <h1 className="text-2xl font-bold">Editar Academia</h1>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="personalizacion">Personalización</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre de la Academia</Label>
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

          <TabsContent value="personalizacion" className="space-y-6">
            <div className="space-y-2">
              <Label>Color primario</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer border p-0.5" />
                <Input value={color} onChange={e => setColor(e.target.value)} className="flex-1 sm:max-w-32 uppercase" />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[200px_1fr]">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="relative rounded-lg border-2 border-dashed p-4 text-center hover:bg-muted/50 transition-colors bg-card w-full aspect-square flex flex-col items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <>
                       <img src={logoUrl} alt="Logo" className="absolute inset-0 w-full h-full object-contain p-2" />
                       <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                         <Button variant="ghost" size="icon" className="text-white hover:text-red-400" onClick={(e) => {e.preventDefault(); setLogoUrl('')}}><Trash2 className="h-5 w-5" /></Button>
                       </div>
                    </>
                  ) : (
                    <>
                      <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                      {isUploadingLogo ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <UploadCloud className="h-6 w-6 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground mt-2 block pointer-events-none">{isUploadingLogo ? 'Subiendo...' : 'Subir logo'}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Imagen de portada</Label>
                <div className="relative rounded-lg border-2 border-dashed p-6 text-center hover:bg-muted/50 transition-colors bg-card h-full min-h-[200px] flex flex-col items-center justify-center overflow-hidden">
                  {coverUrl ? (
                     <>
                       <img src={coverUrl} alt="Portada" className="absolute inset-0 w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                           <Button variant="outline" className="text-white border-white hover:bg-red-500 hover:text-white" onClick={(e) => {e.preventDefault(); setCoverUrl('')}}>Quitar portada</Button>
                       </div>
                     </>
                  ) : (
                    <>
                      <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleCoverUpload} disabled={isUploadingCover} />
                      {isUploadingCover ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <UploadCloud className="h-8 w-8 mb-2 text-muted-foreground" />}
                      <span className="text-sm text-muted-foreground block pointer-events-none">{isUploadingCover ? 'Subiendo portada...' : 'Arrastra una imagen o haz clic para seleccionar'}</span>
                      <span className="text-xs text-muted-foreground block mt-1 pointer-events-none">Formato horizontal recomendado (Máx. 10MB)</span>
                    </>
                  )}
                </div>
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
