import { PublicHeader } from "@/components/layout/PublicHeader";
import { Link } from "react-router-dom";
import { ChevronRight, ShieldCheck, Scale, FileText, Cookie, AlertCircle, RefreshCcw, Headphones } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const sections = [
  { id: "terminos-y-condiciones", title: "Términos y Condiciones", icon: Scale },
  { id: "politica-de-privacidad", title: "Política de Privacidad", icon: ShieldCheck },
  { id: "politica-de-cookies", title: "Política de Cookies", icon: Cookie },
  { id: "disclaimer", title: "Disclaimer", icon: AlertCircle },
  { id: "politica-de-reembolsos", title: "Política de Reembolsos", icon: RefreshCcw },
  { id: "sla", title: "Acuerdo de Nivel de Servicio (SLA)", icon: Headphones },
];

export default function TermsPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      <main className="container max-w-5xl py-12 px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1 hidden lg:block sticky top-28 h-fit">
            <h2 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-6">Contenido</h2>
            <nav className="flex flex-col space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left text-muted-foreground hover:text-foreground"
                >
                  <section.icon className="h-4 w-4" />
                  {section.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight mb-4">Documentos Legales</h1>
              <p className="text-muted-foreground">Última actualización: 2 de Abril, 2026 • Versión 1.0</p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-16">
              
              {/* TÉRMINOS Y CONDICIONES */}
              <section id="terminos-y-condiciones" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Scale className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold m-0 text-foreground">Términos y Condiciones</h2>
                </div>
                
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">1. Introducción y Aceptación</h3>
                    <p><strong>1.1 Acerca de Acroshub:</strong> Acroshub es un servicio de software como servicio (SaaS) que proporciona herramientas tecnológicas para que educadores independientes puedan crear, alojar y comercializar contenido educativo digital.</p>
                    <p><strong>1.2 Aceptación de los Términos:</strong> Al acceder o utilizar Acroshub, ya sea como Profesor o como Alumno, usted acepta estar legalmente vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguno de estos términos, no debe utilizar la Plataforma.</p>
                    <p><strong>1.3 Capacidad Legal:</strong> Usted declara que tiene al menos 18 años de edad o la mayoría de edad legal en su jurisdicción.</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">2. Naturaleza del Servicio</h3>
                    <p><strong>2.1 Acroshub como Intermediario Tecnológico:</strong> Acroshub proporcionará únicamente la infraestructura tecnológica. <strong>No es:</strong> un proveedor de contenido, una institución educativa o un empleador de los profesores.</p>
                    <p><strong>2.2 Relación entre las Partes:</strong> Entre Acroshub y el Profesor existe una relación de prestación de servicios tecnológicos. Entre Profesor y Alumno existe una relación comercial directa e independiente.</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">3. Limitación de Responsabilidad</h3>
                    <p>Acroshub NO se hace responsable de la calidad del contenido, entrega del contenido, resultados educativos, veracidad de las afirmaciones o disponibilidad del profesor.</p>
                    <p>Los pagos realizados entre Profesores y Alumnos se efectúan <strong>fuera de la plataforma</strong> y son responsabilidad exclusiva de las partes involucradas.</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">4. Obligaciones del Profesor</h3>
                    <p>El Profesor se compromete a entregar el contenido prometido, mantenerlo actualizado y cumplir con las leyes de protección al consumidor y fiscales de su jurisdicción.</p>
                    <p>Queda estrictamente prohibido el contenido que promueva odio, violencia, discriminación, pornografía o actividades ilegales.</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">5. Obligaciones del Alumno</h3>
                    <p>El Alumno se compromete a utilizar el contenido para uso personal y no redistribuirlo. Reconoce que su relación comercial es directamente con el Profesor.</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">6. Cuentas de Usuario</h3>
                    <p>Usted es responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran bajo su cuenta.</p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* POLÍTICA DE PRIVACIDAD */}
              <section id="politica-de-privacidad" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold m-0 text-foreground">Política de Privacidad</h2>
                </div>
                
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <p>Esta política describe cómo Acroshub recopila, utiliza, almacena y protege su información personal.</p>
                  
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">Información que recopilamos</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Datos de registro:</strong> Nombre, email, contraseña.</li>
                      <li><strong>Datos de perfil:</strong> Foto, biografía.</li>
                      <li><strong>Datos de uso:</strong> Páginas visitadas, tiempo en la plataforma.</li>
                      <li><strong>Cookies:</strong> Para mejorar la experiencia de usuario.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">Cómo utilizamos su información</h3>
                    <p>Utilizamos su información para proporcionar y mejorar nuestros servicios, procesar transacciones, comunicarnos con usted y analizar el uso de la plataforma.</p>
                    <p><strong>Acroshub NO vende sus datos personales a terceros.</strong></p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* POLÍTICA DE COOKIES */}
              <section id="politica-de-cookies" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Cookie className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold m-0 text-foreground">Política de Cookies</h2>
                </div>
                
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <p>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo para mejorar su experiencia.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Cookies Esenciales:</strong> Necesarias para el funcionamiento y seguridad.</li>
                    <li><strong>Cookies de Rendimiento:</strong> Para analizar el uso de la plataforma.</li>
                    <li><strong>Cookies de Funcionalidad:</strong> Para recordar sus preferencias.</li>
                  </ul>
                </div>
              </section>

              <Separator />

              {/* DISCLAIMER */}
              <section id="disclaimer" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold m-0 text-foreground">Disclaimer</h2>
                </div>
                
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <p>Acroshub proporciona la plataforma "tal cual" y "según disponibilidad". No garantizamos que el contenido de los profesores sea preciso o completo.</p>
                  <p>El contenido de la plataforma es únicamente educativo y <strong>no constituye asesoramiento profesional</strong> (legal, financiero, médico, etc.).</p>
                </div>
              </section>

              <Separator />

              {/* POLÍTICA DE REEMBOLSOS */}
              <section id="politica-de-reembolsos" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <RefreshCcw className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold m-0 text-foreground">Política de Reembolsos</h2>
                </div>
                
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">Para Profesores (Suscripción)</h3>
                    <p>Puede cancelar su suscripción en cualquier momento. La cancelación será efectiva al final del período de facturación actual.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">Para Alumnos (Cursos)</h3>
                    <p><strong>IMPORTANTE:</strong> Los reembolsos por compra de cursos son responsabilidad exclusiva del Profesor, no de Acroshub.</p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* SLA */}
              <section id="sla" className="scroll-mt-28 mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Headphones className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold m-0 text-foreground">SLA</h2>
                </div>
                
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <p>Nos esforzamos por mantener una disponibilidad del 99.5% mensual.</p>
                  <p>El soporte se maneja vía email: <strong>contacto@acroshub.com</strong> con tiempos de respuesta que varían según la prioridad del problema.</p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-12 bg-muted/30">
        <div className="container px-4 text-center">
          <Link to="/" className="text-2xl font-black text-foreground tracking-tighter mb-4 inline-block">ACROSHUB</Link>
          <p className="text-sm text-muted-foreground">Potenciando la educación digital libre de comisiones.</p>
        </div>
      </footer>
    </div>
  );
}
