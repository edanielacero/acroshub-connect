import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { useProfesorData } from "@/hooks/useProfesorData";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Book, BookCopy, GripVertical, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function ProfesorHubEbooks() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hubs, ebooks, pricingOptions = [], isLoading } = useProfesorData();
  
  const hub = hubs.find((h: any) => h.id === id);
  const hubEbooks = ebooks.filter((e: any) => e.hub_id === id);

  // Helper: get pricing for a given ebook
  const getPricing = (ebookId: string) => pricingOptions.filter((p: any) => p.product_id === ebookId);
  const getPriceLabel = (ebookId: string) => {
    const prices = getPricing(ebookId);
    if (prices.length === 0) return 'Sin precio';
    return prices.map((p: any) => {
      const label = p.type === 'one-time' ? 'Único' : p.type === 'monthly' ? 'Mensual' : 'Anual';
      return `$${Number(p.price).toFixed(2)} ${label}`;
    }).join(' · ');
  };

  // --- CREATE EBOOK MODAL STATES ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newEbookName, setNewEbookName] = useState("");
  const [newEbookDesc, setNewEbookDesc] = useState("");
  const [hasLifetime, setHasLifetime] = useState(true);
  const [lifetimePrice, setLifetimePrice] = useState("");
  const [hasMonthly, setHasMonthly] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [hasAnnual, setHasAnnual] = useState(false);
  const [annualPrice, setAnnualPrice] = useState("");

  const handleCreateEbook = async () => {
    if (!newEbookName.trim()) { toast.error("El nombre del ebook es requerido"); return; }
    if (!hasLifetime && !hasMonthly && !hasAnnual) { toast.error("Debes seleccionar al menos un modo de suscripción"); return; }
    
    setIsCreating(true);

    const { data: newEbook, error } = await supabase.from('ebooks').insert({
      hub_id: id,
      profesor_id: user?.id,
      title: newEbookName,
      description: newEbookDesc,
      is_published: false
    }).select().single();

    if (error) {
      toast.error(error.message);
      setIsCreating(false);
      return;
    }

    const pricingOptions = [];
    if (hasLifetime) pricingOptions.push({ product_id: newEbook.id, product_type: 'ebook', type: 'one-time', price: Number(lifetimePrice)||0, currency: 'USD' });
    if (hasMonthly) pricingOptions.push({ product_id: newEbook.id, product_type: 'ebook', type: 'monthly', price: Number(monthlyPrice)||0, currency: 'USD' });
    if (hasAnnual) pricingOptions.push({ product_id: newEbook.id, product_type: 'ebook', type: 'annual', price: Number(annualPrice)||0, currency: 'USD' });

    if (pricingOptions.length > 0) await supabase.from('pricing_options').insert(pricingOptions);

    toast.success(`Ebook "${newEbookName}" creado exitosamente`);
    queryClient.invalidateQueries({ queryKey: ['ebooks'] });
    setIsDialogOpen(false);
    
    setNewEbookName(""); setNewEbookDesc("");
    setHasLifetime(true); setLifetimePrice("");
    setHasMonthly(false); setMonthlyPrice("");
    setHasAnnual(false); setAnnualPrice("");
    setIsCreating(false);
    navigate(`/dashboard/ebooks/${newEbook.id}`); 
  };

  // --- EDIT EBOOK MODAL STATES ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingEbook, setEditingEbook] = useState<any>(null);
  const [editEbookName, setEditEbookName] = useState("");
  const [editEbookDesc, setEditEbookDesc] = useState("");
  const [editHasLifetime, setEditHasLifetime] = useState(true);
  const [editLifetimePrice, setEditLifetimePrice] = useState("");
  const [editHasMonthly, setEditHasMonthly] = useState(false);
  const [editMonthlyPrice, setEditMonthlyPrice] = useState("");
  const [editHasAnnual, setEditHasAnnual] = useState(false);
  const [editAnnualPrice, setEditAnnualPrice] = useState("");

  useEffect(() => {
    if (editingEbook) {
      setEditEbookName(editingEbook.title);
      setEditEbookDesc(editingEbook.description || "");
      const prices = getPricing(editingEbook.id);
      const oneTime = prices.find((p: any) => p.type === 'one-time');
      const monthly = prices.find((p: any) => p.type === 'monthly');
      const annual = prices.find((p: any) => p.type === 'annual');
      setEditHasLifetime(!!oneTime);
      setEditLifetimePrice(oneTime ? String(oneTime.price) : "");
      setEditHasMonthly(!!monthly);
      setEditMonthlyPrice(monthly ? String(monthly.price) : "");
      setEditHasAnnual(!!annual);
      setEditAnnualPrice(annual ? String(annual.price) : "");
    }
  }, [editingEbook]);

  const [isEditing, setIsEditing] = useState(false);
  const handleEditEbook = async () => {
    if (!editEbookName.trim()) { toast.error("El nombre del ebook es requerido"); return; }
    if (!editHasLifetime && !editHasMonthly && !editHasAnnual) { toast.error("Debes seleccionar al menos un modo de suscripción"); return; }
    
    setIsEditing(true);

    // 1. Update ebook title/description
    const { error } = await supabase.from('ebooks').update({
      title: editEbookName,
      description: editEbookDesc
    }).eq('id', editingEbook.id);

    if (error) { toast.error(error.message); setIsEditing(false); return; }

    // 2. Replace all pricing options: delete existing, then insert new ones
    await supabase.from('pricing_options').delete().eq('product_id', editingEbook.id);

    const newPricing: any[] = [];
    if (editHasLifetime) newPricing.push({ product_id: editingEbook.id, product_type: 'ebook', type: 'one-time', price: Number(editLifetimePrice) || 0, currency: 'USD' });
    if (editHasMonthly) newPricing.push({ product_id: editingEbook.id, product_type: 'ebook', type: 'monthly', price: Number(editMonthlyPrice) || 0, currency: 'USD' });
    if (editHasAnnual) newPricing.push({ product_id: editingEbook.id, product_type: 'ebook', type: 'annual', price: Number(editAnnualPrice) || 0, currency: 'USD' });

    if (newPricing.length > 0) {
      const { error: pErr } = await supabase.from('pricing_options').insert(newPricing);
      if (pErr) { toast.error(pErr.message); setIsEditing(false); return; }
    }

    setIsEditing(false);
    toast.success(`Ebook "${editEbookName}" actualizado correctamente`);
    queryClient.invalidateQueries({ queryKey: ['ebooks'] });
    queryClient.invalidateQueries({ queryKey: ['pricing_options'] });
    setEditingEbook(null);
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
            <h1 className="text-2xl font-bold tracking-tight">Ebooks en {hub.name}</h1>
            <p className="text-sm text-muted-foreground">Gestiona y organiza el contenido de lectura de esta Academia.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
          <h3 className="font-semibold text-lg items-center flex gap-2"><Book className="h-5 w-5 text-primary" /> Inventario de Ebooks</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-1 h-4 w-4" />Crear ebook
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Crear nuevo ebook</DialogTitle>
                <DialogDescription>
                  Añade un nuevo ebook a {hub.name}. Configura su nombre y los modos de suscripción.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div className="space-y-2">
                  <Label htmlFor="title">Nombre del ebook</Label>
                  <Input 
                    id="title" 
                    placeholder="Ej. Guía definitiva de Fotografía" 
                    value={newEbookName}
                    onChange={(e) => setNewEbookName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción breve</Label>
                  <Textarea 
                    id="description" 
                    placeholder="¿De qué trata este ebook?" 
                    className="h-20"
                    value={newEbookDesc}
                    onChange={(e) => setNewEbookDesc(e.target.value)}
                  />
                </div>
                
                <div className="pt-2 border-t space-y-4">
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
                          id="mode-lifetime-price"
                          type="number" min="0" step="0.01"
                          placeholder="Ej. 19.99" className="h-8"
                          value={lifetimePrice} onChange={(e) => setLifetimePrice(e.target.value)}
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
                          id="mode-monthly-price"
                          type="number" min="0" step="0.01"
                          placeholder="Ej. 9.99" className="h-8"
                          value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)}
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
                          id="mode-annual-price"
                          type="number" min="0" step="0.01"
                          placeholder="Ej. 99.99" className="h-8"
                          value={annualPrice} onChange={(e) => setAnnualPrice(e.target.value)}
                        />
                        <span className="text-sm text-muted-foreground">/ año</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateEbook} disabled={isCreating}>
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isCreating ? 'Guardando...' : 'Continuar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {hubEbooks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
                <p>Todavía no hay ebooks en esta Academia.</p>
              </CardContent>
            </Card>
          ) : (
            hubEbooks.map(eb => (
              <Card key={eb.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground shrink-0 hidden sm:block" />
                    <div className="h-10 w-10 shrink-0 bg-primary/10 text-primary rounded-md flex items-center justify-center">
                      <Book className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base truncate">{eb.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{getPriceLabel(eb.id)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0 sm:flex-row shrink-0">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setEditingEbook(eb)}>
                      Editar Ebook
                    </Button>
                    <Button size="sm" asChild className="w-full sm:w-auto">
                      <Link to={`/dashboard/ebooks/${eb.id}`}>Editar Contenido</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* EDIT EBOOK DIALOG */}
      <Dialog open={!!editingEbook} onOpenChange={(open) => !open && setEditingEbook(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Ebook</DialogTitle>
            <DialogDescription>
              Modifica los detalles básicos y de suscripción del ebook.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Nombre del Ebook</Label>
              <Input 
                id="edit-title" 
                placeholder="Ej. Guía definitiva de Fotografía" 
                value={editEbookName}
                onChange={(e) => setEditEbookName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción breve</Label>
              <Textarea 
                id="edit-description" 
                placeholder="¿De qué trata este ebook?" 
                className="h-20"
                value={editEbookDesc}
                onChange={(e) => setEditEbookDesc(e.target.value)}
              />
            </div>
            
            <div className="pt-2 border-t space-y-4">
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
                      type="number" min="0" step="0.01"
                      placeholder="Ej. 19.99" className="h-8"
                      value={editLifetimePrice} onChange={(e) => setEditLifetimePrice(e.target.value)}
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
                      type="number" min="0" step="0.01"
                      placeholder="Ej. 9.99" className="h-8"
                      value={editMonthlyPrice} onChange={(e) => setEditMonthlyPrice(e.target.value)}
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
                      type="number" min="0" step="0.01"
                      placeholder="Ej. 99.99" className="h-8"
                      value={editAnnualPrice} onChange={(e) => setEditAnnualPrice(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">/ año</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEbook(null)}>Cancelar</Button>
            <Button onClick={handleEditEbook} disabled={isEditing}>
               {isEditing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
               {isEditing ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfesorLayout>
  );
}
