import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { getCurrentProfesor, hubs } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FolderOpen, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

export default function ProfesorHubs() {
  const prof = getCurrentProfesor();
  
  // local state to fake UI creation
  const [profHubs, setProfHubs] = useState(hubs.filter(h => h.profesorId === prof.id));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newHubName, setNewHubName] = useState("");
  const [newHubSlug, setNewHubSlug] = useState("");
  const [newHubDescription, setNewHubDescription] = useState("");

  // Auto-generate slug when name changes for UX
  useEffect(() => {
    const baseSlug = newHubName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setNewHubSlug(baseSlug);
  }, [newHubName]);

  // Slug Availability Logic
  const isSlugTaken = newHubSlug.length > 0 && (hubs.some(h => h.slug === newHubSlug) || profHubs.some(h => h.slug === newHubSlug));
  const suggestedSlugs = isSlugTaken ? [
    `${newHubSlug}-1`,
    `${newHubSlug}-2`,
    `${newHubSlug}-academia`
  ] : [];

  const handleCreateHub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHubName || !newHubSlug) {
      toast.error("El nombre y el slug URL son obligatorios.");
      return;
    }
    
    if (isSlugTaken) {
      toast.error("El slug seleccionado ya está en uso. Por favor, elige otro.");
      return;
    }
    
    // Add to mocked local state
    const newHub = {
      id: "hub-" + Math.random().toString(36).substr(2, 9),
      profesorId: prof.id,
      name: newHubName,
      slug: newHubSlug,
      description: newHubDescription || "Nuevo hub educativo...",
      logo: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=300&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&h=400&fit=crop",
      theme: "light",
      primaryColor: "#000000",
      coursesCount: 0,
      studentsCount: 0
    };
    
    setProfHubs([newHub, ...profHubs]);
    toast.success("HUB creado exitosamente");
    setIsCreateOpen(false);
    setNewHubName("");
    setNewHubSlug("");
    setNewHubDescription("");
  };

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Mis HUBs</h1>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Crear HUB</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Crear nuevo HUB</DialogTitle>
                <DialogDescription>
                  Define la información básica de tu próxima academia en línea.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateHub} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="hub-name">Nombre del HUB</Label>
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
                  <Button type="submit">Crear HUB</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profHubs.map(hub => (
            <Card key={hub.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <FolderOpen className="h-14 w-14 text-primary/40" />
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold">{hub.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{hub.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{hub.coursesCount} cursos · {hub.studentsCount} alumnos</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/dashboard/hubs/${hub.id}`}>Editar</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="flex-1">
                    <Link to={`/${hub.slug}`}>Ver como alumno</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProfesorLayout>
  );
}
