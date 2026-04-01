import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { useProfesorData, isAtLimit, limitLabel } from "@/hooks/useProfesorData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FolderOpen, Plus, CheckCircle2, Loader2, BookOpen, Book, Pencil, Eye, Lock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfesorHubs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hubs: profHubs = [], courses = [], ebooks = [], planConfig, isLoading } = useProfesorData();

  const hubsAtLimit = isAtLimit(profHubs.length, planConfig?.max_hubs ?? -1);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newHubName, setNewHubName] = useState("");
  const [newHubSlug, setNewHubSlug] = useState("");
  const [newHubDescription, setNewHubDescription] = useState("");
  
  const [emptyHubAlertOpen, setEmptyHubAlertOpen] = useState(false);
  const [selectedEmptyHub, setSelectedEmptyHub] = useState<any>(null);

  // Auto-generate slug when name changes for UX
  useEffect(() => {
    const baseSlug = newHubName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setNewHubSlug(baseSlug);
  }, [newHubName]);

  // Basic availability lookup on frontend logic (Supabase will double check on unique constraint)
  const isSlugTaken = newHubSlug.length > 0 && profHubs.some((h: any) => h.slug === newHubSlug);
  const suggestedSlugs = isSlugTaken ? [
    `${newHubSlug}-1`,
    `${newHubSlug}-2`,
    `${newHubSlug}-academia`
  ] : [];

  const handleCreateHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHubName || !newHubSlug) {
      toast.error("El nombre y el slug URL son obligatorios.");
      return;
    }
    if (hubsAtLimit) {
      toast.error(`Has alcanzado el límite de academias de tu plan (${planConfig?.max_hubs}). Actualiza tu plan para crear más.`);
      return;
    }
    
    setIsCreating(true);
    
    const { data, error } = await supabase.from('hubs').insert({
      profesor_id: user?.id,
      name: newHubName,
      slug: newHubSlug,
      description: newHubDescription || "Nuevo hub educativo...",
    });

    setIsCreating(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    
    toast.success("Academia creada exitosamente");
    queryClient.invalidateQueries({ queryKey: ['hubs'] });
    setIsCreateOpen(false);
    setNewHubName("");
    setNewHubSlug("");
    setNewHubDescription("");
  };

  const handleViewAsStudent = (hub: any) => {
    navigate(`/${hub.slug}`);
  };

  if (isLoading) {
    return (
      <ProfesorLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProfesorLayout>
    );
  }

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mis Academias</h1>
            <p className="text-sm text-muted-foreground mt-1">Una Academia te permite agrupar varios Cursos y Ebooks de un mismo tema para ofrecerlos juntos a tus alumnos.</p>
          </div>
          <div className="flex items-center gap-3">
            {planConfig && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                hubsAtLimit ? 'bg-red-50 text-red-600 border-red-200' : 'bg-muted text-muted-foreground border-border'
              }`}>
                Academias: {limitLabel(profHubs.length, planConfig.max_hubs)}
              </span>
            )}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto" disabled={hubsAtLimit}>
                  {hubsAtLimit ? <Lock className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {hubsAtLimit ? 'Límite alcanzado' : 'Crear Academia'}
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Crear nueva Academia</DialogTitle>
                <DialogDescription>
                  Define la información básica de tu próxima academia en línea.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateHub} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="hub-name">Nombre de la Academia</Label>
                  <Input 
                    id="hub-name" 
                    placeholder="Ej. Academia de Trading PRO" 
                    value={newHubName}
                    onChange={(e) => setNewHubName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hub-slug">URL (Slug)</Label>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground bg-muted p-2 border border-r-0 rounded-l-md">
                      acroshub.com/
                    </span>
                    <Input 
                      id="hub-slug" 
                      className={`rounded-l-none ${isSlugTaken ? 'border-destructive focus-visible:ring-destructive' : (newHubSlug ? 'border-success focus-visible:ring-success' : '')}`}
                      placeholder="trading-pro" 
                      value={newHubSlug}
                      onChange={(e) => setNewHubSlug(e.target.value)}
                    />
                  </div>
                  {!newHubSlug ? (
                    <p className="text-[0.8rem] text-muted-foreground">Esta será la dirección pública de tu academia.</p>
                  ) : isSlugTaken ? (
                    <div className="text-[0.8rem] text-destructive flex flex-col gap-1">
                      <p>Este slug ya está en uso.</p>
                      <div className="flex gap-2">
                        Sugerencias: 
                        {suggestedSlugs.map((slug) => (
                          <button 
                            key={slug} type="button" 
                            onClick={() => setNewHubSlug(slug)}
                            className="text-primary hover:underline font-medium"
                          >
                            {slug}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[0.8rem] text-success font-medium flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3" /> Slug disponible
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hub-desc">Descripción (Opcional)</Label>
                  <Textarea 
                    id="hub-desc" 
                    placeholder="Describe de qué trata este nuevo espacio educativo..." 
                    className="resize-none"
                    rows={3}
                    value={newHubDescription}
                    onChange={(e) => setNewHubDescription(e.target.value)}
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isCreating ? 'Guardando...' : 'Crear Academia'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profHubs.map(hub => (
            <Card key={hub.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div 
                className="relative flex h-36 items-center justify-center overflow-hidden"
                style={{
                  background: hub.cover_url 
                    ? undefined 
                    : `linear-gradient(135deg, ${hub.primary_color || '#6366f1'}33 0%, ${hub.primary_color || '#6366f1'}11 100%)`
                }}
              >
                {hub.cover_url ? (
                  <img src={hub.cover_url} alt={hub.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <div className="absolute inset-0" style={{ background: hub.cover_url ? 'rgba(0,0,0,0.25)' : undefined }} />
                {hub.logo_url ? (
                  <img src={hub.logo_url} alt="Logo" className="relative z-10 h-14 w-14 rounded-full object-cover border-2 border-white/60 shadow-sm" />
                ) : (
                  <FolderOpen className="relative z-10 h-14 w-14" style={{ color: hub.primary_color ? `${hub.primary_color}99` : undefined }} />
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold">{hub.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{hub.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="default" size="sm" asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                    <Link to={`/dashboard/hubs/${hub.id}/cursos`}><BookOpen className="mr-1.5 h-3.5 w-3.5" />Cursos</Link>
                  </Button>
                  <Button variant="default" size="sm" asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                    <Link to={`/dashboard/hubs/${hub.id}/ebooks`}><Book className="mr-1.5 h-3.5 w-3.5" />Ebooks</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/dashboard/hubs/${hub.id}`}><Pencil className="mr-1.5 h-3.5 w-3.5" />Editar Academia</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewAsStudent(hub)}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" />Ver como alumno
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog open={emptyHubAlertOpen} onOpenChange={setEmptyHubAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tu Academia está vacía</AlertDialogTitle>
            <AlertDialogDescription>
              Aún no tienes contenidos para mostrar a tus alumnos en <b>{selectedEmptyHub?.name}</b>. 
              Por favor, añade al menos un Curso o un Ebook antes de visualizar tu academia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Entendido</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setEmptyHubAlertOpen(false);
              if (selectedEmptyHub) navigate(`/dashboard/hubs/${selectedEmptyHub.id}/cursos`);
            }}>
              Añadir contenido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </ProfesorLayout>
  );
}
