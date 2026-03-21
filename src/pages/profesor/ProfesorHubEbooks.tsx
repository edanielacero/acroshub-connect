import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { hubs } from "@/data/mockData";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Book, Plus } from "lucide-react";
import { toast } from "sonner";

export default function ProfesorHubEbooks() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hub = hubs.find(h => h.id === id);

  // MOCK DATA for local testing
  const hubEbooks: any[] = []; 

  if (!hub) return <ProfesorLayout><p className="p-8 text-center text-muted-foreground">HUB no encontrado</p></ProfesorLayout>;

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/hubs')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ebooks en {hub.name}</h1>
            <p className="text-sm text-muted-foreground">Gestiona y organiza el contenido de lectura de este HUB.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
          <h3 className="font-semibold text-lg items-center flex gap-2"><Book className="h-5 w-5 text-primary" /> Inventario de Ebooks</h3>
          <Button size="sm" className="w-full sm:w-auto" onClick={() => toast.info("Editor de ebook próximamente")}>
            <Plus className="mr-1 h-4 w-4" />Crear ebook
          </Button>
        </div>

        <div className="space-y-3">
          {hubEbooks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
                <p>Todavía no hay ebooks en este HUB.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </ProfesorLayout>
  );
}
