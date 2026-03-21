import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { hubs, courses } from "@/data/mockData";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen, GripVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function ProfesorHubCursos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hub = hubs.find(h => h.id === id);
  const hubCourses = courses.filter(c => c.hubId === id);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [hasLifetime, setHasLifetime] = useState(true);
  const [lifetimePrice, setLifetimePrice] = useState("");
  const [hasMonthly, setHasMonthly] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [hasAnnual, setHasAnnual] = useState(false);
  const [annualPrice, setAnnualPrice] = useState("");

  const handleCreateCourse = () => {
    if (!newCourseName.trim()) {
      toast.error("El nombre del curso es requerido");
      return;
    }
    if (!hasLifetime && !hasMonthly && !hasAnnual) {
      toast.error("Debes seleccionar al menos un modo de suscripción");
      return;
    }
    if (hasLifetime && (!lifetimePrice || isNaN(Number(lifetimePrice)) || Number(lifetimePrice) < 0)) {
      toast.error("El precio de pago único es requerido y no puede ser negativo");
      return;
    }
    if (hasMonthly && (!monthlyPrice || isNaN(Number(monthlyPrice)) || Number(monthlyPrice) < 0)) {
      toast.error("El precio mensual es requerido y no puede ser negativo");
      return;
    }
    if (hasAnnual && (!annualPrice || isNaN(Number(annualPrice)) || Number(annualPrice) < 0)) {
      toast.error("El precio anual es requerido y no puede ser negativo");
      return;
    }

    // Simulate creation
    toast.success(`Curso "${newCourseName}" creado exitosamente`);
    setIsDialogOpen(false);
    setNewCourseName("");
    setNewCourseDesc("");
    setHasLifetime(true);
    setLifetimePrice("");
    setHasMonthly(false);
    setMonthlyPrice("");
    setHasAnnual(false);
    setAnnualPrice("");
    // In a real app we'd get an ID from backend, here we just simulate
    navigate(`/dashboard/cursos/course-1`); 
  };

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

  useEffect(() => {
    if (editingCourse) {
      setEditCourseName(editingCourse.title);
      setEditCourseDesc(editingCourse.description || "");
      setEditHasLifetime(true);
      setEditLifetimePrice(editingCourse.price?.toString() || "");
      setEditHasMonthly(false);
      setEditMonthlyPrice("");
      setEditHasAnnual(false);
      setEditAnnualPrice("");
    }
  }, [editingCourse]);

  const handleEditCourse = () => {
    if (!editCourseName.trim()) {
      toast.error("El nombre del curso es requerido");
      return;
    }
    if (!editHasLifetime && !editHasMonthly && !editHasAnnual) {
      toast.error("Debes seleccionar al menos un modo de suscripción");
      return;
    }
    if (editHasLifetime && (!editLifetimePrice || isNaN(Number(editLifetimePrice)) || Number(editLifetimePrice) < 0)) {
      toast.error("El precio de pago único es requerido y no puede ser negativo");
      return;
    }
    if (editHasMonthly && (!editMonthlyPrice || isNaN(Number(editMonthlyPrice)) || Number(editMonthlyPrice) < 0)) {
      toast.error("El precio mensual es requerido y no puede ser negativo");
      return;
    }
    if (editHasAnnual && (!editAnnualPrice || isNaN(Number(editAnnualPrice)) || Number(editAnnualPrice) < 0)) {
      toast.error("El precio anual es requerido y no puede ser negativo");
      return;
    }

    toast.success(`Curso "${editCourseName}" actualizado correctamente`);
    setEditingCourse(null);
  };

  if (!hub) return <ProfesorLayout><p className="p-8 text-center text-muted-foreground">HUB no encontrado</p></ProfesorLayout>;

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/hubs')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cursos en {hub.name}</h1>
            <p className="text-sm text-muted-foreground">Gestiona y organiza el contenido educativo de este HUB.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
          <h3 className="font-semibold text-lg items-center flex gap-2"><BookOpen className="h-5 w-5 text-primary" /> Inventario de Cursos</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-1 h-4 w-4" />Crear curso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Crear nuevo curso</DialogTitle>
                <DialogDescription>
                  Añade un nuevo curso a {hub.name}. Define los detalles básicos iniciales.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
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
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateCourse}>Continuar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {hubCourses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
                <p>Todavía no hay cursos en este HUB.</p>
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
                      <p className="text-sm text-muted-foreground mt-0.5">{c.modules.length} Módulos · {c.price === 0 ? 'Gratis' : `$${c.price}`}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0 sm:flex-row shrink-0">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setEditingCourse(c)}>
                      Editar Curso
                    </Button>
                    <Button size="sm" asChild className="w-full sm:w-auto">
                      <Link to={`/dashboard/cursos/${c.id}`}>Editar Contenido</Link>
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
            <DialogTitle>Editar curso</DialogTitle>
            <DialogDescription>
              Modifica los detalles básicos y de suscripción del curso.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCourse(null)}>Cancelar</Button>
            <Button onClick={handleEditCourse}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfesorLayout>
  );
}
