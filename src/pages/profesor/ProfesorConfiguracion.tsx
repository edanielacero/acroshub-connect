import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ProfesorConfiguracion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch the profile from Supabase
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Controlled form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emergencyEmail, setEmergencyEmail] = useState("");
  const [manualPaymentLink, setManualPaymentLink] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync form fields when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setEmergencyEmail(profile.emergency_email || "");
      setManualPaymentLink(profile.manual_payment_link || "");
    }
    if (user) {
      setEmail(user.email || "");
    }
  }, [profile, user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: name,
      emergency_email: emergencyEmail || null,
      manual_payment_link: manualPaymentLink || null,
    }).eq('id', user!.id);
    setIsSaving(false);

    if (error) { toast.error(error.message); return; }

    // Also update auth user metadata so the name stays in sync
    await supabase.auth.updateUser({ data: { full_name: name } });

    toast.success("Cambios guardados correctamente");
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
  };

  // Password Change States
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
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
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    
    toast.success("Contraseña actualizada exitosamente");
    setIsPasswordDialogOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (isLoading) {
    return <ProfesorLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></ProfesorLayout>;
  }

  return (
    <ProfesorLayout>
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Configuración</h1>

        <Card>
          <CardHeader><CardTitle>Datos personales</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} type="email" disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">El email no se puede cambiar desde aquí.</p>
            </div>
            <div className="space-y-2">
              <Label>Email de emergencia</Label>
              <Input value={emergencyEmail} onChange={e => setEmergencyEmail(e.target.value)} type="email" placeholder="contacto-alterno@email.com" />
              <p className="text-xs text-muted-foreground">En caso de emergencia contactaremos aquí</p>
            </div>
            <div className="space-y-2 pt-2">
              <Label>Link para Compra Manual</Label>
              <Input value={manualPaymentLink} onChange={e => setManualPaymentLink(e.target.value)} type="url" placeholder="ej. https://wa.me/1234567890" />
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
                      <Input id="current-pwd" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="(Para verificación interna)" />
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
                    <Button onClick={handleChangePassword} disabled={loading}>{loading ? 'Actualizando...' : 'Actualizar contraseña'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* STRIPE UI HIDDEN FOR NOW
        <Card>
          <CardHeader><CardTitle>Stripe Connect</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Conecta tu cuenta de Stripe para recibir pagos directamente de tus alumnos.</p>
              <Button className="w-full sm:w-auto">Conectar Stripe</Button>
            </div>
          </CardContent>
        </Card>
        */}

        <Button className="w-full sm:w-auto" onClick={handleSaveProfile} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </ProfesorLayout>
  );
}
