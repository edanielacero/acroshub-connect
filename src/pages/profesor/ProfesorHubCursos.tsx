import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { useProfesorData, isAtLimit, limitLabel } from "@/hooks/useProfesorData";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen, GripVertical, Plus, Loader2, UploadCloud, Trash2, Settings, Pencil, Lock } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function ProfesorHubCursos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hubs, courses, pricingOptions = [], planConfig, isLoading } = useProfesorData();
  
  const hub = hubs.find((h: any) => h.id === id);
  const hubCourses = courses.filter((c: any) => c.hub_id === id);

  // Check course limit (global across all hubs for this professor)
  const coursesAtLimit = isAtLimit(courses.length, planConfig?.max_courses ?? -1);

  // Helper: get pricing for a given course
  const getPricing = (courseId: string) => pricingOptions.filter((p: any) => p.product_id === courseId);
  const getPriceLabel = (courseId: string) => {
    const prices = getPricing(courseId);
    if (prices.length === 0) return 'Sin precio';
    return prices.map((p: any) => {
      const label = p.type === 'one-time' ? 'Único' : p.type === 'monthly' ? 'Mensual' : 'Anual';
      return `$${Number(p.price).toFixed(2)} ${label}`;
    }).join(' · ');
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
  const [newThumbnailPreview, setNewThumbnailPreview] = useState("");
  const [hasLifetime, setHasLifetime] = useState(true);
  const [lifetimePrice, setLifetimePrice] = useState("");
  const [hasMonthly, setHasMonthly] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [hasAnnual, setHasAnnual] = useState(false);
  const [annualPrice, setAnnualPrice] = useState("");

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) { toast.error("El nombre del curso es requerido"); return; }
    if (!hasLifetime && !hasMonthly && !hasAnnual) { toast.error("Debes seleccionar al menos un modo de suscripción"); return; }
    if (coursesAtLimit) {
      toast.error(`Has alcanzado el límite de cursos de tu plan (${planConfig?.max_courses}). Actualiza tu plan para crear más.`);
      return;
    }
    
    setIsCreating(true);

    const { data: newCourse, error } = await supabase.from('courses').insert({
      hub_id: id,
      profesor_id: user?.id,
      title: newCourseName,
      description: newCourseDesc,
      is_published: false
    }).select().single();

    if (error) {
      toast.error(error.message);
      setIsCreating(false);
      return;
    }

    if (newThumbnailFile) {
      const fileExt = newThumbnailFile.name.split('.').pop();
      const fileName = `thumb_${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${newCourse.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('courses').upload(filePath, newThumbnailFile);
      
      if (!uploadError) {
        const { data } = supabase.storage.from('courses').getPublicUrl(filePath);
        await supabase.from('courses').update({ thumbnail_url: data.publicUrl }).eq('id', newCourse.id);
      } else {
        toast.error("El curso se creó pero hubo un error subiendo la portada.");
      }
    }

    const pricingOptions = [];
    if (hasLifetime) pricingOptions.push({ product_id: newCourse.id, product_type: 'course', type: 'one-time', price: Number(lifetimePrice)||0, currency: 'USD' });
    if (hasMonthly) pricingOptions.push({ product_id: newCourse.id, product_type: 'course', type: 'monthly', price: Number(monthlyPrice)||0, currency: 'USD' });
    if (hasAnnual) pricingOptions.push({ product_id: newCourse.id, product_type: 'course', type: 'annual', price: Number(annualPrice)||0, currency: 'USD' });

    if (pricingOptions.length > 0) await supabase.from('pricing_options').insert(pricingOptions);

    toast.success(`Curso "${newCourseName}" creado exitosamente`);
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    setIsDialogOpen(false);
    
    setNewCourseName("");
    setNewCourseDesc("");
    setNewThumbnailFile(null);
    if (newThumbnailPreview) URL.revokeObjectURL(newThumbnailPreview);
    setNewThumbnailPreview("");
    setHasLifetime(true);
    setLifetimePrice("");
    setHasMonthly(false);
    setMonthlyPrice("");
    setHasAnnual(false);
    setAnnualPrice("");
    setIsCreating(false);
    setCreateActiveTab("global");
    navigate(`/dashboard/cursos/${newCourse.id}`); 
  };

  const [createActiveTab, setCreateActiveTab] = useState("global");
  const [editActiveTab, setEditActiveTab] = useState("global");

  // --- EDIT COURSE MODAL STATES ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editCourseName, setEditCourseName] = useState("");
  const [editCourseDesc, setEditCourseDesc] = useState("");
  const [editHasLifetime, setEditHasLifetime] = useState(true);
  const [editLifetimePrice, setEditLifetimePrice] = useState("");
  const [editHasMonthly, setEditHasMonthly] = useState(false);
  const [editMonthlyPrice, setEditMonthlyPrice] = useState("");
  const [editHasAnnual, setEditHasAnnual] = useState(false);
  const [editAnnualPrice, setEditAnnualPrice] = useState("");
  const [editThumbnailUrl, setEditThumbnailUrl] = useState("");
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);

  useEffect(() => {
    if (editingCourse) {
      setEditCourseName(editingCourse.title);
      setEditCourseDesc(editingCourse.description || "");
      setEditThumbnailUrl(editingCourse.thumbnail_url || "");
      const prices = getPricing(editingCourse.id);
      const oneTime = prices.find((p: any) => p.type === 'one-time');
      const monthly = prices.find((p: any) => p.type === 'monthly');
      const annual = prices.find((p: any) => p.type === 'annual');
      setEditHasLifetime(!!oneTime);
      setEditLifetimePrice(oneTime ? String(oneTime.price) : "");
      setEditHasMonthly(!!monthly);
      setEditMonthlyPrice(monthly ? String(monthly.price) : "");
      setEditHasAnnual(!!annual);
      setEditAnnualPrice(annual ? String(annual.price) : "");
      setEditActiveTab("global");
    }
  }, [editingCourse]);

  const checkUnsavedEditChanges = () => {
    if (!editingCourse) return false;
    const globalChanged = editCourseName !== editingCourse.title ||
                          editCourseDesc !== (editingCourse.description || "") ||
                          editThumbnailUrl !== (editingCourse.thumbnail_url || "");
    
    const originalPrices = getPricing(editingCourse.id);
    const origOneTime = originalPrices.find((p: any) => p.type === 'one-time');
    const origMonthly = originalPrices.find((p: any) => p.type === 'monthly');
    const origAnnual = originalPrices.find((p: any) => p.type === 'annual');

    const pricesChanged = 
      editHasLifetime !== !!origOneTime ||
      (editHasLifetime && editLifetimePrice !== (origOneTime?.price?.toString() || "")) ||
      editHasMonthly !== !!origMonthly ||
      (editHasMonthly && editMonthlyPrice !== (origMonthly?.price?.toString() || "")) ||
      editHasAnnual !== !!origAnnual ||
      (editHasAnnual && editAnnualPrice !== (origAnnual?.price?.toString() || ""));

    return globalChanged || pricesChanged;
  };

  const handleEditTabChange = (value: string) => {
    if (checkUnsavedEditChanges()) {
      toast.error("Guarda los cambios antes de cambiar de pestaña");
    } else {
      setEditActiveTab(value);
    }
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen supera el límite de 5MB");
      return;
    }

    setIsUploadingThumb(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `thumb_${Date.now()}.${fileExt}`;
    const filePath = `${hub?.profesor_id}/${editingCourse?.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from('courses').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('courses').getPublicUrl(filePath);
      setEditThumbnailUrl(data.publicUrl);
      toast.success("Miniatura subida correctamente.");
    } catch (error: any) {
      toast.error(`Error al subir imagen: ${error.message}`);
    } finally {
      setIsUploadingThumb(false);
      event.target.value = "";
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const handleEditCourse = async () => {
    if (!editCourseName.trim()) { toast.error("El nombre del curso es requerido"); return; }
    if (!editHasLifetime && !editHasMonthly && !editHasAnnual) { toast.error("Debes seleccionar al menos un modo de suscripción"); return; }
    
    setIsEditing(true);

    // 1. Update course title/description/thumbnail
    const { error } = await supabase.from('courses').update({
      title: editCourseName,
      description: editCourseDesc,
      thumbnail_url: editThumbnailUrl || null
    }).eq('id', editingCourse.id);

    if (error) { toast.error(error.message); setIsEditing(false); return; }

    // 2. Replace all pricing options: delete existing, then insert new ones
    await supabase.from('pricing_options').delete().eq('product_id', editingCourse.id);

    const newPricing: any[] = [];
    if (editHasLifetime) newPricing.push({ product_id: editingCourse.id, product_type: 'course', type: 'one-time', price: Number(editLifetimePrice) || 0, currency: 'USD' });
    if (editHasMonthly) newPricing.push({ product_id: editingCourse.id, product_type: 'course', type: 'monthly', price: Number(editMonthlyPrice) || 0, currency: 'USD' });
    if (editHasAnnual) newPricing.push({ product_id: editingCourse.id, product_type: 'course', type: 'annual', price: Number(editAnnualPrice) || 0, currency: 'USD' });

    if (newPricing.length > 0) {
      const { error: pErr } = await supabase.from('pricing_options').insert(newPricing);
      if (pErr) { toast.error(pErr.message); setIsEditing(false); return; }
    }

    setIsEditing(false);
    toast.success(`Curso "${editCourseName}" actualizado correctamente`);
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    queryClient.invalidateQueries({ queryKey: ['pricing_options'] });
    setEditingCourse(null);
  };


  if (isLoading) return <ProfesorLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></ProfesorLayout>;
  if (!hub) return <ProfesorLayout><p className="p-8 text-center text-muted-foreground">Academia no encontrada</p></ProfesorLayout>;

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/hubs')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cursos en {hub.name}</h1>
            <p className="text-sm text-muted-foreground">Gestiona y organiza el contenido educativo de esta Academia.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
          <h3 className="font-semibold text-lg items-center flex gap-2"><BookOpen className="h-5 w-5 text-primary" /> Inventario de Cursos</h3>
          <div className="flex items-center gap-3">
            {planConfig && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                coursesAtLimit ? 'bg-red-50 text-red-600 border-red-200' : 'bg-muted text-muted-foreground border-border'
              }`}>
                Cursos: {limitLabel(courses.length, planConfig.max_courses)}
              </span>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto" disabled={coursesAtLimit}>
                  {coursesAtLimit ? <Lock className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
                  {coursesAtLimit ? 'Límite alcanzado' : 'Crear curso'}
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Crear nuevo curso</DialogTitle>
                <DialogDescription>
                  Añade un nuevo curso a {hub.name}. Define los detalles básicos iniciales.
                </DialogDescription>
              </DialogHeader>
              <Tabs value={createActiveTab} onValueChange={setCreateActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="global">Configuración Global</TabsTrigger>
                  <TabsTrigger value="prices">Precios</TabsTrigger>
                </TabsList>
                
                <TabsContent value="global" className="grid gap-4 py-2 max-h-[50vh] overflow-y-auto px-1">
                  <div className="space-y-2">
                  <Label htmlFor="title">Nombre del curso</Label>
                  <Input 
                    id="title" 
                    placeholder="Ej. Fotografía desde cero" 
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción breve</Label>
                  <Textarea 
                    id="description" 
                    placeholder="¿De qué trata este curso?" 
                    className="h-20"
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                  />
                </div>
                
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">Imagen de Portada / Mockup (Opcional)</Label>
                  {!newThumbnailPreview ? (
                    <>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="new-thumb-upload" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!file.type.startsWith("image/")) { toast.error("Solo se permiten archivos de imagen."); return; }
                          if (file.size > 5 * 1024 * 1024) { toast.error("La imagen supera el límite de 5MB"); return; }
                          setNewThumbnailFile(file);
                          setNewThumbnailPreview(URL.createObjectURL(file));
                          e.target.value = "";
                        }}
                      />
                      <label 
                        htmlFor="new-thumb-upload" 
                        className="rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-6 text-center cursor-pointer group block"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <UploadCloud className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Subir Portada del Curso</p>
                            <p className="text-[11px] text-muted-foreground mt-1">Recomendado: 1280x720 (Máx. 5MB)</p>
                          </div>
                        </div>
                      </label>
                    </>
                  ) : (
                    <div className="relative group rounded-xl overflow-hidden border aspect-video w-full max-w-[280px]">
                      <img src={newThumbnailPreview} alt="Portada Seleccionada" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button variant="destructive" size="icon" onClick={() => {
                          setNewThumbnailFile(null);
                          URL.revokeObjectURL(newThumbnailPreview);
                          setNewThumbnailPreview("");
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
                
              <TabsContent value="prices" className="py-2 max-h-[50vh] overflow-y-auto px-1 space-y-4">
                  <h4 className="text-sm font-semibold">Modos de Suscripción</h4>
                  
                  {/* ÚNICO PAGO */}
                  <div className="space-y-3 p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mode-lifetime" className="cursor-pointer">Pago Único (De por vida)</Label>
                      <Switch id="mode-lifetime" checked={hasLifetime} onCheckedChange={setHasLifetime} />
                    </div>
                    {hasLifetime && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-medium">$</span>
                        <Input 
                          id="mode-lifetime"
                          type="number" 
                          min="0"
                          step="0.01"
                          placeholder="Ej. 199.99" 
                          className="h-8"
                          value={lifetimePrice}
                          onChange={(e) => setLifetimePrice(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* MENSUAL */}
                  <div className="space-y-3 p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mode-monthly" className="cursor-pointer">Suscripción Mensual</Label>
                      <Switch id="mode-monthly" checked={hasMonthly} onCheckedChange={setHasMonthly} />
                    </div>
                    {hasMonthly && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-medium">$</span>
                        <Input 
                          id="mode-monthly"
                          type="number" 
                          min="0"
                          step="0.01"
                          placeholder="Ej. 19.99" 
                          className="h-8"
                          value={monthlyPrice}
                          onChange={(e) => setMonthlyPrice(e.target.value)}
                        />
                        <span className="text-sm text-muted-foreground">/ mes</span>
                      </div>
                    )}
                  </div>

                  {/* ANUAL */}
                  <div className="space-y-3 p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mode-annual" className="cursor-pointer">Suscripción Anual</Label>
                      <Switch id="mode-annual" checked={hasAnnual} onCheckedChange={setHasAnnual} />
                    </div>
                    {hasAnnual && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-medium">$</span>
                        <Input 
                          id="mode-annual"
                          type="number" 
                          min="0"
                          step="0.01"
                          placeholder="Ej. 199.99" 
                          className="h-8"
                          value={annualPrice}
                          onChange={(e) => setAnnualPrice(e.target.value)}
                        />
                        <span className="text-sm text-muted-foreground">/ año</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setNewThumbnailFile(null);
                  if (newThumbnailPreview) URL.revokeObjectURL(newThumbnailPreview);
                  setNewThumbnailPreview("");
                  setCreateActiveTab("global");
                }}>Cancelar</Button>
                <Button onClick={handleCreateCourse} disabled={isCreating}>
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isCreating ? 'Guardando...' : 'Continuar'}
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-3">
          {hubCourses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
                <p>Todavía no hay cursos en esta Academia.</p>
              </CardContent>
            </Card>
          ) : (
            hubCourses.map(c => (
              <Card key={c.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground shrink-0 hidden sm:block" />
                    <div className="h-10 w-10 shrink-0 bg-primary/10 text-primary rounded-md flex items-center justify-center">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base truncate">{c.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{getPriceLabel(c.id)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0 sm:flex-row shrink-0">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setEditingCourse(c)}>
                      <Settings className="mr-1.5 h-3.5 w-3.5" />Configuración
                    </Button>
                    <Button size="sm" asChild className="w-full sm:w-auto">
                      <Link to={`/dashboard/cursos/${c.id}`}><Pencil className="mr-1.5 h-3.5 w-3.5" />Editar Contenido</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* EDIT COURSE DIALOG */}
      <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configuración del Curso</DialogTitle>
            <DialogDescription>
              Modifica los detalles básicos, portada y suscripciones del curso.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={editActiveTab} onValueChange={handleEditTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="global">Configuración Global</TabsTrigger>
              <TabsTrigger value="prices">Precios</TabsTrigger>
            </TabsList>
            
            <TabsContent value="global" className="grid gap-4 py-2 max-h-[50vh] overflow-y-auto px-1">
              <div className="space-y-2">
              <Label htmlFor="edit-title">Nombre del curso</Label>
              <Input 
                id="edit-title" 
                placeholder="Ej. Fotografía desde cero" 
                value={editCourseName}
                onChange={(e) => setEditCourseName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción breve</Label>
              <Textarea 
                id="edit-description" 
                placeholder="¿De qué trata este curso?" 
                className="h-20"
                value={editCourseDesc}
                onChange={(e) => setEditCourseDesc(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <Label className="flex items-center gap-2">Imagen de Portada / Mockup</Label>
              {!editThumbnailUrl ? (
                <>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="edit-thumb-upload" 
                    onChange={handleThumbnailUpload}
                    disabled={isUploadingThumb}
                  />
                  <label 
                    htmlFor="edit-thumb-upload" 
                    className={`rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-6 text-center cursor-pointer group block ${isUploadingThumb ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {isUploadingThumb ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <UploadCloud className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{isUploadingThumb ? 'Subiendo...' : 'Subir Portada'}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">Recomendado: 1280x720 (Máx. 5MB)</p>
                      </div>
                    </div>
                  </label>
                </>
              ) : (
                <div className="relative group rounded-xl overflow-hidden border aspect-video w-full max-w-[280px]">
                  <img src={editThumbnailUrl} alt="Portada" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="destructive" size="icon" onClick={() => setEditThumbnailUrl("")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
            
          <TabsContent value="prices" className="py-2 max-h-[50vh] overflow-y-auto px-1 space-y-4">
              <h4 className="text-sm font-semibold">Modos de Suscripción</h4>
              
              {/* ÚNICO PAGO */}
              <div className="space-y-3 p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-mode-lifetime" className="cursor-pointer">Pago Único (De por vida)</Label>
                  <Switch id="edit-mode-lifetime" checked={editHasLifetime} onCheckedChange={setEditHasLifetime} />
                </div>
                {editHasLifetime && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-medium">$</span>
                    <Input 
                      id="edit-mode-lifetime-price"
                      type="number" 
                      min="0"
                      step="0.01"
                      placeholder="Ej. 199.99" 
                      className="h-8"
                      value={editLifetimePrice}
                      onChange={(e) => setEditLifetimePrice(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* MENSUAL */}
              <div className="space-y-3 p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-mode-monthly" className="cursor-pointer">Suscripción Mensual</Label>
                  <Switch id="edit-mode-monthly" checked={editHasMonthly} onCheckedChange={setEditHasMonthly} />
                </div>
                {editHasMonthly && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-medium">$</span>
                    <Input 
                      id="edit-mode-monthly-price"
                      type="number" 
                      min="0"
                      step="0.01"
                      placeholder="Ej. 19.99" 
                      className="h-8"
                      value={editMonthlyPrice}
                      onChange={(e) => setEditMonthlyPrice(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">/ mes</span>
                  </div>
                )}
              </div>

              {/* ANUAL */}
              <div className="space-y-3 p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-mode-annual" className="cursor-pointer">Suscripción Anual</Label>
                  <Switch id="edit-mode-annual" checked={editHasAnnual} onCheckedChange={setEditHasAnnual} />
                </div>
                {editHasAnnual && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-medium">$</span>
                    <Input 
                      id="edit-mode-annual-price"
                      type="number" 
                      min="0"
                      step="0.01"
                      placeholder="Ej. 199.99" 
                      className="h-8"
                      value={editAnnualPrice}
                      onChange={(e) => setEditAnnualPrice(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">/ año</span>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCourse(null)}>Cancelar</Button>
            <Button onClick={handleEditCourse} disabled={isEditing}>
               {isEditing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
               {isEditing ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfesorLayout>
  );
}
