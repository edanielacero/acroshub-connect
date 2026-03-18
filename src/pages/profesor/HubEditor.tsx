import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { hubs, courses } from "@/data/mockData";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen, GripVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function HubEditor() {
  const { id } = useParams();
  const hub = hubs.find(h => h.id === id);
  const hubCourses = courses.filter(c => c.hubId === id);
  const [name, setName] = useState(hub?.name || '');
  const [slug, setSlug] = useState(hub?.slug || '');
  const [description, setDescription] = useState(hub?.description || '');
  const [color, setColor] = useState(hub?.primaryColor || '#2563EB');

  if (!hub) return <ProfesorLayout><p>HUB no encontrado</p></ProfesorLayout>;

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/dashboard/hubs"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <h1 className="text-2xl font-bold">Editar HUB</h1>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="personalizacion">Personalización</TabsTrigger>
            <TabsTrigger value="cursos">Cursos</TabsTrigger>
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
            <div className="space-y-2">
              <Label>Imagen de portada</Label>
              <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground sm:p-8">
                Arrastra una imagen o haz clic para seleccionar
              </div>
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
          </TabsContent>

          <TabsContent value="cursos" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold">Cursos del HUB</h3>
              <Button size="sm" className="w-full sm:w-auto" onClick={() => toast.info("Editor de curso próximamente")}>
                <Plus className="mr-1 h-4 w-4" />Crear curso
              </Button>
            </div>
            <div className="space-y-2">
              {hubCourses.map(c => (
                <Card key={c.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground shrink-0" />
                      <BookOpen className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{c.title}</p>
                        <p className="text-sm text-muted-foreground">{c.modules.length} módulos · ${c.price}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                      <Link to={`/dashboard/cursos/${c.id}`}>Editar</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Button className="w-full sm:w-auto" onClick={() => toast.success("Cambios guardados correctamente")}>Guardar cambios</Button>
      </div>
    </ProfesorLayout>
  );
}
