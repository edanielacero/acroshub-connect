import { useState, useEffect, useRef } from "react";
import { useAlumnoData } from "@/hooks/useAlumnoData";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Loader2, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AlumnoAjustes() {
  const { profile, isLoading } = useAlumnoData();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password States
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setName(profile.full_name);
    }
    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url);
    } else if (profile && 'avatar_url' in profile && (profile as any).avatar_url) {
      setAvatarUrl((profile as any).avatar_url);
    }
  }, [profile, user]);

  if (isLoading || !user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', profile.id);
    await supabase.auth.updateUser({ data: { full_name: name } });
    setIsSaving(false);
    
    if (error) {
      toast.error(`Error: ${error.message}`);
      return;
    }
    
    toast.success("Los ajustes han sido guardados correctamente.");
    queryClient.invalidateQueries({ queryKey: ['profile', profile.id] });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecciona una imagen válida.");
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('hubs')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('hubs')
        .getPublicUrl(fileName);

      const url = publicUrlData.publicUrl;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: url }
      });

      if (updateError) throw updateError;
      
      // Intentar actualizar tmb en profiles por si acaso (fail silent si columna no existe)
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);

      setAvatarUrl(url);
      toast.success("Foto de perfil actualizada correctamente.");
      queryClient.invalidateQueries({ queryKey: ['profile', profile?.id] });
    } catch (err: any) {
      toast.error(`Error al subir la imagen: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    
    toast.success("Contraseña actualizada exitosamente");
    setIsPasswordDialogOpen(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="container py-8 sm:py-12 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <Button variant="ghost" className="mb-4 -ml-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground mt-2">Administra tu información personal y tus preferencias de comunicación.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_250px] items-start">
        {/* Main Settings Area */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Información Básica</CardTitle>
              <CardDescription>Esta información es global y se comparte con todas tus academias.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl shrink-0 overflow-hidden border-2 border-primary/20">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <>{name ? name.charAt(0).toUpperCase() : 'A'}</>
                  )}
                </div>
                <div className="flex-1 space-y-1 w-full text-center sm:text-left">
                  <p className="font-medium text-sm">Foto de perfil</p>
                  <p className="text-xs text-muted-foreground">Recomendamos una imagen cuadrada de al menos 400x400px en formato JPG o PNG.</p>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleAvatarUpload} />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cambiar imagen
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" value={user.email || ""} readOnly className="bg-muted/50 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Tu correo es tu identificador global único. Para cambiarlo contacta a soporte.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notificaciones</CardTitle>
              <CardDescription>Controla qué correos te enviamos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Actualizaciones de Clases</Label>
                  <p className="text-sm text-muted-foreground">Cuando un profesor responde a tus dudas o sube contenido nuevo.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Vencimiento de Suscripciones</Label>
                  <p className="text-sm text-muted-foreground">Avisos importantes 7 días antes de perder acceso a un curso.</p>
                </div>
                <Switch defaultChecked disabled /> {/* Obligatorio */}
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Marketing y Promociones</Label>
                  <p className="text-sm text-muted-foreground">Ofertas y bundles especiales de tus profesores actuales.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings Area */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4" /> Seguridad</CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="text-sm">Contraseña</Label>
              <p className="text-xs text-muted-foreground mb-4 mt-1">Tu cuenta usa autenticación por correo y contraseña regular.</p>
              
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="w-full">Cambiar contraseña</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cambiar contraseña</DialogTitle>
                    <DialogDescription>Ingresa tu nueva contraseña para actualizar el acceso a tu cuenta.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-pass">Nueva contraseña</Label>
                      <Input id="new-pass" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pass">Confirmar nueva contraseña</Label>
                      <Input id="confirm-pass" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                      {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Actualizar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}
