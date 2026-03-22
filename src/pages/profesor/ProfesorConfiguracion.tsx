import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { getCurrentProfesor } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ProfesorConfiguracion() {
  const prof = getCurrentProfesor();
  
  // Password Change States
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    toast.success("Contraseña actualizada exitosamente");
    setIsPasswordDialogOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <ProfesorLayout>
      <div className="max-w-2xl space-y-6 animate-fade-in">
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
            <div className="space-y-2 pt-2">
              <Label>Link para Compra Manual</Label>
              <Input defaultValue={prof.manualPaymentLink || ''} type="url" placeholder="ej. https://wa.me/1234567890" />
              <p className="text-xs text-muted-foreground">
                Usa un enlace de WhatsApp u otro método para que los clientes te hablen si prefieres ventas manuales.
              </p>
            </div>
            <div className="space-y-3 pt-4 border-t mt-4">
              <Label className="block text-base font-medium">Contraseña</Label>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">Cambiar contraseña</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                    <DialogDescription>
                      Ingresa tu contraseña actual y la nueva contraseña que deseas usar para tu cuenta.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-pwd">Contraseña Actual</Label>
                      <Input id="current-pwd" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-pwd">Nueva Contraseña</Label>
                      <Input id="new-pwd" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pwd">Confirmar Nueva Contraseña</Label>
                      <Input id="confirm-pwd" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleChangePassword}>Actualizar contraseña</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stripe Connect</CardTitle></CardHeader>
          <CardContent>
            {prof.stripeConnected ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Badge className="w-fit gap-1 bg-success text-success-foreground"><CheckCircle className="h-3.5 w-3.5" />Conectado</Badge>
                <span className="text-sm text-muted-foreground break-all">{prof.stripeEmail}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Conecta tu cuenta de Stripe para recibir pagos directamente de tus alumnos.</p>
                <Button className="w-full sm:w-auto">Conectar Stripe</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Button className="w-full sm:w-auto" onClick={() => toast.success("Cambios guardados correctamente")}>Guardar cambios</Button>
      </div>
    </ProfesorLayout>
  );
}
