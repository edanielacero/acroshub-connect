import { useState } from "react";
import { useAlumnoData } from "@/hooks/useAlumnoData";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CalendarDays, ExternalLink, Receipt, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

export default function AlumnoPagos() {
  const { enrollments, courses, ebooks, hubs, pricingOptions, isLoading } = useAlumnoData();
  const [cancelingProductId, setCancelingProductId] = useState<string | null>(null);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allProducts = [...courses, ...ebooks];
  const activeSubs = enrollments.filter(e => e.access_type === 'subscription' && e.status === 'active');
  const uniquePurchases = enrollments.filter(e => e.access_type === 'lifetime');

  const queryClient = useQueryClient();

  const handleCancelSubscription = async (productId: string) => {
    const enrollment = activeSubs.find(e => e.product_id === productId);
    if (!enrollment) return;

    // Actualizamos la base de datos para simular la cancelación de la suscripción (en una app real interactuaría con Stripe)
    const { error } = await supabase
      .from('enrollments')
      .update({ status: 'canceled' })
      .eq('id', enrollment.id);
      
    if (error) {
      toast.error("Hubo un error al cancelar: " + error.message);
      return;
    }

    toast.success("Tu suscripción ha sido cancelada. Tendrás acceso hasta el final del periodo facturado.");
    setCancelingProductId(null);
    queryClient.invalidateQueries({ queryKey: ['alumno_enrollments', enrollment.alumno_id] });
  };

  return (
    <div className="container py-8 sm:py-12 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <Button variant="ghost" className="mb-4 -ml-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
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
            {activeSubs.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">No tienes ninguna suscripción recurrente activa.</div>
            )}
            
            {activeSubs.map(enrollment => {
              const product = allProducts.find(p => p.id === enrollment.product_id);
              if (!product) return null;
              
              const hub = hubs.find((h: any) => h.id === product.hub_id);
              
              // We don't have exact billing info natively in Supabase yet without Stripe integration, 
              // so we construct a placeholder or use pricing options to guess the amount paid.
              const priceMatch = pricingOptions.find((p: any) => p.product_id === product.id && p.type !== 'one-time');
              const amount = priceMatch ? priceMatch.price : 0;
              const currency = priceMatch ? priceMatch.currency : 'USD';
              const typeLabel = priceMatch?.type === 'annual' ? '/ año' : '/ mes';
              const typeStr = priceMatch?.type === 'annual' ? 'Anual' : 'Mensual';

              let nextBilling = "Por definir";
              if (enrollment.expires_at) {
                nextBilling = new Date(enrollment.expires_at).toLocaleDateString();
              }

              return (
                <div key={enrollment.id} className="py-6 first:pt-2 last:pb-2 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                       <h3 className="font-semibold text-lg">{product.title}</h3>
                       <Badge variant="secondary" className="bg-primary/10 text-primary capitalize font-medium">
                         Facturado {typeStr}
                       </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                       <ExternalLink className="h-3.5 w-3.5" /> <Link to={`/${hub?.slug}`} className="hover:underline">{hub?.name}</Link>
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-sm">
                       <span className="font-bold whitespace-nowrap">${amount} {currency} {typeLabel}</span>
                       <span className="text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" /> Próximo cobro: {nextBilling}
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
          </CardContent>
        </Card>

        {/* Acceso de por vida / Pagos únicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2"><Receipt className="h-4 w-4" /> Compras Únicas (Acceso de por vida)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
               {uniquePurchases.map(enrollment => {
                 const product = allProducts.find(p => p.id === enrollment.product_id);
                 if (!product) return null;
                 
                 return (
                   <div key={enrollment.id} className="p-3 bg-muted/40 rounded-lg border flex flex-col justify-between">
                      <p className="font-medium text-sm line-clamp-2" title={product.title}>{product.title}</p>
                      <Badge variant="outline" className="w-fit mt-3 bg-background">Pago único completado</Badge>
                   </div>
                 );
               })}
            </div>
            {uniquePurchases.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No tienes compras únicas registradas.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
