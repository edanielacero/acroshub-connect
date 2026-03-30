import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useAlumnoData } from "@/hooks/useAlumnoData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, Lock, BookOpen, Loader2, GraduationCap, Compass } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { usePreview } from "@/components/layout/PreviewProvider";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Tab = 'mis-productos' | 'mas-cursos';

export default function HubProductos() {
  const { hub } = useOutletContext<{ hub: any }>();
  const { demoMode, isOwner } = usePreview();
  const { enrollments } = useAlumnoData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('mis-productos');

  if (!hub) return null;

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

  const courseIds = hubCourses.map(c => c.id);

  const { data: allHubLessons = [], isLoading: loadingL } = useQuery({
    queryKey: ['hubAllLessons', courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data: mData } = await supabase.from('modules').select('id, course_id').in('course_id', courseIds);
      if (!mData || mData.length === 0) return [];
      const { data: lData } = await supabase.from('lessons').select('id, module_id').in('module_id', mData.map(m=>m.id));
      return (lData || []).map(l => {
        const mod = mData.find(m => m.id === l.module_id);
        return { id: l.id, course_id: mod?.course_id };
      });
    },
    enabled: courseIds.length > 0
  });

  const { data: userProgress = [], isLoading: loadingProg } = useQuery({
    queryKey: ['hubProgress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from('lesson_progress').select('lesson_id, completed').eq('user_id', user.id).eq('completed', true);
      return data || [];
    },
    enabled: !!user?.id
  });

  if (loadingC || loadingE || loadingL || loadingProg || (productIds.length > 0 && loadingP)) {
    return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const hasAccess = (p: any) => {
    if (isOwner) return demoMode === 'con-acceso';
    return enrollments.some(e => e.product_id === p.id && e.status === 'active');
  };

  const productosConAcceso = allProducts.filter(hasAccess);
  const productosSinAcceso = allProducts.filter(p => !hasAccess(p));

  const getProgress = (courseId: string) => {
    const courseLessons = allHubLessons.filter((l: any) => l.course_id === courseId);
    if (courseLessons.length === 0) return 0;
    const completedCount = courseLessons.filter((l: any) =>
      userProgress.some((p: any) => p.lesson_id === l.id && p.completed)
    ).length;
    return Math.round((completedCount / courseLessons.length) * 100);
  };

  const getAccesoText = (productId: string) => {
    if (isOwner && demoMode === 'con-acceso') return "Acceso de por vida (Vista Previa)";
    const enrollment = enrollments.find(e => e.product_id === productId && e.status === 'active');
    if (!enrollment) return "Sin acceso";
    if (!enrollment.expires_at) return "Acceso de por vida";
    return `Acceso hasta el ${format(new Date(enrollment.expires_at), "d 'de' MMMM, yyyy", { locale: es })}`;
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'mis-productos', label: 'Mis Cursos / Ebooks', icon: <GraduationCap className="h-4 w-4" />, count: productosConAcceso.length },
    { id: 'mas-cursos', label: 'Más Cursos', icon: <Compass className="h-4 w-4" />, count: productosSinAcceso.length },
  ];

  return (
    <div className="animate-fade-in flex flex-col container mx-auto px-4 sm:px-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit mt-2 mb-8 border border-border/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[11px] font-bold ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Mis Productos */}
      {activeTab === 'mis-productos' && (
        <section className="animate-fade-in">
          {productosConAcceso.length === 0 ? (
            <div className="text-center py-20 border rounded-2xl bg-card border-dashed">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold">Aún no tienes productos</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Cuando obtengas acceso a un curso o E-Book, aparecerá aquí.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => setActiveTab('mas-cursos')}>
                Explorar productos disponibles
              </Button>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productosConAcceso.map(product => {
                const isCourse = product.productType === 'course';
                const progreso = isCourse ? getProgress(product.id) : 0;

                return (
                  <Card key={product.id} className="overflow-hidden hover:-translate-y-1 transition-transform hover:shadow-lg group flex flex-col">
                    <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      <img
                        src={(isCourse ? product.thumbnail_url : product.cover_url) || `https://placehold.co/600x400/${isCourse ? '2563eb' : '16a34a'}/ffffff?text=${encodeURIComponent(product.title)}`}
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

                        <p className="text-xs text-muted-foreground mt-3">{getAccesoText(product.id)}</p>
                      </div>

                      <Button className="w-full mt-6 shadow-sm" asChild>
                        <Link to={`/${hub?.slug}/${isCourse ? 'curso' : 'ebook'}/${product.id}`}>
                          {isCourse ? 'Continuar aprendiendo' : 'Leer E-Book'}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Tab: Más Cursos */}
      {activeTab === 'mas-cursos' && (
        <section className="animate-fade-in">
          {productosSinAcceso.length === 0 ? (
            <div className="text-center py-20 border rounded-2xl bg-card border-dashed">
              <Compass className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold">¡Ya tienes acceso a todo!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No hay más productos disponibles en esta academia por ahora.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productosSinAcceso.map(product => {
                const isCourse = product.productType === 'course';
                const lowestPrice = pricingOptions
                  .filter((p: any) => p.product_id === product.id)
                  .sort((a: any, b: any) => a.price - b.price)[0];

                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-md transition-all group hover:-translate-y-1 bg-gradient-to-br from-card to-muted/5 border-muted flex flex-col">
                    <div className="h-36 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                      <img
                        src={(isCourse ? product.thumbnail_url : product.cover_url) || `https://placehold.co/600x400/${isCourse ? '2563eb' : '16a34a'}/ffffff?text=${encodeURIComponent(product.title)}`}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/5" />
                    </div>

                    <CardContent className="p-5 flex flex-col flex-1">
                      {isCourse ? (
                        <Badge variant="secondary" className="w-fit mb-3 font-medium bg-primary/10 text-primary hover:bg-primary/20">Curso disponible</Badge>
                      ) : (
                        <Badge variant="secondary" className="w-fit mb-3 font-medium bg-green-100 text-green-700 hover:bg-green-200">E-Book disponible</Badge>
                      )}

                      <h3 className="font-bold text-base line-clamp-2 leading-tight flex-1">{product.title}</h3>

                      <div className="mt-4 pt-4 border-t border-muted/50">
                        <p className="text-xl font-extrabold text-primary">
                          {lowestPrice ? `$${lowestPrice.price}` : 'Gratis'}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            {lowestPrice ? lowestPrice.currency || 'USD' : ''}
                          </span>
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
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
