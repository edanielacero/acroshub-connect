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

      {/* Hero */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container text-center max-w-3xl">
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Tu plataforma de cursos, <span className="text-primary">sin comisiones</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Vende tus cursos online. Recibe el 100% de tus ventas. Crea tu propia academia personalizada.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/register">Comenzar gratis <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">¿Por qué Acroshub?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map(b => (
              <div key={b.title} className="text-center p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                  <b.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/40">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Cómo funciona</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map(s => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">{s.step}</div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container text-center max-w-2xl">
          <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-muted-foreground mb-6">Crea tu cuenta gratis y empieza a vender tus cursos hoy mismo.</p>
          <Button size="lg" asChild className="text-base px-8">
            <Link to="/register">Crear cuenta gratis</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© 2025 Acroshub. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-foreground">Términos</Link>
            <Link to="/" className="hover:text-foreground">Privacidad</Link>
            <Link to="/" className="hover:text-foreground">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
