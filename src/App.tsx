import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfesores from "./pages/admin/AdminProfesores";
import AdminProfesorDetail from "./pages/admin/AdminProfesorDetail";
import AdminConfiguracion from "./pages/admin/AdminConfiguracion";

import ProfesorDashboard from "./pages/profesor/ProfesorDashboard";
import ProfesorHubs from "./pages/profesor/ProfesorHubs";
import HubEditor from "./pages/profesor/HubEditor";
import CourseEditor from "./pages/profesor/CourseEditor";
import ProfesorAlumnos from "./pages/profesor/ProfesorAlumnos";
import ProfesorVentas from "./pages/profesor/ProfesorVentas";
import ProfesorConfiguracion from "./pages/profesor/ProfesorConfiguracion";

import HubLanding from "./pages/hub/HubLanding";
import HubCourseDetail from "./pages/hub/HubCourseDetail";
import HubDiscover from "./pages/hub/HubDiscover";
import HubMyProducts from "./pages/hub/HubMyProducts";
import LessonPlayer from "./pages/hub/LessonPlayer";

import AlumnoDashboard from "./pages/alumno/AlumnoDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/profesores" element={<AdminProfesores />} />
          <Route path="/admin/profesores/:id" element={<AdminProfesorDetail />} />
          <Route path="/admin/configuracion" element={<AdminConfiguracion />} />

          {/* Profesor */}
          <Route path="/dashboard" element={<ProfesorDashboard />} />
          <Route path="/dashboard/hubs" element={<ProfesorHubs />} />
          <Route path="/dashboard/hubs/:id" element={<HubEditor />} />
          <Route path="/dashboard/cursos/:id" element={<CourseEditor />} />
          <Route path="/dashboard/alumnos" element={<ProfesorAlumnos />} />
          <Route path="/dashboard/ventas" element={<ProfesorVentas />} />
          <Route path="/dashboard/configuracion" element={<ProfesorConfiguracion />} />

          {/* Alumno */}
          <Route path="/mi-cuenta" element={<AlumnoDashboard />} />

          {/* Hub public */}
          <Route path="/:slug" element={<HubLanding />} />
          <Route path="/:slug/curso/:id" element={<HubCourseDetail />} />
          <Route path="/:slug/descubrir" element={<HubDiscover />} />
          <Route path="/:slug/mis-productos" element={<HubMyProducts />} />
          <Route path="/:slug/clase/:id" element={<LessonPlayer />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
