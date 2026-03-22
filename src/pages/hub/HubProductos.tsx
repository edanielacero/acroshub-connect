import { Link, useOutletContext } from "react-router-dom";
import { getCurrentAlumno } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShoppingBag, PlayCircle, Lock, BookOpen, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { usePreview } from "@/components/layout/PreviewProvider";

export default function HubProductos() {
  const { hub } = useOutletContext<{ hub: any }>();
  const { demoMode, isOwner } = usePreview();
  const alumno = getCurrentAlumno();
  if (!hub || !alumno) return null;

  const { data: hubCourses = [], isLoading: loadingC } = useQuery({
    queryKey: ['hubCourses', hub?.id],
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('*').eq('hub_id', hub.id);
      return (data || []).map(c => ({ ...c, productType: 'course' as 'course' }));
    },
    enabled: !!hub?.id
  });

  const { data: hubEbooks = [], isLoading: loadingE } = useQuery({
    queryKey: ['hubEbooks', hub?.id],
    queryFn: async () => {
      const { data } = await supabase.from('ebooks').select('*').eq('hub_id', hub.id);
      return (data || []).map(e => ({ ...e, productType: 'ebook' as 'ebook' }));
    },
    enabled: !!hub?.id
  });

  const allProducts = [...hubCourses, ...hubEbooks];
  const productIds = allProducts.map(p => p.id);

  const { data: pricingOptions = [], isLoading: loadingP } = useQuery({
    queryKey: ['hubPricing', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data } = await supabase.from('pricing_options').select('*').in('product_id', productIds);
      return data || [];
    },
    enabled: productIds.length > 0
  });

  if (loadingC || loadingE || (productIds.length > 0 && loadingP)) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  
  const hasAccess = (p: any) => {
    if (isOwner) return demoMode === 'con-acceso';
    if (p.productType === 'course') return alumno.purchasedCourses?.includes(p.id);
    return alumno.purchasedEbooks?.includes(p.id);
  };
  
  const productosConAcceso = allProducts.filter(hasAccess);
  const productosSinAcceso = allProducts.filter(p => !hasAccess(p));

  // Helper to calculate progress
  const getProgress = (courseId: string) => {
    return 0; // Implement DB-level progress matching later if needed
  };

  return (
    <div className="animate-fade-in flex flex-col container mx-auto px-4 sm:px-6">
      <div className="space-y-16 mt-2">
        
        {/* Mis Productos */}
        {productosConAcceso.length > 0 && (
          <section>
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">Mis productos</h1>
              <p className="text-muted-foreground mt-1">Continúa aprendiendo donde lo dejaste.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productosConAcceso.map(product => {
                const isCourse = product.productType === 'course';
                const progreso = isCourse ? getProgress(product.id) : 0;
                
                return (
                <Card key={product.id} className="overflow-hidden hover:-translate-y-1 transition-transform hover:shadow-lg group flex flex-col">
                  <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    <img 
                      src={`https://placehold.co/600x400/${isCourse ? '2563eb' : '16a34a'}/ffffff?text=${encodeURIComponent(product.title)}`} 
                      alt={product.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
                    {isCourse ? (
                      <PlayCircle className="h-10 w-10 text-white/80 absolute shadow-sm" />
                    ) : (
                      <BookOpen className="h-10 w-10 text-white/80 absolute shadow-sm" />
                    )}
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {isCourse ? (
                        <Badge variant="outline" className="mb-3 font-medium bg-background text-primary border-primary/20">Curso</Badge>
                      ) : (
                        <Badge variant="outline" className="mb-3 font-medium bg-background text-green-600 border-green-600/20">E-Book</Badge>
                      )}
                      <h3 className="font-bold text-lg line-clamp-2 leading-snug">{product.title}</h3>
                      
                      {/* Progreso (solo para cursos) */}
                      {isCourse ? (
                        <div className="mt-5 bg-muted/30 p-3 rounded-lg border border-muted/50">
                          <div className="flex justify-between text-xs text-muted-foreground mb-2 font-medium">
                            <span>Progreso general</span>
                            <span className={progreso === 100 ? "text-green-600 font-bold" : "text-primary"}>{progreso}%</span>
                          </div>
                          <Progress value={progreso} className="h-2" />
                        </div>
                      ) : (
                        <div className="mt-5 bg-muted/30 p-3 rounded-lg border border-muted/50">
                          <div className="text-xs font-medium text-muted-foreground">
                            Formato: {(product as any).format?.toUpperCase() || 'PDF'} • {(product as any).pages || '?'} páginas
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-3">
                        Acceso de por vida
                      </p>
                    </div>
                    
                    <Button className="w-full mt-6 shadow-sm" asChild>
                      <Link to={`/${hub?.slug}/${isCourse ? 'curso' : 'ebook'}/${product.id}`}>
                        {isCourse ? 'Continuar aprendiendo' : 'Leer E-Book'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )})}
            </div>
          </section>
        )}

        {/* Productos que te pueden interesar */}
        {productosSinAcceso.length > 0 && (
          <section className="pt-8 border-t">
            <div className="mb-6 flex flex-col gap-1">
              <h2 className="text-2xl font-bold tracking-tight">Productos que te pueden interesar</h2>
              <p className="text-muted-foreground">Explora otros programas educativos que ofrece esta academia.</p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productosSinAcceso.map(product => {
                const isCourse = product.productType === 'course';
                
                return (
                <Card key={product.id} className="overflow-hidden hover:shadow-md transition-all group hover:-translate-y-1 bg-gradient-to-br from-card to-muted/5 border-muted flex flex-col">
                  <div className="h-36 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={`https://placehold.co/600x400/${isCourse ? '2563eb' : '16a34a'}/ffffff?text=${encodeURIComponent(product.title)}`} 
                      alt={product.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/5" />
                  </div>
                  
                  <CardContent className="p-5 flex flex-col h-[calc(100%-9rem)] flex-1">
                    {isCourse ? (
                      <Badge variant="secondary" className="w-fit mb-3 font-medium bg-primary/10 text-primary hover:bg-primary/20">Curso disponible</Badge>
                    ) : (
                      <Badge variant="secondary" className="w-fit mb-3 font-medium bg-green-100 text-green-700 hover:bg-green-200">E-Book disponible</Badge>
                    )}
                    
                    <h3 className="font-bold text-base line-clamp-2 leading-tight flex-1">{product.title}</h3>
                    
                    <div className="mt-4 pt-4 border-t border-muted/50 space-y-1">
                      <p className="text-xl font-extrabold text-primary">
                        ${pricingOptions.filter((p: any) => p.product_id === product.id).sort((a: any, b: any) => a.price - b.price)[0]?.price || 0} 
                        <span className="text-xs font-normal text-muted-foreground ml-1">USD</span>
                      </p>
                    </div>
                    
                    <Button variant="outline" className="w-full mt-5 bg-background hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-300" asChild>
                      <Link to={`/${hub?.slug}/${isCourse ? 'curso' : 'ebook'}/${product.id}`}>
                        <Lock className="h-3.5 w-3.5 mr-2 opacity-70" />
                        Ver detalles
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )})}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
