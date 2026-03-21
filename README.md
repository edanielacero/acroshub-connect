# AcrosHub Connect

AcrosHub Connect es una plataforma web moderna de educación en línea (e-learning) y gestión para creadores de contenido (modo academia/hub). Permite a los instructores establecer su presencia, vender cursos, gestionar estudiantes y permite a los alumnos consumir el contenido de manera interactiva.

## 🚀 Tecnologías Principales

- **Frontend Framework:** React 18 con Vite
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Componentes UI:** [shadcn/ui](https://ui.shadcn.com/) (basado en Radix UI y Lucide React)
- **Enrutamiento:** React Router DOM v6
- **Manejo de Estado/Datos:** React Query (@tanstack/react-query)
- **Formularios:** React Hook Form + Zod
- **Testing:** Playwright & Vitest

## 👥 Arquitectura de Roles

La plataforma está dividida en varias áreas funcionales según el rol de los usuarios:

1. **👨‍🏫 Profesores / Creadores (`/dashboard`)**
   - El núcleo del proyecto. Los profesores pueden crear y gestionar "Hubs" (Academias).
   - Generación de cursos, carga de lecciones y edición mediante herramientas interactivas.
   - Panel administrativo para métricas, control de alumnos, ventas y configuración general.

2. **🎓 Alumnos (`/mi-cuenta`)**
   - Panel dedicado a los estudiantes (Dashboard).
   - Acceso a sus productos comprados.
   - Experiencia de visualización y aprendizaje a través del reproductor de clases (`LessonPlayer`).

3. **⚙️ Administradores Globales (`/admin`)**
   - Gestión integral de la plataforma.
   - Administración de profesores registrados, visualización de métricas de la plataforma y configuración general.

4. **🌐 Vista Pública - Hubs (`/:slug`)**
   - Cada perfil de academia tiene un portal público único o "Hub" (`acroshub.com/mi-academia`).
   - Descubrimiento de catálogo, detalles de cursos y aterrizaje para adquisición.

## 📦 Funciones Disponibles Scripts

- \`npm run dev\`: Inicia el servidor de desarrollo local de Vite.
- \`npm run build\`: Compila la aplicación para producción.
- \`npm run lint\`: Ejecuta ESLint sobre el código.
- \`npm run test\`: Inicia las pruebas de unidad / componentes con Vitest.
- \`npm run preview\`: Sirve localmente la compilación de producción para revisar.
