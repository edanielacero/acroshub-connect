import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowLeft } from "lucide-react";

export default function ProfesorResponderComentarios() {
  return (
    <ProfesorLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild className="shrink-0 -ml-2">
            <Link to="/dashboard/comentarios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Responder Comentarios</h1>
        </div>

        <div className="flex-1 flex items-center justify-center border rounded-xl bg-card border-dashed">
          <div className="text-center p-8">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">Sistema de comentarios próximamente</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">El sistema de comentarios se conectará a la base de datos pronto.</p>
            <Button asChild variant="outline">
              <Link to="/dashboard">Ir al Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </ProfesorLayout>
  );
}
