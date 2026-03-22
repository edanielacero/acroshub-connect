import { getCurrentAlumno } from "@/data/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Camera } from "lucide-react";
import { toast } from "sonner";

export default function AlumnoAjustes() {
  const alumno = getCurrentAlumno();

  const handleSave = () => {
    toast.success("Los ajustes han sido guardados correctamente.");
  };

  return (
    <div className="container py-8 sm:py-12 max-w-4xl mx-auto space-y-8">
      <div>
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
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl shrink-0 relative group cursor-pointer border-2 border-primary/20 hover:border-primary transition-all">
                  {alumno.name.charAt(0)}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 space-y-1 w-full text-center sm:text-left">
                  <p className="font-medium text-sm">Foto de perfil</p>
                  <p className="text-xs text-muted-foreground">Recomendamos una imagen cuadrada de al menos 400x400px en formato JPG o PNG.</p>
                  <Button variant="outline" size="sm" className="mt-2">Cambiar imagen</Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" defaultValue={alumno.name} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" defaultValue={alumno.email} readOnly className="bg-muted/50 text-muted-foreground" />
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
              <Button variant="secondary" className="w-full">Cambiar contraseña</Button>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={handleSave}>Guardar Cambios</Button>
        </div>
      </div>
    </div>
  );
}
