import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { useMagicCodes, useRegenerateMagicCodes } from "@/hooks/useMagicCodes";
import { useMagicCodesHistory } from "@/hooks/useMagicCodesHistory";
import { useProfesorData } from "@/hooks/useProfesorData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Sparkles, Copy, Check, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatDateProject, cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// --- Subcomponente: CodigoCard ---
function CodigoCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const displayCode = `${code.slice(0, 3)}-${code.slice(3)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch(err) {
      toast.error('Error al copiar el código');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all group',
        'hover:border-primary hover:bg-primary/5',
        copied ? 'border-primary bg-primary/10' : 'border-border bg-card'
      )}
    >
      <span className="font-mono text-xl font-bold tracking-[0.2em] text-foreground">
        {displayCode}
      </span>
      <span className={cn(
        "text-xs font-medium flex items-center gap-1.5 transition-colors",
        copied ? "text-primary" : "text-muted-foreground group-hover:text-primary"
      )}>
        {copied ? (
          <><Check className="h-3.5 w-3.5" /> Copiado</>
        ) : (
          <><Copy className="h-3.5 w-3.5" /> Copiar</>
        )}
      </span>
    </button>
  );
}

// --- Subcomponente: Historial paginado ---
function CodigosHistorial({ productId }: { productId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMagicCodesHistory(productId, page, 5);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando historial...</div>;
  if (isError) return <div className="p-8 text-center text-destructive">Error al cargar historial</div>;

  const historyData = data?.data || [];
  const pagination = data?.pagination;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Historial de Códigos Usados</CardTitle>
        <CardDescription>Alumnos que han activado este producto usando un código mágico.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {historyData.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground text-center bg-muted/20">
            Aún no hay códigos usados para este producto.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan de Pago</TableHead>
                  <TableHead>Monto Base</TableHead>
                  <TableHead>Fecha de Uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono font-medium tracking-wide">
                      {item.code.slice(0, 3)}-{item.code.slice(3)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link to={`/dashboard/alumnos/${item.student.id}`} className="hover:underline hover:text-primary transition-colors">
                        {item.student.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.student.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.payment_type === 'one-time' ? 'Pago Único' : 
                         item.payment_type === 'monthly' ? 'Mensual' : 
                         item.payment_type === 'annual' ? 'Anual' : item.payment_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      ${item.amount} {item.currency}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateProject(item.used_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
                <p className="text-sm text-muted-foreground">
                  Página {pagination.page} de {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                  </Button>
                  <Button 
                    variant="outline" size="sm"
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


// --- Main Page Component ---
export default function ProfesorCodigosMagicos() {
  const { type, id } = useParams<{ type: 'course' | 'ebook', id: string }>();
  
  const { courses, ebooks, isLoading: isLoadingProfData } = useProfesorData();
  const product = type === 'course' 
    ? courses.find(c => c.id === id) 
    : ebooks.find(e => e.id === id);

  const { data: magicCodes, isLoading: isLoadingCodes, isError } = useMagicCodes(id || '', type as 'course'|'ebook');
  const regenerateMutation = useRegenerateMagicCodes(id || '', type as 'course'|'ebook');

  if (isLoadingProfData || isLoadingCodes) {
    return (
      <ProfesorLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <p className="text-muted-foreground">Generando códigos mágicos...</p>
          </div>
        </div>
      </ProfesorLayout>
    );
  }

  if (!product || isError) {
    return (
      <ProfesorLayout>
        <div className="p-8 text-center text-destructive flex flex-col items-center gap-4">
          <AlertCircle className="h-10 w-10" />
          <h2 className="text-2xl font-bold">Producto no encontrado o error</h2>
          <Button onClick={() => window.history.back()}>Volver</Button>
        </div>
      </ProfesorLayout>
    );
  }

  const handleRegenerate = async (paymentType: 'one-time'|'monthly'|'annual') => {
    try {
      await regenerateMutation.mutateAsync(paymentType);
      toast.success("Códigos regenerados y actualizados.");
    } catch (err: any) {
      toast.error(err.message || 'Error al regenerar los códigos');
    }
  };

  const renderCodesSection = (title: string, codes: any[], paymentType: 'one-time'|'monthly'|'annual', price: number, currency: string) => {
    if (!codes || codes.length === 0) return null; // No registered pricing option
    
    return (
       <Card className="border-primary/20 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
          <CardHeader className="pb-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {title} 
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">
                  ${price} {currency}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {paymentType === 'one-time' ? 'Acceso permanente' : 'Renovación automática (Suscripción)'}
              </CardDescription>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0 text-muted-foreground hover:text-destructive">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar Bloque
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Regenerar los 5 códigos?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto descartará los {codes.length} códigos disponibles actualmente en este tipo de pago y generará otros nuevos. 
                    <br/><br/>
                    <strong>Nota:</strong> Los códigos que los alumnos ya hayan canjeado seguirán funcionando y mantendrán su acceso.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleRegenerate(paymentType)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Regenerar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {codes.map(c => (
                <CodigoCard key={c.id} code={c.code} />
              ))}
            </div>
          </CardContent>
       </Card>
    );
  };

  return (
    <ProfesorLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b pb-6">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link to={type === 'course' ? "/dashboard/hubs" : "/dashboard/hubs"}>
               {/* Note: In a real flow, a better back button might go to the exact hub inventory */}
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Códigos Mágicos</h1>
            </div>
            <p className="text-muted-foreground flex items-center gap-1.5 font-medium">
              Producto: <span className="text-foreground">{product.title}</span> 
              <Badge variant="secondary" className="ml-2 uppercase text-[10px]">{type === 'course' ? 'Curso' : 'Ebook'}</Badge>
            </p>
          </div>
        </div>

        {/* Explain Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-primary-900 shadow-sm leading-relaxed">
          <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            ¿Qué son los códigos mágicos?
          </h3>
          <p className="text-sm opacity-90 mb-3 text-foreground/80">
            Comparte un código exclusivo con tu alumno para otorgarle acceso instantáneo al producto. Ideal para pagos en efectivo, transferencias directas o inscripciones manuales.
          </p>
          <ul className="text-sm space-y-1 text-foreground/80 list-disc list-inside">
            <li>Cada código es de <strong>un solo uso</strong>.</li>
            <li>En cuanto el alumno usa uno, <strong>se genera otro automáticamente</strong> en el sistema.</li>
            <li>Siempre tendrás exactamente 5 códigos listos por cada método de pago configurado.</li>
          </ul>
        </div>

        {/* Dynamic Blocks */}
        <div className="space-y-6">
          {magicCodes?.one_time.length ? renderCodesSection("Pago Único", magicCodes.one_time, 'one-time', magicCodes.one_time[0].amount, magicCodes.one_time[0].currency) : null}
          {magicCodes?.monthly.length ? renderCodesSection("Suscripción Mensual", magicCodes.monthly, 'monthly', magicCodes.monthly[0].amount, magicCodes.monthly[0].currency) : null}
          {magicCodes?.annual.length ? renderCodesSection("Suscripción Anual", magicCodes.annual, 'annual', magicCodes.annual[0].amount, magicCodes.annual[0].currency) : null}

          {(!magicCodes?.one_time.length && !magicCodes?.monthly.length && !magicCodes?.annual.length) && (
             <div className="text-center p-12 border-2 border-dashed rounded-xl bg-muted/20">
               <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
               <h3 className="text-lg font-semibold">No hay opciones de precio</h3>
               <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                 Este producto no tiene configuradas opciones de precio de pago (único, mensual, anual). 
                 Ve a editar el producto y añade precios para poder generar códigos mágicos.
               </p>
               <Button className="mt-6" asChild>
                 <Link to={`/dashboard/${type === 'course' ? 'cursos' : 'ebooks'}/${id}`}>
                   Ir a editar {type === 'course' ? 'curso' : 'ebook'}
                 </Link>
               </Button>
             </div>
          )}
        </div>

        {/* History Table */}
        <CodigosHistorial productId={id || ''} />

      </div>
    </ProfesorLayout>
  );
}
