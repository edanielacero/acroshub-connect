# ACROSHUB
### *Tu plataforma de cursos, sin comisiones*

**Documento Maestro del Proyecto**
Versión 2.0 | Marzo 2026 | Autor: Daniel – Founder

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
- Activa/suspende/elimina cuentas de profesores manualmente
- Configura límites de cada plan (freemium, básico, pro, enterprise) desde su panel
- Cobra a los profesores de forma manual inicialmente (sin Stripe propio todavía)
- Agrega dominios custom para tenants enterprise via Vercel API

#### Profesor (Tenant Owner)

- Cliente directo de Daniel
- Cada profesor es un tenant completamente aislado (no ve datos de otros profesores)
- Puede tener múltiples HUBs (ej: "Trading", "Finanzas personales")
- Gestiona sus propios alumnos: registrarlos, asignar accesos, revocarlos
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

### 2.2 Jerarquía de Contenido

```
Profesor
└── HUB (puede tener múltiples por profesor)
    ├── Curso
    │   └── Módulo
    │       └── Clase (video + PDF + texto + quiz opcional)
    │           └── Preview gratuita (opcional, configurable por clase)
    ├── Ebook (PDF con visor seguro integrado, sin descarga)
    ├── Bundle (conjunto de cursos + ebooks a precio especial)
    └── HUB completo (producto que da acceso a todo el contenido del HUB)
```

**Tipos de productos comprables:**

| Producto | Descripción |
|---|---|
| Curso individual | Acceso a un curso específico |
| Ebook individual | PDF con visor seguro, sin descarga |
| Bundle | Varios cursos y/o ebooks juntos |
| HUB completo | Acceso a todo el contenido del HUB |

### 2.3 Sistema de Videos

| Fuente | Protección | Notas |
|---|---|---|
| Bunny.net CDN | URL firmada (~10 min expiración), sin descarga | Recomendado para contenido premium |
| YouTube/Vimeo/Drive | Sin protección (URL visible) | Advertencia al profesor al importar |

### 2.4 Sistema de Comentarios

- Comentarios por clase con capacidad de respuesta
- El profesor u otros alumnos pueden responder
- Un comentario principal puede tener varias respuestas
- **Regla crítica:** Las respuestas NO pueden tener otras respuestas (sin bucle)

### 2.5 Sistema de Quizzes

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
/admin/profesores/:id → Detalle de profesor
/admin/configuracion  → Configuración de planes

/dashboard            → Panel del Profesor
/dashboard/hubs       → Lista de HUBs
/dashboard/hubs/:id   → Editor de HUB
/dashboard/cursos/:id → Editor de curso
/dashboard/alumnos    → Gestión de alumnos
/dashboard/ventas     → Reportes de ventas
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
| status | ENUM | active / closed_to_new / maintenance / grace_1 / grace_2 / sunset / archived / deleted |
| slug | TEXT | Subdominio del profesor (ej: "trading") |
| emergency_email | TEXT | Email de contacto de emergencia |
| stripe_account_id | TEXT | ID de cuenta Stripe Connect |
| last_payment_at | TIMESTAMP | Último pago del profesor |
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
| price_one_time | DECIMAL | Precio de pago único |
| price_subscription | DECIMAL | Precio de suscripción mensual |
| stripe_price_id | TEXT | ID del precio en Stripe |
| created_at | TIMESTAMP | Fecha de creación |

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
| is_active | BOOLEAN | Si el acceso está activo |
| expires_at | TIMESTAMP | Fecha de expiración |
| stripe_subscription_id | TEXT | ID de suscripción en Stripe |

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

### 4.3 Flujo de Dinero

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

1. Se registra en Acroshub (acceso freemium automático).
2. Crea su primer HUB y configura nombre/slug.
3. Crea cursos, módulos y clases.
4. Sube videos a Bunny.net o importa desde YouTube/Drive.
5. Configura precios (pago único o suscripción).
6. Conecta su cuenta de Stripe (Stripe Connect Express).
7. Comparte el link de su HUB con sus seguidores.
8. Los alumnos compran y el dinero le llega directo.
9. Gestiona alumnos y accesos desde su panel.
10. Ve reportes de ventas y cantidad de alumnos.

### 5.3 Flujo del Super Admin (Daniel)

1. Accede al panel de administración.
2. Ve lista de todos los tenants (profesores).
3. Activa/suspende cuentas según pagos recibidos.
4. Configura límites de planes sin tocar código.
5. Agrega dominios custom para tenants enterprise.
6. Monitorea métricas globales de la plataforma.

---

## 6. MVP - Producto Mínimo Viable

### 6.1 Estado Actual

El prototipo visual está completo en React + Vite con shadcn/ui. Las páginas y componentes UI están creados. Falta conectar el backend (Supabase).

### 6.2 Lo que YA existe (Frontend)

- ✅ Landing page con propuesta de valor
- ✅ Auth UI (login/register)
- ✅ Panel Admin con lista de profesores y configuración de planes
- ✅ Panel Profesor con CRUD de HUBs, cursos, módulos, clases
- ✅ Gestión de alumnos UI
- ✅ Reportes de ventas UI
- ✅ HUB público con catálogo y reproductor
- ✅ Sistema de comentarios UI
- ✅ Sistema de quizzes UI
- ✅ Navegación entre roles

### 6.3 Lo que FALTA implementar (Backend)

- ⬜ Conectar Supabase Auth (email + password)
- ⬜ Crear schema de base de datos con RLS
- ⬜ Implementar queries con React Query + Supabase client
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
| Semana 3 | Enrollments manuales + Panel admin conectado | MVP sin pagos funcionando |

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
1. tenants (id, user_id FK, plan, status, slug, emergency_email, stripe_account_id, last_payment_at, created_at)
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

Incluir:
- ENUMs para plan, status, type, origin, video_source
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

### 9.4 Prompt - Upload de Videos a Bunny.net

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

### 9.5 Prompt - Stripe Connect para Profesores

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

### 9.6 Prompt - Sistema de Comentarios Funcional

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
│   └── useComments.ts       # Sistema de comentarios
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   ├── ProtectedRoute.tsx   # Rutas protegidas
│   └── RoleRoute.tsx        # Rutas por rol
└── pages/
    ├── admin/               # Panel admin
    ├── dashboard/           # Panel profesor
    └── [slug]/              # HUB público
```

### 10.4 Próximos Pasos Inmediatos

1. ⬜ Crear proyecto en Supabase
2. ⬜ Configurar variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
3. ⬜ Ejecutar schema SQL en Supabase
4. ⬜ Implementar AuthContext y conectar login/register
5. ⬜ Crear hooks de React Query para CRUD básico
6. ⬜ Probar aislamiento de tenants con RLS

---

*— Fin del documento —*

*CONFIDENCIAL | Acroshub | Marzo 2026*