import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { DollarSign, Shield, Palette, ArrowRight, CheckCircle } from "lucide-react";

const benefits = [
  { icon: DollarSign, title: "Sin comisiones", description: "Recibe el 100% de tus ventas. Sin intermediarios ni comisiones ocultas." },
  { icon: Shield, title: "Videos protegidos", description: "Tu contenido está seguro. Solo tus alumnos pueden acceder." },
  { icon: Palette, title: "Tu propia marca", description: "Personaliza tu HUB con tu logo, colores y dominio." },
];

const steps = [
  { step: "1", title: "Crea tu HUB", description: "Regístrate gratis y personaliza tu academia online en minutos." },
  { step: "2", title: "Sube tus cursos", description: "Agrega módulos, clases, videos y quizzes de forma sencilla." },
  { step: "3", title: "Vende y crece", description: "Comparte tu link, recibe pagos y haz crecer tu comunidad." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-14 sm:py-20 lg:py-32">
        <div className="container max-w-3xl text-center">
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:mb-6 lg:text-6xl">
            Tu plataforma de cursos, <span className="text-primary">sin comisiones</span>
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-base text-muted-foreground sm:text-lg lg:mb-8 lg:text-xl">
            Vende tus cursos online. Recibe el 100% de tus ventas. Crea tu propia academia personalizada.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="w-full px-8 text-base sm:w-auto">
              <Link to="/register">Comenzar gratis <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full px-8 text-base sm:w-auto">
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container">
          <h2 className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl">¿Por qué Acroshub?</h2>
          <div className="grid gap-4 md:grid-cols-3 sm:gap-6 lg:gap-8">
            {benefits.map(b => (
              <div key={b.title} className="rounded-xl border bg-card p-5 text-center transition-shadow hover:shadow-md sm:p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <b.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-14 sm:py-20">
        <div className="container">
          <h2 className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl">Cómo funciona</h2>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {steps.map(s => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">{s.step}</div>
                <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container max-w-2xl text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">¿Listo para empezar?</h2>
          <p className="mb-6 text-muted-foreground">Crea tu cuenta gratis y empieza a vender tus cursos hoy mismo.</p>
          <Button size="lg" asChild className="w-full px-8 text-base sm:w-auto">
            <Link to="/register">Crear cuenta gratis</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <span>© 2025 Acroshub. Todos los derechos reservados.</span>
          <div className="flex flex-wrap justify-center gap-4 sm:justify-end">
            <Link to="/" className="hover:text-foreground">Términos</Link>
            <Link to="/" className="hover:text-foreground">Privacidad</Link>
            <Link to="/" className="hover:text-foreground">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
