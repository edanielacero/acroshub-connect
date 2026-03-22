import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { hubs, ebooks, getCurrentAlumno, profesores } from "@/data/mockData";
import { usePreview } from "@/components/layout/PreviewProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Lock, CheckCircle, BookOpen, Download } from "lucide-react";
import { toast } from "sonner";

export default function EbookDetalle() {
  const { slug, id } = useParams();
  const hub = hubs.find(h => h.slug === slug);
  const ebook = ebooks.find(e => e.id === id && e.hubId === hub?.id);
  const prof = profesores.find(p => p.id === hub?.profesorId);
  
  const { demoMode, isOwner } = usePreview();
  const alumno = getCurrentAlumno();
  
  const defaultOption = ebook?.pricingOptions && ebook.pricingOptions.length > 0 
    ? ebook.pricingOptions[0].id 
    : 'one_time';
    
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(defaultOption);

  if (!hub || !ebook) return <div className="p-8 text-center border mt-8 rounded-xl max-w-lg mx-auto bg-card">El E-Book no fue encontrado</div>;

  const purchasedEbookIds = alumno.purchasedEbooks || [];
  const hasAccess = isOwner ? (demoMode === 'con-acceso') : purchasedEbookIds.includes(ebook.id);

  const isManualPayment = !prof?.stripeConnected && !!prof?.manualPaymentLink;
  const isUnavailable = !prof?.stripeConnected && !prof?.manualPaymentLink;

  const handleComprar = () => {
    if (isManualPayment && prof?.manualPaymentLink) {
      window.open(prof.manualPaymentLink, '_blank');
    } else {
      toast.success("Redirigiendo a pasarela de pago (Stripe)...");
    }
  };

  // VISTA CON ACCESO (EBOOK VIEWER)
  if (hasAccess) {
    return (
      <div className="animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-center bg-card p-6 rounded-2xl border shadow-sm mt-4">
          <div className="h-32 w-24 shrink-0 bg-green-100 rounded flex items-center justify-center border border-green-200">
            <BookOpen className="h-10 w-10 text-green-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <Badge variant="outline" className="mb-2 text-green-600 border-green-600/20">{ebook.format.toUpperCase()} E-Book</Badge>
            <h1 className="text-3xl font-extrabold">{ebook.title}</h1>
            <p className="text-muted-foreground mt-2">{ebook.description}</p>
          </div>
          <div className="shrink-0 flex items-center justify-center">
             <Button className="gap-2 shrink-0 md:w-auto w-full" size="lg">
                <Download className="h-4 w-4" />
                Descargar Archivo
             </Button>
          </div>
        </div>

        {/* Embedded PDF Viewer Placeholder */}
        <div className="bg-muted shadow-inner rounded-2xl border border-muted-foreground/10 h-[70vh] flex flex-col items-center justify-center text-muted-foreground">
           <BookOpen className="h-16 w-16 mb-4 opacity-50" />
           <p className="font-medium">El lector interactivo de PDF/EPUB se mostraría aquí</p>
           <p className="text-sm mt-2 opacity-70">En la versión funcional, incluiría visor embebido de alta fidelidad.</p>
        </div>
      </div>
    );
  }

  // VISTA SIN ACCESO (SALES PAGE)
  return (
    <div className="animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      {/* Hero del Ebook */}
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Badge className="mb-4 px-3 py-1 font-medium bg-green-100 text-green-700 hover:bg-green-100 cursor-default border-green-200">
            E-Book {ebook.format.toUpperCase()} · {ebook.pages} páginas
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">{ebook.title}</h1>
          <p className="text-xl text-muted-foreground mt-5 leading-relaxed">{ebook.description}</p>
          
          <div className="mt-12 bg-card border rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col items-center justify-center h-80 relative group">
             <div className="absolute inset-0 bg-slate-100" />
             <img 
               src={`https://placehold.co/600x400/16a34a/ffffff?text=${encodeURIComponent(ebook.title)}`} 
               alt={ebook.title} 
               className="w-full h-full object-cover relative z-10 rounded-xl max-w-sm shadow-xl mt-4 group-hover:scale-105 transition-transform duration-500"
             />
          </div>
        </div>
        
        {/* Card de compra (sticky) */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 shadow-xl border-green-600/20 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-green-600 to-green-600/50 w-full" />
            <CardContent className="p-6">
              <h3 className="font-bold text-xl mb-6">Obtener E-Book</h3>
              
              {/* Opciones de precio */}
              <RadioGroup value={opcionSeleccionada} onValueChange={setOpcionSeleccionada} className="space-y-3">
                {ebook.pricingOptions && ebook.pricingOptions.length > 0 ? (
                  ebook.pricingOptions.map(option => (
                    <div key={option.id} className={`flex items-start space-x-3 border rounded-xl p-4 cursor-pointer transition-all ${opcionSeleccionada === option.id ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'hover:bg-muted/50 border-muted-foreground/20'}`} onClick={() => setOpcionSeleccionada(option.id)}>
                      <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <div className="font-semibold text-base">
                          {option.type === 'one_time' ? 'Pago único' : option.type === 'monthly' ? 'Suscripción Mensual' : 'Suscripción Anual'}
                        </div>
                        <div className="text-3xl font-extrabold mt-1 text-green-600">
                          ${option.price} <span className="text-sm font-normal text-muted-foreground">{ebook.currency}{option.type !== 'one_time' ? (option.type === 'monthly' ? '/mes' : '/año') : ''}</span>
                        </div>
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className={`flex items-start space-x-3 border rounded-xl p-4 cursor-pointer transition-all ${opcionSeleccionada === 'one_time' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50 border-muted-foreground/20'}`} onClick={() => setOpcionSeleccionada('one_time')}>
                    <RadioGroupItem value="one_time" id="one_time" className="mt-1" />
                    <Label htmlFor="one_time" className="flex-1 cursor-pointer">
                      <div className="font-semibold text-base">Pago único</div>
                      <div className="text-3xl font-extrabold mt-1 text-primary">${ebook.price} <span className="text-sm font-normal text-muted-foreground">{ebook.currency}</span></div>
                      <div className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" /> Descarga instantánea
                      </div>
                    </Label>
                  </div>
                )}
              </RadioGroup>
              
              {isUnavailable ? (
                <div className="mt-8 p-4 bg-muted/50 rounded-xl text-center border border-muted-foreground/10">
                  <p className="font-semibold text-muted-foreground">Contactar al Profesor para Comprar</p>
                </div>
              ) : (
                <>
                  <Button className="w-full mt-6 h-12 text-base font-bold shadow-md" size="lg" onClick={handleComprar}>
                    {isManualPayment ? 'Contactar para comprar' : 'Comprar ahora'}
                  </Button>
                  
                  <div className="mt-4 pt-4 border-t text-center space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                      <Lock className="h-3 w-3" /> {isManualPayment ? 'Pago acordado directo con experto' : 'Pago seguro con Stripe'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isManualPayment ? 'El acceso se brindará manualmente' : 'Entrega inmediata garantizada'}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
