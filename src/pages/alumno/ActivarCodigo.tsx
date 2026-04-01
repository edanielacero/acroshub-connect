import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useActivateMagicCode, ActivateCodeResponse } from "@/hooks/useActivateMagicCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Loader2, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";

export default function ActivarCodigo() {
  const navigate = useNavigate();
  const activateMutation = useActivateMagicCode();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState("");
  const [errorInput, setErrorInput] = useState<string | null>(null);
  const [activationResult, setActivationResult] = useState<ActivateCodeResponse | null>(null);

  // --- Paso 1: Manejo del input ---
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo letras mayúsculas y números, quitar O,0,I,1,L si queremos ser estrictos (pero backend también lo rechazaría).
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Auto-formato de guiones (Ej: ABC-123)
    if (value.length > 3) {
      value = value.slice(0, 3) + '-' + value.slice(3, 6);
    }
    setCode(value);
    
    // Limpiar errores previos si vuelve a escribir
    if (errorInput) setErrorInput(null);
  };

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.replace('-', '').length !== 6) {
      setErrorInput("El código debe tener 6 caracteres");
      return;
    }

    try {
      const res = await activateMutation.mutateAsync(code);
      setActivationResult(res);
      setStep(2); // Avanzamos a Paso 2 (Confirmación indirecta saltada para activar en un clic)
    } catch (err: any) {
      setErrorInput(err.message || "Código inválido");
    }
  };

  // --- Renderizado Múltiple por Pasos ---
  
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col relative">
      <div className="max-w-xl mx-auto py-12 px-4 animate-fade-in relative z-10 w-full">
        
        {/* Paso 1: Ingresar Código */}
        {step === 1 && (
          <Card className="border shadow-lg shadow-primary/5 overflow-hidden">
             {/* Header decorativo bg */}
             <div className="bg-gradient-to-r from-primary/[0.15] to-primary/5 h-2 w-full" />
             <div className="p-8 text-center space-y-6">
               <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
                 <Sparkles className="h-8 w-8" />
               </div>
               
               <div>
                  <h1 className="text-2xl font-bold tracking-tight mb-2">Activar con código</h1>
                  <p className="text-muted-foreground">
                    Ingresa el código mágico que te compartió tu profesor para desbloquear tu acceso.
                  </p>
               </div>
               
               <form onSubmit={handleValidateCode} className="space-y-6 max-w-sm mx-auto">
                 <div className="space-y-2">
                    <Input 
                      placeholder="ABC-123" 
                      value={code}
                      onChange={handleCodeChange}
                      className="text-center text-3xl font-mono py-8 tracking-[0.3em] font-bold uppercase transition-all"
                      maxLength={7}
                      disabled={activateMutation.isPending}
                      autoFocus
                    />
                    {errorInput && (
                      <div className="flex items-center justify-center gap-2 text-destructive text-sm font-medium mt-2 animate-in slide-in-from-top-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errorInput}</span>
                      </div>
                    )}
                 </div>

                 <Button 
                    type="submit" 
                    className="w-full py-6 text-lg" 
                    disabled={code.replace('-', '').length !== 6 || activateMutation.isPending}
                  >
                   {activateMutation.isPending ? (
                     <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Activando...</>
                   ) : "Comprobar y Activar"}
                 </Button>
               </form>
               
               <div className="pt-4 mt-8 border-t">
                 <Button variant="ghost" asChild className="text-muted-foreground w-full">
                   <Link to="/mi-cuenta">
                     <ArrowLeft className="h-4 w-4 mr-2" /> Volver a mis cursos
                   </Link>
                 </Button>
               </div>
             </div>
          </Card>
        )}

        {/* Paso 2: Éxito Automático (Se activa en el backend inmediatamente) */}
        {step === 2 && activationResult && (
          <Card className="border shadow-xl shadow-emerald-500/10 overflow-hidden relative border-emerald-500/30">
             <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
             <div className="p-8 text-center space-y-8 relative">
               <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                 <CheckCircle2 className="h-10 w-10" />
               </div>
               
               <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-emerald-900 dark:text-emerald-400">¡Acceso concedido!</h1>
                  <p className="text-muted-foreground text-lg">
                    Has activado tu inscripción exitosamente.
                  </p>
               </div>
               
               <div className="bg-card border shadow-sm rounded-xl p-6 max-w-sm mx-auto flex flex-col gap-3">
                 <div className="flex items-start gap-4 text-left">
                   <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                     <BookOpen className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                     <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                       {activationResult.product_type === 'course' ? 'Curso Desbloqueado' : 'Ebook Desbloqueado'}
                     </p>
                     <h3 className="font-bold text-lg leading-tight">{activationResult.product_title}</h3>
                   </div>
                 </div>
                 
                 <div className="bg-muted/50 rounded-lg p-3 text-sm flex justify-between mt-2 border border-muted">
                    <span className="text-muted-foreground">Acceso:</span>
                    <span className="font-semibold text-foreground uppercase tracking-wider">
                       {activationResult.payment_type === 'one-time' ? 'Permanente a perpetuidad' : 
                        activationResult.payment_type === 'annual' ? 'Suscripción Anual' : 
                        activationResult.payment_type === 'monthly' ? 'Suscripción Mensual' : 
                        'Garantizado'}
                    </span>
                 </div>
               </div>

               <div className="max-w-sm mx-auto space-y-3 pt-4">
                 <Button 
                   className="w-full py-6 text-lg bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-md"
                   onClick={() => {
                      if (activationResult.hub_slug) {
                        navigate(`/${activationResult.hub_slug}`);
                      } else {
                        navigate('/mi-cuenta');
                      }
                   }}
                 >
                   Ir a mi panel educativo
                 </Button>
               </div>
             </div>
          </Card>
        )}

      </div>

      {/* Background Decorativo */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full mix-blend-multiply" />
      </div>
    </div>
  );
}
