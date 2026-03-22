import { useState } from "react";
import { getCurrentAlumno, courses, ebooks, hubs } from "@/data/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CalendarDays, ExternalLink, Receipt, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function AlumnoPagos() {
  const alumno = getCurrentAlumno();
  const [cancelingProductId, setCancelingProductId] = useState<string | null>(null);

  // Mapear productos adquiridos
  const allProductsIds = [...alumno.purchasedCourses, ...alumno.purchasedEbooks];
  const allProducts = [...courses, ...ebooks].filter(p => allProductsIds.includes(p.id));

  // Simular la acción de cancelar
  const handleCancelSubscription = (productId: string) => {
    toast.success("Tu suscripción ha sido cancelada. Tendrás acceso hasta el final del periodo facturado.");
    setCancelingProductId(null);
  };

  return (
    <div className="container py-8 sm:py-12 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturación e Historial</h1>
        <p className="text-muted-foreground mt-2">Gestiona tus suscripciones recurrentes y visualiza tus compras en todas las academias.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Suscripciones Activas</CardTitle>
            <CardDescription>Tus productos que requieren pagos recurrentes mensuales o anuales.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {allProducts.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">No tienes ninguna compra registrada.</div>
            )}
            
            {allProducts.map(product => {
              const hub = hubs.find(h => h.id === product.hubId);
              // Verificar si este producto tiene una sub activa
              const activeSub = alumno.activeSubscriptions?.find(s => s.productId === product.id && s.status === 'activa');
              
              if (!activeSub) return null; // Solo renderizar en esta lista los que sí son suscripciones recurrentes 

              return (
                <div key={product.id} className="py-6 first:pt-2 last:pb-2 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                       <h3 className="font-semibold text-lg">{product.title}</h3>
                       <Badge variant="secondary" className="bg-primary/10 text-primary capitalize font-medium">
                         Facturado {activeSub.type}
                       </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                       <ExternalLink className="h-3.5 w-3.5" /> <Link to={`/${hub?.slug}`} className="hover:underline">{hub?.name}</Link>
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-sm">
                       <span className="font-bold whitespace-nowrap">${activeSub.amount} {activeSub.currency} {activeSub.type === 'mensual' ? '/ mes' : '/ año'}</span>
                       <span className="text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" /> Próximo cobro: {new Date(activeSub.nextBilling).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 w-full md:w-auto">
                    {cancelingProductId === product.id ? (
                      <div className="flex flex-col items-center sm:items-end gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-xs text-red-800 font-medium flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> ¿Seguro que deseas cancelar?</p>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button variant="ghost" size="sm" onClick={() => setCancelingProductId(null)}>Atrás</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleCancelSubscription(product.id)}>Confirmar cancelación</Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full md:w-auto text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20" onClick={() => setCancelingProductId(product.id)}>
                        Cancelar suscripción
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* If there are products but none has an active subscription block, tell the user directly */}
            {allProducts.length > 0 && !(alumno.activeSubscriptions?.some(sub => allProducts.some(p => p.id === sub.productId))) && (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg mt-4 hidden last:block">
                No tienes ninguna suscripción recurrente activa en este momento.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acceso de por vida / Pagos únicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2"><Receipt className="h-4 w-4" /> Compras Únicas (Acceso de por vida)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
               {allProducts.filter(p => !alumno.activeSubscriptions?.some(s => s.productId === p.id)).map(product => (
                 <div key={product.id} className="p-3 bg-muted/40 rounded-lg border flex flex-col justify-between">
                    <p className="font-medium text-sm line-clamp-2" title={product.title}>{product.title}</p>
                    <Badge variant="outline" className="w-fit mt-3 bg-background">Pago único completado</Badge>
                 </div>
               ))}
            </div>
            {allProducts.filter(p => !alumno.activeSubscriptions?.some(s => s.productId === p.id)).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No tienes compras únicas registradas.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
