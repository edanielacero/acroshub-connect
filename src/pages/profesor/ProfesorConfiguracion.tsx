import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { getCurrentProfesor } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ProfesorConfiguracion() {
  const prof = getCurrentProfesor();

  return (
    <ProfesorLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <h1 className="text-2xl font-bold">Configuración</h1>

        <Card>
          <CardHeader><CardTitle>Datos personales</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Nombre</Label><Input defaultValue={prof.name} /></div>
            <div className="space-y-2"><Label>Email</Label><Input defaultValue={prof.email} type="email" /></div>
            <div className="space-y-2">
              <Label>Email de emergencia</Label>
              <Input defaultValue={prof.emergencyEmail || ''} type="email" />
              <p className="text-xs text-muted-foreground">En caso de emergencia contactaremos aquí</p>
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Button variant="outline" size="sm">Cambiar contraseña</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stripe Connect</CardTitle></CardHeader>
          <CardContent>
            {prof.stripeConnected ? (
              <div className="flex items-center gap-3">
                <Badge className="bg-success text-success-foreground gap-1"><CheckCircle className="h-3.5 w-3.5" />Conectado</Badge>
                <span className="text-sm text-muted-foreground">{prof.stripeEmail}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Conecta tu cuenta de Stripe para recibir pagos directamente de tus alumnos.</p>
                <Button>Conectar Stripe</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={() => toast.success("Cambios guardados correctamente")}>Guardar cambios</Button>
      </div>
    </ProfesorLayout>
  );
}
