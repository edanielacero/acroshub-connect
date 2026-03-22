import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ProfesorComentarios() {
  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comentarios</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona y administra los comentarios de tus alumnos.</p>
        </div>

        <div className="text-center py-20 px-4 border rounded-xl bg-card border-dashed">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">Sistema de comentarios próximamente</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
            El sistema de comentarios se está construyendo. Pronto podrás ver y responder los comentarios de tus alumnos aquí.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/dashboard">Volver al Dashboard</Link>
          </Button>
        </div>
      </div>
    </ProfesorLayout>
  );
}
