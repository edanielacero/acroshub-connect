import { getCurrentAlumno, hubs, courses, profesores } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, AlertTriangle, AlertCircle, Info, ChevronRight } from "lucide-react";

export default function AlumnoDashboard() {
  const alumno = getCurrentAlumno();
  
  // Lógica para obtener hubs con acceso
  const purchasedCourseIds = alumno.purchasedCourses;
  const purchasedCourses = courses.filter(c => purchasedCourseIds.includes(c.id));
  const hubIds = [...new Set(purchasedCourses.map(c => c.hubId))];
  const hubsConAcceso = hubs.filter(h => hubIds.includes(h.id)).map(hub => {
    return {
      ...hub,
      productosActivos: purchasedCourses.filter(c => c.hubId === hub.id).length
    }
  });
  const unreadNotifications = alumno.notifications?.filter(n => !n.isRead) || [];

  return (
    <div className="container py-8 sm:py-12 max-w-6xl mx-auto">
      {/* BANNERS DE NOTIFICACIÓN */}
      {unreadNotifications.length > 0 && (
        <div className="mb-8 space-y-3">
          {unreadNotifications.map(notification => {
            const isWarning = notification.type === 'warning';
            const isError = notification.type === 'error';
            
            const prof = notification.profesorId ? profesores.find(p => p.id === notification.profesorId) : null;
            const isUnavailable = notification.requiresPayment ? (!prof?.stripeConnected && !prof?.manualPaymentLink) : false;
            const isManualPayment = notification.requiresPayment ? (!prof?.stripeConnected && !!prof?.manualPaymentLink) : false;
            
            const actionWord = notification.actionText ? notification.actionText.split(' ')[0] : 'Renovar';
            
            const handleAction = () => {
              if (notification.requiresPayment) {
                if (isManualPayment && prof?.manualPaymentLink) {
                  window.open(prof.manualPaymentLink, '_blank');
                  return;
                }
                // Si va a stripe, teóricamente redirigiría, en demo usamos el link por defecto si lo hay o toast
              }
              // Normal action
            };

            return (
              <div 
                key={notification.id} 
                className={`animate-fade-in flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 rounded-xl border shadow-sm
                  ${isError ? 'bg-red-50/50 border-red-200 text-red-900' : 
                    isWarning ? 'bg-amber-50/50 border-amber-200 text-amber-900' : 
                    'bg-blue-50/50 border-blue-200 text-blue-900'}`}
              >
                <div className="flex gap-3 items-start">
                  <div className={`mt-0.5 shrink-0 ${isError ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-blue-500'}`}>
                    {isError ? <AlertCircle className="h-5 w-5" /> : 
                     isWarning ? <AlertTriangle className="h-5 w-5" /> : 
                     <Info className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">
                      {isError ? 'Aviso importante' : isWarning ? 'Atención requerida' : 'Notificación'}
                    </h4>
                    <p className="text-sm mt-1 leading-relaxed opacity-90">{notification.message}</p>
                  </div>
                </div>
                {notification.actionText && (
                  isUnavailable ? (
                    <div className="text-sm font-semibold opacity-80 italic mt-2 sm:mt-0">
                      Contactar al Profesor para {actionWord}
                    </div>
                  ) : (
                    <Button 
                      variant={isError ? "destructive" : isWarning ? "default" : "secondary"} 
                      size="sm" 
                      onClick={handleAction}
                      className={`whitespace-nowrap shrink-0 w-full sm:w-auto ${isWarning ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                      asChild={!isManualPayment}
                    >
                      {isManualPayment ? (
                        <span>
                          {notification.actionText}
                          <ChevronRight className="h-4 w-4 ml-1.5 opacity-70" />
                        </span>
                      ) : (
                        <Link to={notification.actionUrl || '#'}>
                          {notification.actionText}
                          <ChevronRight className="h-4 w-4 ml-1.5 opacity-70" />
                        </Link>
                      )}
                    </Button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Hola, {alumno.name.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground mt-2">Aquí están todos tus cursos y profesores</p>
      </div>

      {hubsConAcceso.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hubsConAcceso.map(hub => (
            <Card key={hub.id} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
              <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative flex items-center justify-center">
                {hub.logo ? (
                  <img src={hub.logo} alt={hub.name} className="absolute bottom-4 left-4 h-14 max-w-[120px] object-contain bg-background/80 p-2 rounded-lg backdrop-blur" />
                ) : (
                  <span className="text-4xl opacity-20 font-bold">{hub.name.charAt(0)}</span>
                )}
              </div>
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-xl line-clamp-1">{hub.name}</h3>
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md w-fit">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium">{hub.productosActivos} productos adquiridos</span>
                  </div>
                </div>
                <Button className="w-full mt-6" asChild>
                  <Link to={`/${hub.slug}/productos`}>Entrar a la Academia</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-card border rounded-2xl shadow-sm">
          <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/30" />
          <h2 className="mt-6 text-2xl font-semibold">Aún no tienes cursos</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Cuando compres o te inscriban en un curso de algún profesor, aparecerá aquí en tu cuenta global.
          </p>
        </div>
      )}
    </div>
  );
}
