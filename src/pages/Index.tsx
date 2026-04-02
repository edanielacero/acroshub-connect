import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { DollarSign, Shield, Zap, ArrowRight, CheckCircle, XCircle, Star, Globe, Users, PlayCircle, Calculator, Table as TableIcon } from "lucide-react";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface PlanConfig {
  key: string;
  name: string;
  price: number;
  price_annual: number;
  max_students: number;
  max_courses: number;
}

// ─── Data & Constants ───────────────────────────────────────────────────────
const stats = [
  { value: "+15", label: "Países activos", icon: Globe },
  { value: "4.9/5", label: "Reseñas positivas", icon: Star },
  { value: "+3,200", label: "Cursos publicados", icon: PlayCircle },
  { value: "$0", label: "Comisiones cobradas", icon: DollarSign },
];

const features = [
  { 
    icon: DollarSign, 
    title: "100% de tus ganancias", 
    description: "No cobramos comisiones por tus ventas. Si vendes $100, recibes $100 directo a tu cuenta bancaria." 
  },
  { 
    icon: Zap, 
    title: "Cobros inmediatos", 
    description: "No retenemos tu dinero por 15 o 30 días. Tu dinero llega al instante a tu cuenta bancaria." 
  },
  { 
    icon: Shield, 
    title: "Videos protegidos y rápidos", 
    description: "Alojamiento Premium (CDN Global). Tus videos cargan al instante y no pueden ser descargados fácilmente." 
  },
  {
    icon: Users,
    title: "Control total de alumnos",
    description: "Tú decides quién entra, quién sale, y tienes acceso a todos los datos de contacto de tu comunidad."
  }
];

const testimonials = [
  {
    name: "Carlos Martínez",
    role: "Profesor de Finanzas",
    avatar: "CM",
    text: "Antes usaba Hotmart y dejaba casi el 10% de mis ventas en comisiones. Al migrar a Acroshub, incrementé mis ingresos netos el primer mes. Todo llega estructurado y sin sorpresas.",
  },
  {
    name: "Laura Gómez",
    role: "Coach en Nutrición",
    avatar: "LG",
    text: "Estaba pagando $99/mes en otras plataformas desde el día 1 con una comunidad de apenas 5 personas. Acroshub me dio margen de respiro para arrancar.",
  },
  {
    name: "David Ruiz",
    role: "Creador Digital",
    avatar: "DR",
    text: "El control absoluto sobre los cobros y la presentación visual le da un toque premium a mis infoproductos que no había logrado replicar en otro lado.",
  },
  {
    name: "Ana Silva",
    role: "Instructora de Yoga",
    avatar: "AS",
    text: "Quería una plataforma limpia, que no me cobrara peajes por cada suscripción. La transición fue ridículamente rápida de hacer y organizar.",
  },
  {
    name: "Mateo Pérez",
    role: "Experto en IA",
    avatar: "MP",
    text: "Mi antiguo proveedor me retenía los fondos por 30 días. Con Acroshub, vendo una masterclass e inmediatamente tengo los fondos líquidos para reinvertir en ads.",
  },
  {
    name: "Sofía Castro",
    role: "Profesora de Idiomas",
    avatar: "SC",
    text: "Mis estudiantes amaron la experiencia desde que inician sesión. Cero distracciones con publicidad de otros cursos como pasaba antes, todo el foco es en mi contenido.",
  },
  {
    name: "Javier Vargas",
    role: "Músico Profesional",
    avatar: "JV",
    text: "La libertad de empezar sin costos iniciales fuertes hizo la diferencia. Hoy opero una academia de guitarra que escala de verdad, mi dinero es mío cien por ciento.",
  }
];

const flags = ["🇪🇸", "🇲🇽", "🇨🇴", "🇦🇷", "🇨🇱", "🇵🇪", "🇪🇨", "🇺🇸", "🇺🇾", "🇵🇦", "🇩🇴"];

// ─── Page Component ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  // Calculator State
  const [ventasMensuales, setVentasMensuales] = useState<number>(100);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);

  // Auto-play animation for the calculator slider (Fluida y ascendente a 60fps)
  useEffect(() => {
    if (!autoPlay) return;
    
    // Incrementos minúsculos para que se lean tranquilamente los números subir
    const interval = setInterval(() => {
      setVentasMensuales(prev => {
        if (prev >= 10000) return 100;
        return prev + 3; // Muy lento, excelente para leer.
      });
    }, 16); // ~60fps
    return () => clearInterval(interval);
  }, [autoPlay]);

  // Calcula comisiones
  const ticketPromedio = 50;
  const transaccionesEstimadas = Math.ceil(ventasMensuales / ticketPromedio);
  
  const costoSkoolHobby = 9 + (ventasMensuales * 0.10); // $9 al mes + 10%
  const costoSkoolPro = 99 + (ventasMensuales * 0.029); // $99 al mes + 2.9%
  const costoHotmart = (ventasMensuales * 0.099) + (transaccionesEstimadas * 0.50);
  
  // Acroshub costo gradual según las ventas mensuales
  let planSugeridoName = "Gratis";
  let costoAcroshub = 0;
  
  if (ventasMensuales > 400) {
    costoAcroshub = plans['basico'] ? plans['basico'].price : 39;
    planSugeridoName = "Básico";
  }
  if (ventasMensuales >= 3000) {
    costoAcroshub = plans['pro'] ? plans['pro'].price : 79;
    planSugeridoName = "Pro";
  }
  if (ventasMensuales >= 7000) {
    costoAcroshub = plans['premium'] ? plans['premium'].price : 149;
    planSugeridoName = "Premium";
  }
  
  const maxCosto = Math.max(costoSkoolHobby, costoSkoolPro, costoHotmart, costoAcroshub, 1);
  
  // Lógica de color infográfico independiente para cada competidor según su crueldad en cobro ($)
  const getDynamicColorClasses = (costo: number) => {
    if (costo < 100) {
      return { bar: "bg-yellow-400 opacity-90", text: "text-foreground" };
    } else if (costo <= 300) {
      return { bar: "bg-orange-400 opacity-90", text: "text-orange-600" };
    } else {
      return { bar: "bg-red-500 opacity-90", text: "text-red-600 transition-colors duration-300" };
    }
  };

  useEffect(() => {
    async function fetchPlans() {
      // Fetch all plans to have a tiered structure for the calculator
      const { data } = await supabase
        .from('plan_configs')
        .select('*');
      
      if (data) {
        const planMap: Record<string, PlanConfig> = {};
        data.forEach(p => planMap[p.key] = p);
        setPlans(planMap);
      }
      setLoadingPlans(false);
    }
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden selection:bg-primary/20">
      <PublicHeader />

      {/* ─── Hero Section ─── */}
      <section className="relative pt-16 pb-12 md:pt-24 md:pb-16 lg:pt-28 lg:pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-x-0 top-0 -z-10 h-[1000px] overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -z-10 opacity-30 transform-gpu blur-3xl" aria-hidden="true">
            <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary to-accent opacity-30" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
          </div>
        </div>

        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4 py-1.5 px-4 text-sm rounded-full bg-primary/5 text-primary border-primary/20 animate-fade-in">
              🚀 La forma más inteligente de escalar online
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in [animation-delay:100ms] text-balance">
              Deja de regalar tus ganancias a las <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">"plataformas gratuitas"</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in [animation-delay:200ms] leading-relaxed">
              Acroshub es la Academia definitiva para tus cursos online. Cobra directo a tu banco sin que toquemos un céntimo de tus ventas. Lanza, vende y escala tu comunidad.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in [animation-delay:300ms]">
              <Button size="lg" asChild className="h-14 px-8 text-base shadow-xl shadow-primary/20 rounded-full group">
                <Link to="/register">
                  Registrarse para probar gratis <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground animate-fade-in [animation-delay:400ms]">
              Sin tarjeta de crédito. Lanza tu primer curso hoy.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Social Proof & Flags ─── */}
      <section className="py-8 border-y bg-muted/20 overflow-hidden">
        <div className="container px-4 mb-6">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6">
            Educadores globales confían en nuestra infraestructura
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-1">
                <h4 className="text-2xl font-black">{stat.value}</h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee Flags */}
        <div className="relative flex overflow-x-hidden w-full max-w-5xl mx-auto py-2">
          <div className="animate-marquee flex w-max items-center">
            {/* Multiply array to ensure it surpasses screen width massively, translating -50% loops it seamlessly */}
            {[...flags, ...flags, ...flags, ...flags, ...flags, ...flags].map((flag, idx) => (
              <span key={idx} className="text-[2.5rem] min-w-[70px] sm:min-w-[100px] text-center select-none">
                {flag}
              </span>
            ))}
          </div>
          {/* Gradients for smooth fade on edges */}
          <div className="absolute top-0 left-0 w-16 md:w-32 h-full bg-gradient-to-r from-background to-transparent pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-16 md:w-32 h-full bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
        </div>
      </section>

      {/* ─── Comparison Section (Interactive & Stacked) ─── */}
      <section className="py-8 md:py-16 bg-background min-h-[90vh] flex items-center" id="comparativa">
        <div className="container px-4 max-w-6xl">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-5xl font-extrabold mb-4">Ahorra miles de dólares</h2>
            <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
              Mientras otros se quedan con un porcentaje de tu esfuerzo, en Acroshub el 100% es para ti.
            </p>
          </div>

          <div className="space-y-12 w-full">
            {/* 1. Calculadora Animada Rediseñada */}
            <div className="border rounded-3xl p-6 md:p-10 lg:p-12 bg-card shadow-2xl relative overflow-hidden group">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                
                {/* ── Columna Izquierda: Counter & Info ── */}
                <div className="lg:col-span-4 flex flex-col justify-center h-full space-y-6 md:space-y-8">
                  <div className="space-y-2">
                    <Badge variant="outline" className="py-1 px-3 text-[10px] uppercase tracking-tighter text-primary border-primary/20 bg-primary/5">Calculadora de Comisiones</Badge>
                    <h3 className="text-lg md:text-2xl font-bold text-foreground">Imagina facturar al mes...</h3>
                  </div>

                  <div className="text-5xl md:text-7xl font-black text-primary tracking-tighter tabular-nums drop-shadow-sm select-none">
                    ${Math.floor(ventasMensuales).toLocaleString()}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative pointer-events-none w-full">
                      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-primary shadow-[0_0_20px_rgba(var(--primary),0.4)]" style={{ width: `${(ventasMensuales / 10000) * 100}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-3 font-semibold uppercase tracking-widest">
                        <span>$100</span>
                        <span>$10,000+</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Separador Visual en Desktop ── */}
                <div className="hidden lg:block lg:col-span-1 h-full w-px bg-border/60 mx-auto"></div>

                {/* ── Columna Derecha: El Gráfico ── */}
                <div className="lg:col-span-7">
                  <div className="text-center lg:text-left mb-10">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground/80 mb-2">Comisiones en otras Plataformas de Cursos</h4>
                    <p className="text-xs text-muted-foreground"><span className="underline decoration-red-500 decoration-2 underline-offset-4 font-bold">Lo que regalas</span> vs <span className="text-primary font-bold italic">100% tuyo en Acroshub</span></p>
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 items-end h-[240px] md:h-[280px]">
                    {/* Skool Hobby */}
                    <div className="flex flex-col h-full justify-end group">
                      {/* Barra Visual */}
                      <div className="w-full flex items-end h-[160px] relative">
                        <div className={`w-full relative rounded-t-2xl ${getDynamicColorClasses(costoSkoolHobby).bar}`} style={{ height: `${(costoSkoolHobby / maxCosto) * 100}%`, minHeight: '4px' }}>
                          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max text-lg md:text-2xl font-black text-center transition-colors duration-300 ${getDynamicColorClasses(costoSkoolHobby).text}`}>${Math.round(costoSkoolHobby).toLocaleString()}</div>
                        </div>
                      </div>
                      {/* Labels */}
                      <div className="h-[45px] flex flex-col justify-start items-center mt-3">
                        <div className="text-[9px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-tighter text-center leading-tight">Skool<br/> Hobby</div>
                      </div>
                    </div>

                    {/* Skool Pro */}
                    <div className="flex flex-col h-full justify-end group">
                      <div className="w-full flex items-end h-[160px] relative">
                        <div className={`w-full relative rounded-t-2xl ${getDynamicColorClasses(costoSkoolPro).bar}`} style={{ height: `${(costoSkoolPro / maxCosto) * 100}%`, minHeight: '4px' }}>
                          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max text-lg md:text-2xl font-black text-center transition-colors duration-300 ${getDynamicColorClasses(costoSkoolPro).text}`}>${Math.round(costoSkoolPro).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="h-[45px] flex flex-col justify-start items-center mt-3">
                        <div className="text-[9px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-tighter text-center leading-tight">Skool<br/> Pro</div>
                      </div>
                    </div>

                    {/* Hotmart */}
                    <div className="flex flex-col h-full justify-end group">
                      <div className="w-full flex items-end h-[160px] relative">
                        <div className={`w-full relative rounded-t-2xl ${getDynamicColorClasses(costoHotmart).bar}`} style={{ height: `${(costoHotmart / maxCosto) * 100}%`, minHeight: '4px' }}>
                          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max text-lg md:text-2xl font-black text-center transition-colors duration-300 ${getDynamicColorClasses(costoHotmart).text}`}>${Math.round(costoHotmart).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="h-[45px] flex flex-col justify-start items-center mt-3">
                        <div className="text-[9px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-tighter text-center leading-tight">Hotmart</div>
                      </div>
                    </div>

                    {/* Acroshub */}
                    <div className="flex flex-col h-full justify-end relative group">
                      <div className="w-full flex items-end h-[160px] relative">
                        <div className="w-full relative bg-primary rounded-t-2xl border-t-2 border-primary/20 shadow-[0_-4px_15px_rgba(var(--primary),0.2)]" style={{ height: `${(costoAcroshub / maxCosto) * 100}%`, minHeight: '4px' }}>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max text-lg md:text-2xl font-black text-center text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]">${costoAcroshub}</div>
                        </div>
                      </div>
                      
                      <div className="h-[45px] flex flex-col justify-start items-center mt-3 w-full">
                        <div className="flex flex-col items-center justify-center gap-1.5 w-full scale-90 sm:scale-100">
                          <span className="text-[9px] md:text-[11px] font-black text-primary uppercase tracking-tighter">Acroshub</span>
                          <div className="flex gap-1 justify-center align-middle">
                            <div className="bg-green-100 text-green-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm leading-none flex items-center">
                              PLAN {planSugeridoName}
                            </div>
                            <div className="bg-yellow-400 text-yellow-900 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm leading-none flex items-center">
                              ⭐ MEJOR
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              
              <div className="flex items-center justify-center mt-12 mb-2 w-full">
                <Button size="lg" asChild className="h-14 px-10 text-lg shadow-xl shadow-primary/20 rounded-full group w-full md:w-auto">
                  <Link to="/register">
                    Empezar a ahorrar hoy <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>


            {/* 2. Tabla Comparativa con Scrollbar Personalizada e Invitación al Desplazamiento (Solo Mobile) */}
            <div className="overflow-x-auto rounded-3xl border shadow-xl bg-card lg:mt-8 custom-mobile-scroll">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-muted/50 text-xs md:text-sm border-b">
                    <th className="p-4 md:p-6 font-semibold w-[28%]"></th>
                    <th className="p-4 md:p-6 font-semibold text-muted-foreground w-[24%] text-center border-l bg-card">Skool</th>
                    <th className="p-4 md:p-6 font-semibold text-muted-foreground w-[24%] text-center border-l bg-card">Hotmart</th>
                    <th className="p-4 md:p-6 font-black text-primary w-[24%] border-l bg-primary/5 text-center relative shadow-[inset_0_4px_0_0_hsl(var(--primary))]">
                      <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2">
                        Acroshub
                        <Badge className="bg-primary text-primary-foreground hover:bg-primary shadow-sm text-[8px] md:text-[9px] px-1.5 h-4 tracking-wider uppercase font-bold">RECOMENDADO</Badge>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {/* Precio inicial */}
                  <tr className="border-b transition-colors group">
                    <td className="p-4 md:p-5 font-semibold text-foreground/80 group-hover:bg-muted/30">Precio inicial</td>
                    <td className="p-4 md:p-5 border-l text-center font-medium group-hover:bg-muted/30">$9/mes</td>
                    <td className="p-4 md:p-5 border-l text-center font-medium group-hover:bg-muted/30">$0</td>
                    <td className="p-4 md:p-5 border-l bg-primary/5 text-center font-bold text-primary group-hover:bg-primary/10">Desde $0</td>
                  </tr>
                  {/* Comisión por venta */}
                  <tr className="border-b transition-colors group">
                    <td className="p-4 md:p-5 font-semibold text-foreground/80 group-hover:bg-muted/30">Comisión por venta</td>
                    <td className="p-4 md:p-5 border-l text-center text-red-500 font-medium group-hover:bg-muted/30">10%</td>
                    <td className="p-4 md:p-5 border-l text-center text-red-500 font-medium group-hover:bg-muted/30">9.9% + $0.50</td>
                    <td className="p-4 md:p-5 border-l bg-primary/5 text-center font-black text-primary group-hover:bg-primary/10">0% <CheckCircle className="inline h-4 w-4 ml-0.5" /></td>
                  </tr>
                  {/* Disponibilidad de fondos */}
                  <tr className="border-b transition-colors group">
                    <td className="p-4 md:p-5 font-semibold text-foreground/80 group-hover:bg-muted/30">Disponibilidad de fondos</td>
                    <td className="p-4 md:p-5 border-l text-center text-muted-foreground font-medium group-hover:bg-muted/30">7 - 14 días</td>
                    <td className="p-4 md:p-5 border-l text-center text-red-500 font-medium group-hover:bg-muted/30">2 - 30 días</td>
                    <td className="p-4 md:p-5 border-l bg-primary/5 text-center font-bold text-primary group-hover:bg-primary/10">Inmediata</td>
                  </tr>
                  {/* Gestión de Cursos */}
                  <tr className="border-b transition-colors group">
                    <td className="p-4 md:p-5 font-semibold text-foreground/80 group-hover:bg-muted/30">Gestión de Cursos</td>
                    <td className="p-4 md:p-5 border-l text-center text-muted-foreground group-hover:bg-muted/30"><CheckCircle className="inline h-5 w-5 opacity-60" /></td>
                    <td className="p-4 md:p-5 border-l text-center text-muted-foreground group-hover:bg-muted/30"><CheckCircle className="inline h-5 w-5 opacity-60" /></td>
                    <td className="p-4 md:p-5 border-l bg-primary/5 text-center font-bold text-primary group-hover:bg-primary/10"><CheckCircle className="inline h-5 w-5" /></td>
                  </tr>
                  {/* Gestión de Ebooks */}
                  <tr className="border-b transition-colors group">
                    <td className="p-4 md:p-5 font-semibold text-foreground/80 group-hover:bg-muted/30">Gestión de Ebooks</td>
                    <td className="p-4 md:p-5 border-l text-center text-muted-foreground group-hover:bg-muted/30">Limitado <XCircle className="inline h-4 w-4 ml-1 opacity-40" /></td>
                    <td className="p-4 md:p-5 border-l text-center text-muted-foreground group-hover:bg-muted/30"><CheckCircle className="inline h-5 w-5 opacity-60" /></td>
                    <td className="p-4 md:p-5 border-l bg-primary/5 text-center font-bold text-primary group-hover:bg-primary/10"><CheckCircle className="inline h-5 w-5" /></td>
                  </tr>
                  {/* Control manual de Alumnos */}
                  <tr className="border-b transition-colors group">
                    <td className="p-4 md:p-5 font-semibold text-foreground/80 group-hover:bg-muted/30">Control manual de Alumnos</td>
                    <td className="p-4 md:p-5 border-l text-center text-muted-foreground group-hover:bg-muted/30">Limitado <XCircle className="inline h-4 w-4 ml-1 opacity-40" /></td>
                    <td className="p-4 md:p-5 border-l text-center text-muted-foreground/40 group-hover:bg-muted/30"><XCircle className="inline h-5 w-5" /></td>
                    <td className="p-4 md:p-5 border-l bg-primary/5 text-center font-bold text-primary group-hover:bg-primary/10"><CheckCircle className="inline h-5 w-5" /></td>
                  </tr>
                  {/* Cupones Mágicos */}
                  <tr className="transition-colors group">
                    <td className="p-4 md:p-5 font-semibold text-foreground/80 group-hover:bg-muted/30">Códigos Mágicos (Regalos)</td>
                    <td className="p-4 md:p-5 border-l text-center text-muted-foreground/40 group-hover:bg-muted/30"><XCircle className="inline h-5 w-5" /></td>
                    <td className="p-4 md:p-5 border-l text-center text-muted-foreground/40 group-hover:bg-muted/30"><XCircle className="inline h-5 w-5" /></td>
                    <td className="p-4 md:p-5 border-l bg-primary/5 text-center font-bold text-primary group-hover:bg-primary/10 flex flex-col items-center justify-center gap-1.5 h-full">
                      <CheckCircle className="inline h-5 w-5" />
                      <Badge variant="default" className="text-[9px] h-4 px-1.5 shadow-sm">EXCLUSIVO</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              /* Estilo de barra de desplazamiento integrada para mobile */
              @media (max-width: 767px) {
                .custom-mobile-scroll::-webkit-scrollbar {
                  height: 4px;
                  display: block !important;
                }
                .custom-mobile-scroll::-webkit-scrollbar-track {
                  background: rgba(0, 0, 0, 0.05);
                  border-radius: 10px;
                  margin: 0 20px;
                }
                .custom-mobile-scroll::-webkit-scrollbar-thumb {
                  background: #3b82f6; /* Azul primario */
                  border-radius: 10px;
                }
                
                @keyframes subtle-bounce {
                  0%, 100% { transform: translateX(0); }
                  50% { transform: translateX(-6px); }
                }
                
                /* Aplicar la animación solo en mobile de verdad */
                .custom-mobile-scroll {
                  animation: subtle-bounce 3s ease-in-out infinite;
                }
              }
            `}} />

            <div className="flex items-center justify-center mt-10 w-full">
              <Button size="lg" asChild className="h-14 px-10 text-lg shadow-xl shadow-primary/20 rounded-full group w-full md:w-auto">
                <Link to="/register">
                  Crear mi academia gratis <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Block ─── */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">Todo lo que necesitas para vender</h2>
            <p className="text-muted-foreground text-base">Hemos construido la arquitectura técnica para que tú te enfoques solo en enseñar.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-card p-5 md:p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-12 md:py-16 bg-muted/20 border-y border-border/50">
        <div className="container px-4 max-w-5xl">
          <h2 className="text-2xl md:text-4xl font-bold mb-10 text-center">Historias de éxito</h2>
          
          <div className="relative flex overflow-x-hidden w-full max-w-6xl mx-auto py-4">
            <div className="animate-marquee-slow flex w-max items-center">
              {/* Duplicar el array de 7 para el loop continuo suave */}
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="w-[320px] bg-background border mx-4 p-5 rounded-2xl flex flex-col justify-between hover:border-primary/30 transition-colors shrink-0 shadow-sm h-[260px]">
                  <div className="space-y-3 mb-4">
                    <div className="text-primary/40">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed font-medium line-clamp-4">"{t.text}"</p>
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-none">{t.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Sombras suaves en los bordes para difuminar entrada/salida */}
            <div className="absolute top-0 left-0 w-16 md:w-40 h-full bg-gradient-to-r from-muted/20 via-muted/20 to-transparent pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>
            <div className="absolute top-0 right-0 w-16 md:w-40 h-full bg-gradient-to-l from-muted/20 via-muted/20 to-transparent pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10"></div>
        <div className="container px-4 text-center max-w-2xl">
          <AcroshubLogo className="h-16 w-16 text-primary mx-auto mb-6 drop-shadow-sm opacity-90" />
          <h2 className="text-3xl md:text-5xl font-black mb-4">El momento es ahora</h2>
          <p className="text-base md:text-lg text-muted-foreground mb-8">Únete a la revolución de creadores que están construyendo sus propios ecosistemas sin regalar sus ganancias.</p>
          <Button size="lg" asChild className="h-14 px-8 text-lg shadow-xl shadow-primary/20 rounded-full">
            <Link to="/register">Registrarse para probar gratis <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t py-8 bg-card text-muted-foreground">
        <div className="container px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <span className="font-black text-lg text-foreground tracking-tight">ACROSHUB</span>
            <p className="mt-1 text-xs">© {new Date().getFullYear()} Acroshub. Plataforma de EdTech libre de comisiones.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-medium">
            <Link to="/terminos-y-condiciones" className="hover:text-primary transition-colors">Términos y Condiciones</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
