// ===== TYPES =====
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'profesor' | 'alumno';
  avatar?: string;
  createdAt: string;
}

export interface Profesor extends User {
  role: 'profesor';
  plan: 'freemium' | 'basico' | 'pro' | 'enterprise';
  status: 'activo' | 'freemium' | 'suspendido';
  billingCycle: 'mensual' | 'anual' | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  scheduledDowngradePlan: string | null;
  stripeConnected: boolean;
  stripeEmail?: string;
  emergencyEmail?: string;
}

export interface Alumno extends User {
  role: 'alumno';
  purchasedCourses: string[];
  completedLessons: string[];
}

export interface Hub {
  id: string;
  profesorId: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  logo?: string;
  primaryColor: string;
  coursesCount: number;
  studentsCount: number;
}

export interface Course {
  id: string;
  hubId: string;
  profesorId: string;
  title: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  modules: Module[];
  published: boolean;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  isFreePreview: boolean;
  videoUrl?: string;
  videoType?: 'upload' | 'youtube' | 'vimeo';
  content?: string;
  hasPdf: boolean;
  quiz?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Comment {
  id: string;
  lessonId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  parentId?: string;
  isRead?: boolean;
}

export interface Sale {
  id: string;
  profesorId: string;
  alumnoId: string;
  alumnoName: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  method: 'stripe' | 'manual';
  date: string;
}

export interface PlanConfig {
  name: string;
  key: string;
  maxHubs: number;
  maxStudents: number;
  maxCourses: number;
  maxLessonsPerCourse: number;
  maxEbooks: number;
  price: number;
  priceAnnual: number;
}

// ===== MOCK DATA =====

export const planConfigs: PlanConfig[] = [
  { name: 'Freemium', key: 'freemium', maxHubs: 1, maxStudents: 50, maxCourses: 3, maxLessonsPerCourse: 10, maxEbooks: 1, price: 0, priceAnnual: 0 },
  { name: 'Básico', key: 'basico', maxHubs: 2, maxStudents: 200, maxCourses: 10, maxLessonsPerCourse: 30, maxEbooks: 5, price: 29, priceAnnual: 290 },
  { name: 'Pro', key: 'pro', maxHubs: 5, maxStudents: 1000, maxCourses: 50, maxLessonsPerCourse: 100, maxEbooks: 20, price: 99, priceAnnual: 990 },
  { name: 'Enterprise', key: 'enterprise', maxHubs: -1, maxStudents: -1, maxCourses: -1, maxLessonsPerCourse: -1, maxEbooks: -1, price: 299, priceAnnual: 2990 },
];

export const profesores: Profesor[] = [
  {
    id: 'prof-1', name: 'Carlos Mendoza', email: 'carlos@trading.com', role: 'profesor',
    plan: 'pro', status: 'activo', billingCycle: 'anual', currentPeriodStart: '2025-01-05', currentPeriodEnd: '2026-01-05', scheduledDowngradePlan: null, stripeConnected: true, stripeEmail: 'carlos@stripe.com',
    emergencyEmail: 'carlos.emergencia@gmail.com', avatar: '', createdAt: '2024-08-15',
  },
  {
    id: 'prof-2', name: 'María García', email: 'maria@marketing.com', role: 'profesor',
    plan: 'basico', status: 'activo', billingCycle: 'mensual', currentPeriodStart: '2025-02-15', currentPeriodEnd: '2025-03-15', scheduledDowngradePlan: 'freemium', stripeConnected: true, stripeEmail: 'maria@stripe.com',
    emergencyEmail: 'maria.emergencia@gmail.com', avatar: '', createdAt: '2024-09-20',
  },
  {
    id: 'prof-3', name: 'Jorge Ramírez', email: 'jorge@fitness.com', role: 'profesor',
    plan: 'freemium', status: 'suspendido', billingCycle: null, currentPeriodStart: null, currentPeriodEnd: null, scheduledDowngradePlan: null, stripeConnected: false,
    avatar: '', createdAt: '2025-01-10',
  },
];

export const alumnos: Alumno[] = [
  { id: 'alu-1', name: 'Ana López', email: 'ana@mail.com', role: 'alumno', avatar: '', createdAt: '2024-10-01', purchasedCourses: ['course-1', 'course-3'], completedLessons: ['lesson-1-1', 'lesson-1-2'] },
  { id: 'alu-2', name: 'Pedro Sánchez', email: 'pedro@mail.com', role: 'alumno', avatar: '', createdAt: '2024-10-15', purchasedCourses: ['course-1'], completedLessons: ['lesson-1-1'] },
  { id: 'alu-3', name: 'Laura Martínez', email: 'laura@mail.com', role: 'alumno', avatar: '', createdAt: '2024-11-01', purchasedCourses: ['course-2', 'course-4'], completedLessons: [] },
  { id: 'alu-4', name: 'Diego Torres', email: 'diego@mail.com', role: 'alumno', avatar: '', createdAt: '2024-11-20', purchasedCourses: ['course-1', 'course-2'], completedLessons: ['lesson-1-1', 'lesson-1-2', 'lesson-1-3'] },
  { id: 'alu-5', name: 'Sofía Hernández', email: 'sofia@mail.com', role: 'alumno', avatar: '', createdAt: '2024-12-01', purchasedCourses: ['course-3'], completedLessons: [] },
  { id: 'alu-6', name: 'Miguel Ángel Ruiz', email: 'miguel@mail.com', role: 'alumno', avatar: '', createdAt: '2024-12-15', purchasedCourses: ['course-5'], completedLessons: ['lesson-5-1'] },
  { id: 'alu-7', name: 'Valentina Díaz', email: 'valentina@mail.com', role: 'alumno', avatar: '', createdAt: '2025-01-01', purchasedCourses: ['course-1', 'course-5'], completedLessons: [] },
  { id: 'alu-8', name: 'Andrés Moreno', email: 'andres@mail.com', role: 'alumno', avatar: '', createdAt: '2025-01-10', purchasedCourses: ['course-4'], completedLessons: ['lesson-4-1'] },
  { id: 'alu-9', name: 'Camila Vargas', email: 'camila@mail.com', role: 'alumno', avatar: '', createdAt: '2025-01-20', purchasedCourses: ['course-2'], completedLessons: [] },
  { id: 'alu-10', name: 'Roberto Castro', email: 'roberto@mail.com', role: 'alumno', avatar: '', createdAt: '2025-02-01', purchasedCourses: ['course-3', 'course-6'], completedLessons: ['lesson-3-1'] },
  { id: 'alu-11', name: 'Isabella Flores', email: 'isabella@mail.com', role: 'alumno', avatar: '', createdAt: '2025-02-10', purchasedCourses: ['course-6'], completedLessons: [] },
  { id: 'alu-12', name: 'Fernando Jiménez', email: 'fernando@mail.com', role: 'alumno', avatar: '', createdAt: '2025-02-20', purchasedCourses: ['course-1'], completedLessons: ['lesson-1-1'] },
];

const createQuiz = (prefix: string): QuizQuestion[] => [
  { id: `${prefix}-q1`, question: '¿Cuál es el concepto principal de esta lección?', options: ['Opción A correcta', 'Opción B', 'Opción C', 'Opción D'], correctIndex: 0 },
  { id: `${prefix}-q2`, question: '¿Qué herramienta se recomienda utilizar?', options: ['Herramienta 1', 'Herramienta 2 correcta', 'Herramienta 3'], correctIndex: 1 },
];

const createLessons = (moduleId: string, count: number, startId: number): Lesson[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `lesson-${startId + i}`,
    moduleId,
    title: `Clase ${i + 1}`,
    order: i + 1,
    isFreePreview: i === 0,
    videoUrl: i === 0 ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : undefined,
    videoType: 'youtube' as const,
    content: `<p>Contenido de ejemplo para la clase ${i + 1}. Aquí encontrarás material complementario y notas importantes.</p>`,
    hasPdf: i % 2 === 0,
    quiz: i === count - 1 ? createQuiz(`${moduleId}-l${i}`) : undefined,
  }));

export const hubs: Hub[] = [
  { id: 'hub-1', profesorId: 'prof-1', name: 'Trading Academy', slug: 'trading-academy', description: 'Aprende trading desde cero hasta nivel avanzado con estrategias probadas.', coverImage: '', primaryColor: '#2563EB', coursesCount: 3, studentsCount: 45, logo: '' },
  { id: 'hub-2', profesorId: 'prof-1', name: 'Crypto Mastery', slug: 'crypto-mastery', description: 'Domina el mundo de las criptomonedas y la inversión digital.', coverImage: '', primaryColor: '#7C3AED', coursesCount: 2, studentsCount: 28, logo: '' },
  { id: 'hub-3', profesorId: 'prof-2', name: 'Marketing Digital Pro', slug: 'marketing-digital', description: 'Estrategias de marketing digital para hacer crecer tu negocio.', coverImage: '', primaryColor: '#059669', coursesCount: 2, studentsCount: 62, logo: '' },
  { id: 'hub-4', profesorId: 'prof-3', name: 'FitLife Academy', slug: 'fitlife', description: 'Transforma tu cuerpo y mente con programas de fitness personalizados.', coverImage: '', primaryColor: '#DC2626', coursesCount: 1, studentsCount: 15, logo: '' },
];

export const courses: Course[] = [
  {
    id: 'course-1', hubId: 'hub-1', profesorId: 'prof-1', title: 'Trading desde Cero', description: 'Aprende los fundamentos del trading y empieza a operar con confianza.', image: '', price: 49.99, currency: 'USD', published: true,
    modules: [
      { id: 'mod-1-1', courseId: 'course-1', title: 'Introducción al Trading', order: 1, lessons: createLessons('mod-1-1', 4, 1) },
      { id: 'mod-1-2', courseId: 'course-1', title: 'Análisis Técnico', order: 2, lessons: createLessons('mod-1-2', 5, 5) },
      { id: 'mod-1-3', courseId: 'course-1', title: 'Gestión de Riesgo', order: 3, lessons: createLessons('mod-1-3', 3, 10) },
    ],
  },
  {
    id: 'course-2', hubId: 'hub-1', profesorId: 'prof-1', title: 'Estrategias Avanzadas', description: 'Técnicas avanzadas para traders experimentados.', image: '', price: 79.99, currency: 'USD', published: true,
    modules: [
      { id: 'mod-2-1', courseId: 'course-2', title: 'Price Action', order: 1, lessons: createLessons('mod-2-1', 4, 13) },
      { id: 'mod-2-2', courseId: 'course-2', title: 'Indicadores Avanzados', order: 2, lessons: createLessons('mod-2-2', 3, 17) },
    ],
  },
  {
    id: 'course-3', hubId: 'hub-2', profesorId: 'prof-1', title: 'Bitcoin y Blockchain', description: 'Comprende la tecnología detrás de Bitcoin y cómo invertir.', image: '', price: 39.99, currency: 'USD', published: true,
    modules: [
      { id: 'mod-3-1', courseId: 'course-3', title: '¿Qué es Bitcoin?', order: 1, lessons: createLessons('mod-3-1', 3, 20) },
      { id: 'mod-3-2', courseId: 'course-3', title: 'Wallets y Seguridad', order: 2, lessons: createLessons('mod-3-2', 4, 23) },
    ],
  },
  {
    id: 'course-4', hubId: 'hub-3', profesorId: 'prof-2', title: 'Marketing en Redes Sociales', description: 'Domina Instagram, TikTok y LinkedIn para tu negocio.', image: '', price: 59.99, currency: 'USD', published: true,
    modules: [
      { id: 'mod-4-1', courseId: 'course-4', title: 'Estrategia de Contenido', order: 1, lessons: createLessons('mod-4-1', 5, 27) },
      { id: 'mod-4-2', courseId: 'course-4', title: 'Publicidad Paga', order: 2, lessons: createLessons('mod-4-2', 4, 32) },
      { id: 'mod-4-3', courseId: 'course-4', title: 'Análisis y Métricas', order: 3, lessons: createLessons('mod-4-3', 3, 36) },
    ],
  },
  {
    id: 'course-5', hubId: 'hub-3', profesorId: 'prof-2', title: 'Email Marketing', description: 'Construye tu lista y genera ventas con email marketing.', image: '', price: 34.99, currency: 'USD', published: true,
    modules: [
      { id: 'mod-5-1', courseId: 'course-5', title: 'Fundamentos', order: 1, lessons: createLessons('mod-5-1', 3, 39) },
      { id: 'mod-5-2', courseId: 'course-5', title: 'Automatización', order: 2, lessons: createLessons('mod-5-2', 4, 42) },
    ],
  },
  {
    id: 'course-6', hubId: 'hub-4', profesorId: 'prof-3', title: 'Entrenamiento Funcional', description: 'Programa completo de entrenamiento funcional para todos los niveles.', image: '', price: 29.99, currency: 'USD', published: true,
    modules: [
      { id: 'mod-6-1', courseId: 'course-6', title: 'Calentamiento y Movilidad', order: 1, lessons: createLessons('mod-6-1', 3, 46) },
      { id: 'mod-6-2', courseId: 'course-6', title: 'Rutinas Principales', order: 2, lessons: createLessons('mod-6-2', 5, 49) },
      { id: 'mod-6-3', courseId: 'course-6', title: 'Nutrición Deportiva', order: 3, lessons: createLessons('mod-6-3', 3, 54) },
    ],
  },
];

export const comments: Comment[] = [
  { id: 'com-1', lessonId: 'lesson-1', userId: 'alu-1', userName: 'Ana López', text: '¡Excelente clase! Muy bien explicado.', createdAt: '2025-02-15T10:30:00Z', isRead: true },
  { id: 'com-2', lessonId: 'lesson-1', userId: 'alu-2', userName: 'Pedro Sánchez', text: 'Tengo una duda sobre el stop loss, ¿podrían explicar más?', createdAt: '2025-02-16T14:20:00Z', isRead: false },
  { id: 'com-3', lessonId: 'lesson-1', userId: 'prof-1', userName: 'Carlos Mendoza', text: '¡Claro Pedro! El stop loss lo cubrimos en detalle en el módulo 3. ¡No te lo pierdas!', createdAt: '2025-02-16T15:00:00Z', parentId: 'com-2', isRead: true },
  { id: 'com-4', lessonId: 'lesson-1', userId: 'alu-4', userName: 'Diego Torres', text: 'Gracias por este contenido, muy valioso.', createdAt: '2025-02-17T09:15:00Z', isRead: false },
  { id: 'com-5', lessonId: 'lesson-5', userId: 'alu-1', userName: 'Ana López', text: 'El análisis técnico es fascinante.', createdAt: '2025-02-18T11:00:00Z', isRead: false },
];

export const sales: Sale[] = [
  { id: 'sale-1', profesorId: 'prof-1', alumnoId: 'alu-1', alumnoName: 'Ana López', courseId: 'course-1', courseTitle: 'Trading desde Cero', amount: 49.99, method: 'stripe', date: '2025-01-15' },
  { id: 'sale-2', profesorId: 'prof-1', alumnoId: 'alu-2', alumnoName: 'Pedro Sánchez', courseId: 'course-1', courseTitle: 'Trading desde Cero', amount: 49.99, method: 'stripe', date: '2025-01-20' },
  { id: 'sale-3', profesorId: 'prof-1', alumnoId: 'alu-4', alumnoName: 'Diego Torres', courseId: 'course-1', courseTitle: 'Trading desde Cero', amount: 49.99, method: 'manual', date: '2025-02-01' },
  { id: 'sale-4', profesorId: 'prof-1', alumnoId: 'alu-4', alumnoName: 'Diego Torres', courseId: 'course-2', courseTitle: 'Estrategias Avanzadas', amount: 79.99, method: 'stripe', date: '2025-02-05' },
  { id: 'sale-5', profesorId: 'prof-1', alumnoId: 'alu-3', alumnoName: 'Laura Martínez', courseId: 'course-2', courseTitle: 'Estrategias Avanzadas', amount: 79.99, method: 'stripe', date: '2025-02-10' },
  { id: 'sale-6', profesorId: 'prof-2', alumnoId: 'alu-3', alumnoName: 'Laura Martínez', courseId: 'course-4', courseTitle: 'Marketing en Redes Sociales', amount: 59.99, method: 'stripe', date: '2025-02-12' },
  { id: 'sale-7', profesorId: 'prof-2', alumnoId: 'alu-6', alumnoName: 'Miguel Ángel Ruiz', courseId: 'course-5', courseTitle: 'Email Marketing', amount: 34.99, method: 'stripe', date: '2025-02-15' },
  { id: 'sale-8', profesorId: 'prof-1', alumnoId: 'alu-5', alumnoName: 'Sofía Hernández', courseId: 'course-3', courseTitle: 'Bitcoin y Blockchain', amount: 39.99, method: 'manual', date: '2025-02-18' },
  { id: 'sale-9', profesorId: 'prof-2', alumnoId: 'alu-8', alumnoName: 'Andrés Moreno', courseId: 'course-4', courseTitle: 'Marketing en Redes Sociales', amount: 59.99, method: 'stripe', date: '2025-02-20' },
  { id: 'sale-10', profesorId: 'prof-3', alumnoId: 'alu-10', alumnoName: 'Roberto Castro', courseId: 'course-6', courseTitle: 'Entrenamiento Funcional', amount: 29.99, method: 'stripe', date: '2025-03-01' },
  { id: 'sale-11', profesorId: 'prof-1', alumnoId: 'alu-7', alumnoName: 'Valentina Díaz', courseId: 'course-1', courseTitle: 'Trading desde Cero', amount: 49.99, method: 'stripe', date: '2025-03-05' },
  { id: 'sale-12', profesorId: 'prof-3', alumnoId: 'alu-11', alumnoName: 'Isabella Flores', courseId: 'course-6', courseTitle: 'Entrenamiento Funcional', amount: 29.99, method: 'manual', date: '2025-03-10' },
];

export interface PlatformSubscription {
  id: string;
  tenantId: string;
  type: "first_payment" | "renewal" | "upgrade" | "downgrade";
  planFrom: string | null;
  planTo: string;
  billingCycle: 'mensual' | 'anual';
  amount: number;
  method: 'manual' | 'stripe';
  notes: string | null;
  createdAt: string;
}

export const platformSubscriptions: PlatformSubscription[] = [
  {
    id: "ps1",
    tenantId: "prof-1",
    type: "first_payment",
    planFrom: null,
    planTo: "basico",
    billingCycle: "mensual",
    amount: 30,
    method: "manual",
    notes: null,
    createdAt: "2024-01-15"
  },
  {
    id: "ps2",
    tenantId: "prof-1",
    type: "upgrade",
    planFrom: "basico",
    planTo: "pro",
    billingCycle: "mensual",
    amount: 20,
    method: "manual",
    notes: "Upgrade mid-cycle, pagó diferencia",
    createdAt: "2024-02-20"
  },
  {
    id: "ps3",
    tenantId: "prof-2",
    type: "first_payment",
    planFrom: null,
    planTo: "basico",
    billingCycle: "mensual",
    amount: 29,
    method: "stripe",
    notes: null,
    createdAt: "2025-02-15"
  }
];

// Current logged-in user simulation
export type CurrentUserRole = 'admin' | 'profesor' | 'alumno' | null;

export interface StudentPayment {
  id: string;
  tenantId: string;
  userId: string;
  productId: string;
  amount: number;
  method: 'stripe' | 'paypal' | 'transfer' | 'cash' | 'crypto' | 'other';
  notes: string | null;
  createdAt: string;
}

export const studentPayments: StudentPayment[] = [
  { id: "sp1", tenantId: "prof-1", userId: "alu-1", productId: "course-1", amount: 97, method: "stripe", notes: null, createdAt: "2024-01-15T10:00:00Z" },
  { id: "sp2", tenantId: "prof-1", userId: "alu-1", productId: "course-2", amount: 50, method: "paypal", notes: "Pago parcial, resta $47", createdAt: "2024-02-20T10:00:00Z" },
  { id: "sp3", tenantId: "prof-1", userId: "alu-1", productId: "course-2", amount: 47, method: "transfer", notes: "Pago restante", createdAt: "2024-02-25T10:00:00Z" },
];

export interface StudentProgress {
  userId: string;
  lessonId: string;
  completedAt: string;
}

export const lessonProgress: StudentProgress[] = [
  { userId: "alu-1", lessonId: "lesson-1", completedAt: "2024-01-16T10:00:00Z" },
  { userId: "alu-1", lessonId: "lesson-2", completedAt: "2024-01-17T11:30:00Z" },
];

export const getCurrentProfesor = () => profesores[0]; // Carlos Mendoza
export const getCurrentAlumno = () => alumnos[0]; // Ana López

export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const getUnrepliedComments = (profesorId: string) => {
  const profCourses = courses.filter(c => c.profesorId === profesorId);
  const profLessonIds = new Set(profCourses.flatMap(c => c.modules.flatMap(m => m.lessons.map(l => l.id))));
  
  return comments.filter(c => 
    profLessonIds.has(c.lessonId) &&
    !c.parentId && // is main comment
    c.userId !== profesorId && // Not written by the professor themselves
    !comments.some(reply => reply.parentId === c.id && reply.userId === profesorId) // No reply from professor
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
