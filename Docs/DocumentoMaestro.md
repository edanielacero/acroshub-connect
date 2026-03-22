# ACROSHUB
### *Tu plataforma de cursos, sin comisiones*

**Documento Maestro del Proyecto**
Versión 3.2 | Marzo 2026 | Autor: Daniel – Founder

---

## Índice

1. [Visión General](#1-visión-general)
2. [Funcionalidades del Producto](#2-funcionalidades-del-producto)
3. [Arquitectura Técnica](#3-arquitectura-técnica)
4. [Modelo de Negocio](#4-modelo-de-negocio)
5. [Flujos de Usuario](#5-flujos-de-usuario)
6. [MVP - Producto Mínimo Viable](#6-mvp---producto-mínimo-viable)
7. [Roadmap de Desarrollo](#7-roadmap-de-desarrollo)
8. [Métricas Clave (KPIs)](#8-métricas-clave-kpis)
9. [Prompts para Desarrollo con AI](#9-prompts-para-desarrollo-con-ai)
10. [Consideraciones Finales](#10-consideraciones-finales)

---

## 1. Visión General

### 1.1 Problema

Millones de educadores digitales en Latinoamérica enfrentan un problema común: las plataformas existentes para vender cursos cobran comisiones excesivas y no ofrecen control real sobre el contenido. Las principales fricciones son:

- **Comisiones abusivas:** Hotmart/Skool cobran 5–10% por cada venta además de la suscripción mensual.
- **Sin protección de contenido:** Google Drive y Telegram permiten que los videos se compartan y filtren fácilmente.
- **Falta de profesionalismo:** Usar herramientas gratuitas proyecta una imagen poco seria ante los alumnos.
- **Sin personalización:** Las plataformas existentes no permiten white-label real para educadores hispanohablantes.
- **Dependencia del intermediario:** El profesor no tiene control total sobre sus alumnos ni sus pagos.

### 1.2 Solución

Acroshub es una plataforma SaaS multi-tenant para educadores digitales donde el profesor paga una suscripción fija mensual/anual y recibe el 100% del dinero de sus alumnos (sin comisión por transacción). Daniel es el dueño del SaaS y su cliente directo es el profesor, no el alumno.

### 1.3 Propuesta de Valor

| Para el Profesor | Para el Alumno |
|---|---|
| Suscripción fija, sin comisión por venta | Una sola cuenta para todos sus profesores |
| El dinero va directo a su cuenta (Stripe Connect) | Videos protegidos con calidad profesional |
| Personalización de marca (colores, logo, dominio) | Progreso guardado y notificaciones de contenido nuevo |
| Control total de alumnos y accesos | Interfaz moderna y fácil de usar |
| Reportes de ventas y cantidad de alumnos | Comentarios y quizzes integrados |

### 1.4 Nombre y Branding

- **Nombre:** Acroshub
- **Tagline:** "Tu plataforma de cursos, sin comisiones"
- **Mercado inicial:** Educadores digitales hispanohablantes (LATAM + España)
- **Target:** Profesores de trading, finanzas, marketing, desarrollo personal, fitness
- **Idioma MVP:** Solo español

---

## 2. Funcionalidades del Producto

### 2.1 Los Tres Actores del Sistema

#### Super Admin (Daniel)

- Dueño y operador del SaaS
- Ve todos los tenants (profesores), sus métricas, uso y estado
- Gestiona el estado de los profesores (Activo, Freemium, Suspendido)
- Registra pagos y gestiona upgrades/downgrades de planes
- Configura límites y precios (mensuales/anuales) de cada plan desde su panel
- Cobra a los profesores de forma manual, registrando los pagos en el perfil de cada profesor
- Agrega dominios custom para tenants enterprise via Vercel API

#### Profesor (Tenant Owner)

- Cliente directo de Daniel
- Cada profesor es un tenant completamente aislado (no ve datos de otros profesores)
- Puede tener múltiples HUBs (ej: "Trading", "Finanzas personales")
- Gestiona sus propios alumnos: registrarlos, asignar accesos, revocarlos
- Registra pagos de alumnos (manuales o por Stripe) desde el perfil de cada alumno
- Ve el historial de pagos y total pagado por cada alumno
- Conecta su propia cuenta de Stripe Connect Express para recibir pagos directamente
- También acepta pagos externos (PayPal, cripto, transferencia, efectivo) y da accesos manuales
- Configura precios, cupones, descuentos y períodos de acceso
- Ve reportes de ventas y cantidad de alumnos
- Debe registrar un email de contacto de emergencia al crear su cuenta

#### Alumno (Usuario Final)

- Cliente del profesor, NO cliente directo de Daniel
- Una sola cuenta global: un email, una contraseña, accede a todos los HUBs de todos sus profesores
- Se registra siempre desde el dominio principal de Daniel (nunca en el dominio del profesor)
- Ve "Mis productos" (acceso activo) y "Descubrir" (productos bloqueados con preview)
- Puede comprar productos directamente desde el HUB del profesor
- Recibe notificaciones por email cuando hay contenido nuevo

### 2.2 Estados del Profesor vs Planes

Los **estados** y los **planes** son conceptos diferentes:

#### Estados del Profesor

| Estado | Descripción | El profesor puede... |
|---|---|---|
| **Activo** | Cuenta funcionando normalmente | Todo: crear contenido, gestionar alumnos, cobrar |
| **Freemium** | Cuenta operativa pero con límites del plan gratuito | Operar dentro de los límites (5 alumnos, 1 curso, etc.) |
| **Suspendido** | Cuenta bloqueada por razón disciplinaria o emergencia | NADA. No puede acceder a su panel. Alumnos tampoco pueden acceder. |

**Cuándo usar cada uno:**
- **Activo:** Profesor tiene un plan de pago vigente
- **Freemium:** Profesor nuevo sin pagar, o profesor degradado por falta de pago
- **Suspendido:** Solo en casos de emergencia (fraude, contenido ilegal, violación de términos, chargeback)

#### Planes de Suscripción

| Plan | Descripción |
|---|---|
| Freemium | Plan gratuito con límites estrictos |
| Básico | Primer plan de pago |
| Pro | Plan intermedio con más features |
| Enterprise | Plan completo con dominio propio |
| Mantenimiento | Plan especial de offboarding (read-only) |

*Nota: Un profesor en estado "Activo" puede tener cualquier plan de pago. Un profesor en estado "Freemium" está en el plan gratuito.*

### 2.3 Jerarquía de Contenido

```
Profesor
└── HUB (puede tener múltiples por profesor)
    ├── Curso
    │   └── Módulo
    │       └── Clase (video + PDF + texto + quiz opcional)
    │           └── Preview gratuita (opcional, configurable por clase)
    ├── Ebook (PDF con visor seguro integrado, sin descarga)
    └── HUB completo (producto que da acceso a todo el contenido del HUB)
```

**Tipos de productos comprables:**

| Producto | Descripción |
|---|---|
| Curso individual | Acceso a un curso específico |
| Ebook individual | PDF con visor seguro, sin descarga |
| HUB completo | Acceso a todo el contenido del HUB |

### 2.4 Sistema de Videos

| Fuente | Protección | Notas |
|---|---|---|
| Bunny.net CDN | URL firmada (~10 min expiración), sin descarga | Recomendado para contenido premium |
| YouTube/Vimeo/Drive | Sin protección (URL visible) | Advertencia al profesor al importar |

### 2.5 Sistema de Comentarios

- Comentarios por clase con capacidad de respuesta
- El profesor u otros alumnos pueden responder
- Un comentario principal puede tener varias respuestas
- **Regla crítica:** Las respuestas NO pueden tener otras respuestas (sin bucle)
- **Gestión Docente:** El profesor cuenta con una bandeja de entrada centralizada ("Comentarios sin responder") con filtros y acceso rápido.
- **Modo Respuesta:** Al contestar, el profesor ingresa a una "Previsualización del Reproductor" limpia y aislada, que realiza auto-scroll y resalta el comentario objetivo para mantener contexto visual exacto de la clase sin salir del entorno de administración.

### 2.6 Sistema de Quizzes

| Característica | Detalle |
|---|---|
| Tipo | Opción múltiple con nota/porcentaje |
| Configuración | El profesor define preguntas y opciones |
| Obligatoriedad | Opcionales (el alumno puede saltarlos) |
| Reintentos | Ilimitados |

---

## 3. Arquitectura Técnica

### 3.1 Stack Tecnológico Actual

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend Framework | React + Vite | React 18.3, Vite 8 |
| Lenguaje | TypeScript | 5.8 |
| Estilos | Tailwind CSS | 3.4 |
| Componentes UI | shadcn/ui (Radix UI + Lucide) | Última |
| Enrutamiento | React Router DOM | 6.30 |
| Estado/Datos | React Query (@tanstack/react-query) | 5.83 |
| Formularios | React Hook Form + Zod | 7.61 + 3.25 |
| Gráficos | Recharts | 2.15 |
| Testing | Vitest + Playwright | 4.1 + 1.57 |

### 3.2 Stack Backend (A implementar)

| Capa | Tecnología | Justificación |
|---|---|---|
| Base de datos + Auth | Supabase (PostgreSQL + RLS) | Row Level Security para aislamiento automático de tenants |
| Video CDN | Bunny.net Stream | URLs firmadas, sin descarga, precio dinámico |
| Ebooks / PDFs | Supabase Storage | Almacenamiento con políticas RLS |
| Pagos profesores | Stripe Connect Express | Dinero va directo al profesor |
| Deploy | Vercel | Hosting del frontend |
| Emails | Resend | Notificaciones de ciclo de vida |

### 3.3 Estructura de Rutas Actual

```
/                     → Landing pública
/login                → Inicio de sesión
/register             → Registro de usuario

/admin                → Panel del Super Admin (Daniel)
/admin/profesores     → Lista de profesores
/admin/profesores/:id → Detalle de profesor (info, suscripción, historial de pagos)
/admin/ventas         → Dashboard global de ventas (solo lectura, métricas y gráficas)
/admin/configuracion  → Configuración de límites y precios de planes

/dashboard            → Panel del Profesor
/dashboard/hubs       → Lista de HUBs
/dashboard/hubs/:id   → Editor de HUB
/dashboard/cursos/:id → Editor de curso
/dashboard/alumnos    → Lista de alumnos
/dashboard/alumnos/:id → Detalle del alumno (info, accesos, pagos, progreso)
/dashboard/ventas     → Reportes de ventas del profesor (solo lectura)
/dashboard/config     → Configuración del profesor

/mi-cuenta            → Dashboard del alumno (todos sus HUBs)

/:slug                → Landing del HUB del profesor
/:slug/descubrir      → Catálogo de productos
/:slug/mis-productos  → Productos comprados
/:slug/curso/:id      → Detalle del curso
/:slug/clase/:id      → Reproductor de clase
```

### 3.4 Modelo de Datos (Supabase / PostgreSQL)

#### Tabla: users (Supabase Auth)

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único (Supabase Auth) |
| email | TEXT | Email del usuario |
| role | ENUM | super_admin / profesor / alumno |
| created_at | TIMESTAMP | Fecha de registro |

*Nota: Un email = una cuenta global (el alumno accede a múltiples profesores)*

#### Tabla: tenants (Profesores)

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| user_id | UUID (FK) | Referencia a users |
| plan | ENUM | freemium / basico / pro / enterprise / mantenimiento |
| status | ENUM | active / freemium / suspended |
| billing_cycle | ENUM | mensual / anual (null si freemium) |
| current_period_start | TIMESTAMP | Inicio del ciclo de facturación actual |
| current_period_end | TIMESTAMP | Fin del ciclo de facturación actual |
| scheduled_downgrade_plan | TEXT | Plan al que bajará al final del ciclo (null si no hay downgrade) |
| slug | TEXT | Subdominio del profesor (ej: "trading") |
| emergency_email | TEXT | Email de contacto de emergencia |
| stripe_account_id | TEXT | ID de cuenta Stripe Connect |
| created_at | TIMESTAMP | Fecha de registro |

#### Tabla: hubs

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| tenant_id | UUID (FK) | Referencia a tenants |
| name | TEXT | Nombre del HUB |
| slug | TEXT | Slug para URL |
| colors | JSONB | Colores personalizados |
| logo_url | TEXT | URL del logo |
| created_at | TIMESTAMP | Fecha de creación |

#### Tabla: products

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| hub_id | UUID (FK) | Referencia a hubs |
| type | ENUM | course / ebook / bundle / hub_access |
| name | TEXT | Nombre del producto |
| price_one_time | DECIMAL | Precio de pago único (null si no disponible) |
| price_monthly | DECIMAL | Precio de suscripción mensual (null si no disponible) |
| price_yearly | DECIMAL | Precio de suscripción anual (null si no disponible) |
| stripe_price_id_one_time | TEXT | ID del precio único en Stripe |
| stripe_price_id_monthly | TEXT | ID del precio mensual en Stripe |
| stripe_price_id_yearly | TEXT | ID del precio anual en Stripe |
| created_at | TIMESTAMP | Fecha de creación |

*Nota: El profesor puede activar 1, 2 o las 3 opciones de precio para cada producto. Si un campo de precio es null, esa opción no está disponible para ese producto.*

#### Tabla: courses

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| product_id | UUID (FK) | Referencia a products |
| hub_id | UUID (FK) | Referencia a hubs |

#### Tabla: modules

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| course_id | UUID (FK) | Referencia a courses |
| name | TEXT | Nombre del módulo |
| position | INT | Orden del módulo |

#### Tabla: lessons

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| module_id | UUID (FK) | Referencia a modules |
| name | TEXT | Nombre de la clase |
| position | INT | Orden de la clase |
| video_url | TEXT | URL del video |
| video_source | ENUM | bunny / youtube / vimeo / drive |
| pdf_url | TEXT | URL del PDF adjunto |
| text_content | TEXT | Contenido de texto |
| is_preview | BOOLEAN | Si es preview gratuita |

#### Tabla: quizzes

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| lesson_id | UUID (FK) | Referencia a lessons |
| questions | JSONB | [{question, options[], correct_index}] |

#### Tabla: ebooks

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| product_id | UUID (FK) | Referencia a products |
| hub_id | UUID (FK) | Referencia a hubs |
| pdf_url | TEXT | URL del PDF |

#### Tabla: enrollments

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| user_id | UUID (FK) | Referencia a users (alumno) |
| product_id | UUID (FK) | Referencia a products |
| tenant_id | UUID (FK) | Referencia a tenants |
| origin | ENUM | stripe / manual / gift |
| payment_type | ENUM | one_time / monthly / yearly |
| is_active | BOOLEAN | Si el acceso está activo |
| expires_at | TIMESTAMP | Fecha de expiración (null si es pago único) |
| grace_period_end | TIMESTAMP | Fin del período de gracia (null si no aplica) |
| stripe_subscription_id | TEXT | ID de suscripción en Stripe (null si es manual o pago único) |
| created_at | TIMESTAMP | Fecha de creación |

*Nota: Para pago único, expires_at es null (acceso permanente). Para suscripciones, expires_at se actualiza con cada renovación.*

#### Tabla: lesson_progress

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| user_id | UUID (FK) | Referencia a users |
| lesson_id | UUID (FK) | Referencia a lessons |
| tenant_id | UUID (FK) | Referencia a tenants |
| completed_at | TIMESTAMP | Fecha de completado |

#### Tabla: quiz_attempts

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| user_id | UUID (FK) | Referencia a users |
| quiz_id | UUID (FK) | Referencia a quizzes |
| tenant_id | UUID (FK) | Referencia a tenants |
| score | INT | Nota obtenida (0-100) |
| answers | JSONB | Respuestas del intento |
| attempted_at | TIMESTAMP | Fecha del intento |

#### Tabla: comments

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| lesson_id | UUID (FK) | Referencia a lessons |
| user_id | UUID (FK) | Referencia a users |
| tenant_id | UUID (FK) | Referencia a tenants |
| parent_id | UUID (FK) | Referencia a comment padre (nullable) |
| content | TEXT | Contenido del comentario |
| created_at | TIMESTAMP | Fecha de creación |

*Regla: Si parent_id != null, NO puede tener hijos (sin bucle)*

#### Tabla: platform_subscriptions (Historial de pagos de profesores a Daniel)

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| tenant_id | UUID (FK) | Referencia a tenants (Profesor) |
| type | ENUM | first_payment / renewal / upgrade / downgrade |
| plan_from | TEXT | Plan anterior (null si es first_payment) |
| plan_to | TEXT | Plan nuevo |
| billing_cycle | ENUM | mensual / anual |
| amount | DECIMAL | Monto pagado por el profesor |
| method | ENUM | manual / stripe |
| notes | TEXT | Notas opcionales del admin |
| created_at | TIMESTAMP | Fecha del registro de la venta |

#### Tabla: student_payments (Historial de pagos de alumnos a profesores)

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| tenant_id | UUID (FK) | Referencia a tenants (Profesor que recibe) |
| user_id | UUID (FK) | Referencia a users (Alumno que paga) |
| product_id | UUID (FK) | Referencia a products (Producto comprado) |
| amount | DECIMAL | Monto pagado por el alumno |
| method | ENUM | stripe / paypal / transfer / cash / crypto / other |
| notes | TEXT | Notas opcionales del profesor |
| created_at | TIMESTAMP | Fecha del pago |

*Nota: Esta tabla registra TODOS los pagos, incluyendo los manuales. Los pagos por Stripe también generan un enrollment automático vía webhook.*

### 3.5 Row Level Security (RLS) — CRÍTICO

Todas las tablas con tenant_id deben tener RLS activado:

```sql
-- Profesor solo ve sus datos
CREATE POLICY "tenant_isolation" ON courses
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM tenants WHERE user_id = auth.uid())
  );

-- Alumno ve cursos de tenants donde tiene enrollment
CREATE POLICY "student_access" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN products p ON e.product_id = p.id
      JOIN courses c ON c.product_id = p.id
      WHERE e.user_id = auth.uid()
      AND e.is_active = true
      AND c.id = lessons.course_id
    )
  );
```

---

## 4. Modelo de Negocio

### 4.1 Fuentes de Ingreso

#### A) Suscripción de profesores (principal)

- El profesor paga una suscripción fija mensual/anual
- NO hay comisión por transacción — el profesor recibe 100% de sus ventas
- Daniel cobra manualmente al inicio (sin Stripe Billing propio todavía)

#### B) Plan Mantenimiento (offboarding)

- Precio dinámico basado en almacenamiento (Bunny.net + Supabase Storage)
- Rango estimado: $10–20/mes según volumen
- Sin nuevos alumnos ni cobros
- Panel del profesor en modo READ-ONLY

### 4.2 Planes para Profesores

| Feature | Freemium | Básico | Pro | Enterprise |
|---|---|---|---|---|
| HUBs | 1 | Ilimitados | Ilimitados | Ilimitados |
| Alumnos | 5 | Ilimitados | Ilimitados | Ilimitados |
| Cursos | 1 | Ilimitados | Ilimitados | Ilimitados |
| Clases/curso | 10 | Ilimitadas | Ilimitadas | Ilimitadas |
| Ebooks | 1 | Ilimitados | Ilimitados | Ilimitados |
| Almacenamiento | Ilimitado | Ilimitado | Ilimitado | Ilimitado |
| Personalizar HUB | No | Colores/Logo | Sí | Completo |
| Dominio propio | No | No | No | Sí (CNAME) |

### 4.3 Lógica de Suscripciones

#### Tipos de transacción

| Tipo | Descripción |
|---|---|
| **first_payment** | Primera vez que el profesor paga (pasa de Freemium a plan de pago) |
| **renewal** | Renovación del mismo plan al final del ciclo |
| **upgrade** | Subir de plan (ej: Básico → Pro) |
| **downgrade** | Bajar de plan (ej: Pro → Básico) |

#### Reglas de Upgrade

**Regla única para todos los upgrades: pagar la diferencia, ciclo se reinicia.**

| Caso | Cálculo | Nuevo ciclo |
|---|---|---|
| Mensual → Mensual | Precio nuevo - Precio actual | Empieza hoy (mensual) |
| Anual → Anual | Precio nuevo - Precio actual | Empieza hoy (anual) |
| Mensual → Anual | Precio anual - Precio mensual actual | Empieza hoy (anual) |

**Ejemplos:**

```
MENSUAL → MENSUAL
Tiene: Básico ($30/mes)
Quiere: Pro ($50/mes)
Paga: $50 - $30 = $20
Nuevo ciclo: hoy → +1 mes

ANUAL → ANUAL
Tiene: Básico Anual ($300/año)
Quiere: Pro Anual ($500/año)
Paga: $500 - $300 = $200
Nuevo ciclo: hoy → +1 año

MENSUAL → ANUAL
Tiene: Básico Mensual ($30/mes)
Quiere: Pro Anual ($500/año)
Paga: $500 - $30 = $470
Nuevo ciclo: hoy → +1 año
```

#### Reglas de Downgrade

**El downgrade se aplica al final del ciclo actual, no inmediatamente.**

1. El admin registra el downgrade programado en el perfil del profesor
2. El campo `scheduled_downgrade_plan` se llena con el plan destino
3. El profesor ve un banner indicando: "Tu plan cambiará a [plan] el [fecha]"
4. Al llegar la fecha de `current_period_end`:
   - El plan cambia automáticamente
   - El campo `scheduled_downgrade_plan` se limpia
   - Si el nuevo plan es Freemium, el estado cambia a "freemium"

**Restricción de ciclo:**
- Un profesor con plan **anual** solo puede hacer downgrade a otro plan **anual** o a Freemium
- Si quiere cambiar a mensual, debe esperar a que termine su anualidad

#### Reglas de Renovación

1. El profesor contacta a Daniel para renovar
2. Daniel registra el pago con tipo `renewal`
3. El campo `current_period_end` se extiende según el ciclo (mensual: +1 mes, anual: +1 año)

### 4.4 Suscripciones de Alumnos

Los productos del profesor pueden tener hasta 3 opciones de precio simultáneas. El alumno elige cuál le conviene.

#### Tipos de pago disponibles por producto

| Tipo | Comportamiento | Expiración |
|---|---|---|
| **Pago único** | Acceso permanente | Nunca expira |
| **Suscripción mensual** | Acceso mientras pague | +1 mes desde el pago |
| **Suscripción anual** | Acceso mientras pague | +1 año desde el pago |

*El profesor puede activar 1, 2 o las 3 opciones para cada producto.*

#### Flujo de suscripciones por Stripe

1. Alumno elige producto y tipo de suscripción
2. Completa checkout en Stripe → dinero va directo al profesor
3. Webhook crea enrollment con `expires_at` según tipo
4. Stripe cobra automáticamente cada mes/año
5. Webhook de `invoice.paid` extiende `expires_at`
6. Si falla el pago:
   - Stripe reintenta el cobro (comportamiento por defecto)
   - Se activa período de gracia de 3 días
   - Se envía email al alumno avisando del problema
7. Si no se recupera el pago en 3 días:
   - Webhook de `customer.subscription.deleted` revoca el enrollment
   - `is_active` = false

#### Flujo de suscripciones manuales (PayPal, transferencia, efectivo, cripto)

1. Alumno paga fuera de la plataforma
2. Profesor registra el pago desde el perfil del alumno
3. Sistema crea enrollment con `expires_at`:
   - Mensual: +1 mes desde hoy
   - Anual: +1 año desde hoy
   - Pago único: null (sin expiración)
4. Cuando se acerca la expiración:
   - 7 días antes: email automático al alumno recordando renovar
   - 7 días antes: banner visible para el profesor en el perfil del alumno
5. Si el alumno renueva, profesor registra nuevo pago y se extiende `expires_at`
6. Si no renueva, al llegar `expires_at`:
   - `is_active` = false
   - Alumno pierde acceso

#### Período de gracia

| Situación | Duración | Acción |
|---|---|---|
| Fallo de pago en Stripe | 3 días | Stripe reintenta, si no se recupera → revocación |
| Expiración de pago manual | 0 días | Revocación inmediata al llegar `expires_at` |

#### Notificaciones al alumno

| Momento | Notificación |
|---|---|
| 7 días antes de expirar | Email: "Tu acceso a [curso] expira el [fecha]. Renueva para no perder acceso." |
| Día de expiración | Email: "Tu acceso a [curso] ha expirado." |
| Fallo de pago Stripe | Email: "Hubo un problema con tu pago. Actualiza tu método de pago." |

#### Avisos al profesor

| Momento | Aviso |
|---|---|
| 7 días antes de expirar (manual) | Banner en perfil del alumno: "⚠️ Acceso a [curso] expira el [fecha]" |
| Alumno con pago fallido (Stripe) | Banner: "⚠️ Pago fallido - período de gracia activo" |

### 4.5 Flujo de Dinero

```
Alumno → paga → Profesor (Stripe Connect / métodos propios)
Profesor → paga suscripción → Daniel (manual inicialmente)
```

**Regla crítica:** Daniel NUNCA toca el dinero del alumno.

---

## 5. Flujos de Usuario

### 5.1 Flujo del Alumno

1. Entra al HUB del profesor (acroshub.com/trading).
2. Ve la sección "Descubrir" con productos disponibles y previews.
3. Elige un producto y hace clic en "Comprar".
4. Es redirigido al checkout de Stripe del profesor.
5. Completa el pago (el dinero va directo al profesor).
6. Webhook de Stripe activa su enrollment automáticamente.
7. Accede al contenido desde "Mis productos".
8. Ve las clases, completa quizzes, deja comentarios.
9. Recibe email cuando hay contenido nuevo.

### 5.2 Flujo del Profesor

1. Se registra en Acroshub (estado freemium automático).
2. Crea su primer HUB y configura nombre/slug.
3. Crea cursos, módulos y clases.
4. Sube videos a Bunny.net o importa desde YouTube/Drive.
5. Configura precios (pago único o suscripción).
6. Conecta su cuenta de Stripe (Stripe Connect Express).
7. Comparte el link de su HUB con sus seguidores.
8. Los alumnos compran y el dinero le llega directo.
9. Gestiona alumnos desde su panel:
   - Ve lista de alumnos con búsqueda
   - Entra al perfil de un alumno para ver detalle
   - Registra pagos manuales (PayPal, transferencia, efectivo, cripto)
   - Asigna accesos a productos (con o sin pago)
   - Revoca o extiende accesos
   - Ve historial de pagos y total pagado por alumno
   - Ve progreso del alumno en cursos
10. Ve reportes de ventas globales (solo lectura) y cantidad de alumnos.

### 5.3 Flujo del Super Admin (Daniel)

1. Accede al panel de administración.
2. Ve lista de todos los tenants (profesores).
3. Entra al perfil de un profesor para:
   - Ver su información y estadísticas
   - Registrar pagos (primer pago, renovación, upgrade)
   - Programar downgrades
   - Ver historial de pagos
   - Suspender cuenta (solo emergencias)
4. En la vista global de Ventas, ve métricas y gráficas consolidadas.
5. Configura límites y precios de planes desde Configuración.

---

## 6. MVP - Producto Mínimo Viable

### 6.1 Estado Actual

El prototipo visual de toda la plataforma (fase UI) está 100% completo, estabilizado y testeado en los flujos de roles Super Admin, Profesor y Alumno usando React + Vite con shadcn/ui. Las vistas incluyen lógica compleja simulada de estado como theaming de colores inyectado dinámicamente por Hub, catálogo híbrido de cursos/ebooks, jerarquía de navegación y flujos condicionales de compra interactivos. El siguiente paso bloqueante es iniciar el Backend Core (Supabase).

### 6.2 Lo que YA existe (Frontend)

- ✅ Landing page con propuesta de valor
- ✅ Auth UI (login/register)
- ✅ Panel Super Admin con gestión de profesores, configuración de planes y dashboard de Ventas
- ✅ Panel Profesor con CRUD de HUBs, cursos, módulos, clases
- ✅ Gestión de alumnos UI
- ✅ Reportes de ventas UI
- ✅ HUB público con catálogo y reproductor
- ✅ Sistema de comentarios UI
- ✅ Sistema de quizzes UI
- ✅ Navegación entre roles
- ✅ Integración unificada de E-Books y Cursos en catálogos
- ✅ Vistas de Ventas dinámicas (Stripe/Manual/Bloqueo Condicional)
- ✅ Theming dinámico por Hub (colores personalizados inyectados como HSL)
- ✅ Notificaciones y Alertas In-App para Suscripciones
- ✅ Navegación jerárquica con barra de retroceso contextual
- ✅ Portal del Alumno: Ajustes de Perfil y Panel de Suscripciones (cancelaciones)
- ✅ Dashboard del Profesor: Flujo interactivo de Onboarding (Checklist inicial)
- ✅ Panel Super Admin: Buscador global en cabecera

### 6.3 Lo que FALTA implementar (Backend)

- ⬜ Conectar Supabase Auth (email + password)
- ⬜ Crear schema de base de datos con RLS
- ⬜ Implementar queries con React Query + Supabase client
- ⬜ Lógica de suscripciones (upgrades, downgrades, renovaciones)
- ⬜ Subida de videos a Bunny.net CDN
- ⬜ URLs firmadas para videos protegidos
- ⬜ Integración Stripe Connect Express
- ⬜ Webhooks de Stripe para enrollments automáticos
- ⬜ Envío de emails con Resend
- ⬜ Ciclo de vida automatizado del tenant

### 6.4 Prioridad de Implementación Backend

| Prioridad | Tarea | Complejidad |
|---|---|---|
| P0 | Supabase Auth (login/register con roles) | Media |
| P0 | Schema de DB + RLS | Media |
| P0 | CRUD de HUBs, cursos, módulos, clases | Media |
| P0 | Gestión de alumnos y enrollments manuales | Baja |
| P0 | Registro de pagos y lógica de suscripciones | Media |
| P1 | Subida de videos a Bunny.net | Media |
| P1 | Reproductor con URLs firmadas | Media |
| P2 | Stripe Connect para profesores | Alta |
| P2 | Webhooks de Stripe | Media |
| P3 | Emails con Resend | Baja |
| P3 | Ciclo de vida automatizado | Alta |

---

## 7. Roadmap de Desarrollo

### 7.1 Fase 1: Backend Core (Semanas 1-3)

| Semana | Tareas | Entregable |
|---|---|---|
| Semana 1 | Supabase Auth + Schema de DB + RLS | Auth funcional con 3 roles |
| Semana 2 | CRUD de HUBs, cursos, módulos, clases conectado | Panel profesor funcional |
| Semana 3 | Enrollments manuales + Panel admin + Lógica de suscripciones | MVP sin pagos funcionando |

### 7.2 Fase 2: Videos y Contenido (Semanas 4-5)

| Semana | Tareas | Entregable |
|---|---|---|
| Semana 4 | Integración Bunny.net + Upload de videos | Videos subiendo a CDN |
| Semana 5 | URLs firmadas + Reproductor seguro | Videos protegidos funcionando |

### 7.3 Fase 3: Pagos (Semanas 6-8)

| Semana | Tareas | Entregable |
|---|---|---|
| Semana 6 | Stripe Connect onboarding para profesores | Profesores conectan Stripe |
| Semana 7 | Checkout + Webhooks de Stripe | Compras automáticas |
| Semana 8 | Testing + Deploy producción | MVP completo en producción |

### 7.4 Fase 4: Extras (Semanas 9-12)

- Emails transaccionales con Resend
- Ciclo de vida automatizado del tenant
- Cupones y descuentos
- Optimizaciones de performance

---

## 8. Métricas Clave (KPIs)

| Métrica | Objetivo MVP | Objetivo Mes 6 | Objetivo Año 1 |
|---|---|---|---|
| Profesores activos | 10 | 100 | 500+ |
| Alumnos totales | 50 | 1,000 | 10,000 |
| HUBs creados | 10 | 150 | 750 |
| Cursos publicados | 15 | 300 | 1,500 |
| Revenue mensual | $300 USD | $3,000 USD | $15,000 USD |
| Churn de profesores | <10% | <8% | <5% |

---

## 9. Prompts para Desarrollo con AI

Prompts optimizados para Google Antigravity / Cursor con el stack actual (React + Vite + Supabase).

### 9.1 Prompt - Conectar Supabase Auth

```
Conecta Supabase Auth al proyecto. El proyecto usa React 18 + Vite + TypeScript + React Router DOM v6.

Requisitos:
1. Instalar @supabase/supabase-js
2. Crear cliente de Supabase en src/lib/supabase.ts
3. Crear AuthContext con provider en src/contexts/AuthContext.tsx
4. Estados: user, loading, signIn, signUp, signOut
5. Guardar el rol del usuario (super_admin, profesor, alumno) en user_metadata
6. Crear hook useAuth() para acceder al contexto
7. Crear componente ProtectedRoute que redirija a /login si no está autenticado
8. Crear componente RoleRoute que verifique el rol (ej: solo admin puede acceder a /admin)
9. Conectar los formularios de /login y /register existentes al auth de Supabase
10. Después del login, redirigir según rol: admin→/admin, profesor→/dashboard, alumno→/mi-cuenta

Variables de entorno necesarias:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
```

### 9.2 Prompt - Schema de Base de Datos

```
Crea el schema de Supabase para Acroshub. Ejecutar en el SQL Editor de Supabase.

Tablas necesarias:
1. tenants (id, user_id FK, plan, status, billing_cycle, current_period_start, current_period_end, scheduled_downgrade_plan, slug, emergency_email, stripe_account_id, created_at)
2. hubs (id, tenant_id FK, name, slug, description, colors JSONB, logo_url, cover_url, created_at)
3. products (id, hub_id FK, type ENUM, name, description, price_one_time, price_subscription, stripe_price_id, created_at)
4. courses (id, product_id FK, hub_id FK)
5. modules (id, course_id FK, name, position, created_at)
6. lessons (id, module_id FK, name, position, video_url, video_source ENUM, pdf_url, text_content, is_preview, created_at)
7. quizzes (id, lesson_id FK, questions JSONB)
8. ebooks (id, product_id FK, hub_id FK, pdf_url)
9. enrollments (id, user_id FK, product_id FK, tenant_id FK, origin ENUM, is_active, expires_at, stripe_subscription_id, created_at)
10. lesson_progress (id, user_id FK, lesson_id FK, tenant_id FK, completed_at)
11. quiz_attempts (id, user_id FK, quiz_id FK, tenant_id FK, score, answers JSONB, attempted_at)
12. comments (id, lesson_id FK, user_id FK, tenant_id FK, parent_id FK nullable, content, created_at)
13. platform_subscriptions (id, tenant_id FK, type ENUM, plan_from, plan_to, billing_cycle ENUM, amount DECIMAL, method ENUM, notes, created_at)

ENUMs necesarios:
- plan: freemium, basico, pro, enterprise, mantenimiento
- status: active, freemium, suspended
- billing_cycle: mensual, anual
- product_type: course, ebook, bundle, hub_access
- enrollment_origin: stripe, manual, gift
- enrollment_payment_type: one_time, monthly, yearly
- video_source: bunny, youtube, vimeo, drive
- subscription_type: first_payment, renewal, upgrade, downgrade
- platform_payment_method: manual, stripe
- student_payment_method: stripe, paypal, transfer, cash, crypto, other

Incluir:
- Foreign keys con ON DELETE CASCADE donde corresponda
- Índices en campos de búsqueda frecuente
- RLS policies para aislamiento de tenants
- Triggers para updated_at automático
```

### 9.3 Prompt - CRUD con React Query

```
Implementa los hooks de React Query para el CRUD de HUBs conectado a Supabase.

Archivo: src/hooks/useHubs.ts

Hooks necesarios:
1. useHubs(tenantId) - lista todos los HUBs del tenant
2. useHub(hubId) - obtiene un HUB específico
3. useCreateHub() - mutation para crear HUB
4. useUpdateHub() - mutation para actualizar HUB
5. useDeleteHub() - mutation para eliminar HUB

Requisitos:
- Usar @tanstack/react-query
- Usar el cliente de Supabase de src/lib/supabase.ts
- Invalidar queries relacionadas después de mutations
- Manejar errores con toast de sonner
- Tipar todo con TypeScript
- El tenantId viene del usuario autenticado (useAuth)

Conectar estos hooks a las páginas existentes:
- /dashboard/hubs (lista)
- /dashboard/hubs/:id (editor)
```

### 9.4 Prompt - Lógica de Suscripciones

```
Implementa la lógica de suscripciones para el panel de admin.

Archivo: src/hooks/useSubscriptions.ts

Funcionalidades:
1. useRegisterPayment() - mutation para registrar pagos (first_payment, renewal, upgrade, downgrade)
2. useTenantSubscription(tenantId) - obtiene datos de suscripción del tenant
3. useSubscriptionHistory(tenantId) - historial de pagos del tenant
4. useGlobalSales() - métricas globales para dashboard de ventas
5. useScheduleDowngrade() - programa un downgrade para el final del ciclo

Reglas de negocio:
- Upgrade: pagar diferencia, ciclo se reinicia desde hoy
- Downgrade: se programa para el final del ciclo actual (scheduled_downgrade_plan)
- Renewal: extiende current_period_end según billing_cycle
- Si el plan destino es freemium, el status cambia a "freemium"

El cálculo del monto se muestra como referencia, pero el admin ingresa el monto final manualmente.
```

### 9.5 Prompt - Upload de Videos a Bunny.net

```
Implementa el upload de videos a Bunny.net Stream en el editor de clases.

Requisitos:
1. Crear función de upload en src/lib/bunny.ts
2. El upload debe ser directo desde el frontend usando TUS protocol
3. Mostrar barra de progreso durante el upload
4. Al completar, guardar el video_id de Bunny en la tabla lessons
5. Para reproducir, generar URL firmada con expiración de 10 minutos
6. La URL firmada se genera en una Edge Function de Supabase (no exponer el token en frontend)

Variables de entorno:
- VITE_BUNNY_LIBRARY_ID
- BUNNY_API_KEY (solo en Edge Function)
- BUNNY_TOKEN_AUTH_KEY (solo en Edge Function)

Componentes a modificar:
- Editor de clase: agregar dropzone para video con progreso
- Reproductor: obtener URL firmada antes de mostrar el iframe
```

### 9.6 Prompt - Stripe Connect para Profesores

```
Implementa Stripe Connect Express para que los profesores reciban pagos directamente.

Flujo de onboarding:
1. Profesor hace clic en "Conectar Stripe" en /dashboard/config
2. Frontend llama a Edge Function que crea cuenta Express
3. Edge Function retorna URL de onboarding de Stripe
4. Profesor completa onboarding en Stripe
5. Stripe redirige de vuelta a /dashboard/config?stripe=success
6. Edge Function guarda stripe_account_id en tabla tenants

Flujo de compra:
1. Alumno hace clic en "Comprar" en /:slug/curso/:id
2. Frontend llama a Edge Function con product_id
3. Edge Function crea Checkout Session usando la cuenta del profesor
4. Alumno es redirigido a Stripe Checkout
5. Al pagar, Stripe llama webhook
6. Webhook crea enrollment en tabla enrollments

Edge Functions necesarias:
1. stripe-connect-onboarding
2. stripe-create-checkout
3. stripe-webhook (manejar checkout.session.completed)

Variables de entorno (en Supabase):
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
```

### 9.7 Prompt - Sistema de Comentarios Funcional

```
Conecta el sistema de comentarios existente a Supabase.

Requisitos:
1. Crear hook useComments(lessonId) que obtiene comentarios con sus respuestas
2. Crear hook useCreateComment() para publicar comentarios
3. Crear hook useDeleteComment() (solo el autor o el profesor puede eliminar)
4. Los comentarios se ordenan por fecha (más reciente primero)
5. Las respuestas aparecen anidadas bajo el comentario padre
6. Validar en backend: si parent_id != null, no puede tener hijos

Query para obtener comentarios con estructura anidada:
- Obtener comentarios donde parent_id IS NULL
- Para cada uno, obtener sus respuestas (parent_id = comment.id)
- Incluir datos del usuario (nombre, avatar)

RLS:
- Cualquier usuario autenticado puede crear comentarios
- Solo el autor o el profesor del tenant puede eliminar
- Todos pueden leer comentarios de lecciones donde tienen acceso
```

### 9.8 Prompt - Gestión de Alumnos y Pagos

```
Implementa la gestión de alumnos para el panel del profesor.

Archivos:
- src/hooks/useStudents.ts
- src/hooks/useStudentPayments.ts

HOOKS NECESARIOS:

useStudents():
1. useStudents() - lista todos los alumnos del tenant (desde enrollments)
2. useStudent(userId) - obtiene un alumno con sus enrollments y pagos
3. useStudentStats(userId) - métricas: total pagado, cursos activos, progreso

useStudentPayments():
1. useStudentPayments(userId) - historial de pagos del alumno
2. useRegisterStudentPayment() - mutation para registrar pago manual
3. useTotalPaidByStudent(userId) - suma total de pagos

useEnrollments():
1. useStudentEnrollments(userId) - enrollments del alumno
2. useAddEnrollment() - agregar acceso (con o sin pago)
3. useRevokeEnrollment() - revocar acceso a un producto
4. useExtendEnrollment() - extender fecha de expiración

LÓGICA DE NEGOCIO:

Registrar pago manual:
1. Profesor selecciona producto y monto
2. Se crea registro en student_payments
3. Se crea enrollment automáticamente si no existe
4. Si el enrollment ya existe, se puede extender

Métodos de pago soportados:
- stripe (viene de webhook automático)
- paypal
- transfer (transferencia bancaria)
- cash (efectivo)
- crypto (criptomonedas)
- other (otro)

DATOS A MOSTRAR EN DETALLE DEL ALUMNO:

Información básica:
- Nombre, email, fecha de primer acceso al HUB
- Total pagado (suma de student_payments)
- Cantidad de productos activos

Productos con acceso (tabla):
- Producto, tipo, origen, fecha acceso, expiración, estado
- Acciones: Revocar, Extender

Historial de pagos (tabla):
- Fecha, producto, monto, método, notas

Progreso por curso (colapsable):
- % completado, última clase vista, última actividad
- Quizzes: intentos y mejor nota

RLS:
- Profesor solo ve alumnos que tienen enrollments en su tenant
- Profesor solo puede crear/editar student_payments de su tenant
```

---

## 10. Consideraciones Finales

### 10.1 Decisiones Explícitas (Lo que NO se construye)

- No se usa Hotmart, Skool, Teachable ni ningún LMS existente
- Daniel no intermedia pagos entre alumnos y profesores
- Sin sistema de afiliados
- Sin comunidad/foro (solo comentarios por clase)
- Sin certificados automáticos
- El registro de alumnos nunca ocurre en el dominio del profesor
- No hay app móvil nativa en el MVP (web responsiva primero)
- Solo español para el MVP
- Las notificaciones a alumnos NUNCA atribuyen la causa del cierre al profesor

### 10.2 Criterios de Éxito del MVP

- Al menos 10 profesores activos con contenido publicado
- Sistema de videos funcionando con protección (URLs firmadas)
- Quizzes y comentarios operativos
- Aislamiento de tenants verificado (RLS funcionando)
- Tiempo de carga de la web app < 3 segundos
- Cero bugs críticos de seguridad

### 10.3 Archivos Clave del Proyecto

```
src/
├── lib/
│   ├── supabase.ts          # Cliente de Supabase
│   ├── bunny.ts             # Funciones de Bunny.net
│   └── utils.ts             # Utilidades generales
├── contexts/
│   └── AuthContext.tsx      # Contexto de autenticación
├── hooks/
│   ├── useAuth.ts           # Hook de autenticación
│   ├── useHubs.ts           # CRUD de HUBs
│   ├── useCourses.ts        # CRUD de cursos
│   ├── useLessons.ts        # CRUD de clases
│   ├── useEnrollments.ts    # Gestión de enrollments
│   ├── useComments.ts       # Sistema de comentarios
│   ├── useSubscriptions.ts  # Lógica de suscripciones (admin)
│   ├── useStudents.ts       # Gestión de alumnos (profesor)
│   └── useStudentPayments.ts # Pagos de alumnos (profesor)
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   ├── ProtectedRoute.tsx   # Rutas protegidas
│   └── RoleRoute.tsx        # Rutas por rol
└── pages/
    ├── admin/               # Panel admin
    ├── dashboard/           # Panel profesor
    │   └── alumnos/
    │       ├── index.tsx    # Lista de alumnos
    │       └── [id].tsx     # Detalle del alumno
    └── [slug]/              # HUB público
```

### 10.4 Próximos Pasos Inmediatos

1. ⬜ Crear proyecto en Supabase
2. ⬜ Configurar variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
3. ⬜ Ejecutar schema SQL en Supabase
4. ⬜ Implementar AuthContext y conectar login/register
5. ⬜ Crear hooks de React Query para CRUD básico
6. ⬜ Implementar lógica de suscripciones
7. ⬜ Probar aislamiento de tenants con RLS

---

*— Fin del documento —*

*CONFIDENCIAL | Acroshub | Marzo 2026*