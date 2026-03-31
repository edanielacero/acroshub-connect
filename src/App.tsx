import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ActivarCuenta from "./pages/auth/ActivarCuenta";
import RoleSelector from "./pages/auth/RoleSelector";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfesores from "./pages/admin/AdminProfesores";
import AdminProfesorDetail from "./pages/admin/AdminProfesorDetail";
import AdminVentas from "./pages/admin/AdminVentas";
import AdminConfiguracion from "./pages/admin/AdminConfiguracion";
import AdminAlumnos from "./pages/admin/AdminAlumnos";
import AdminAlumnoDetail from "./pages/admin/AdminAlumnoDetail";

import ProfesorDashboard from "./pages/profesor/ProfesorDashboard";
import ProfesorHubs from "./pages/profesor/ProfesorHubs";
import HubEditor from "./pages/profesor/HubEditor";
import ProfesorHubCursos from "./pages/profesor/ProfesorHubCursos";
import ProfesorHubEbooks from "./pages/profesor/ProfesorHubEbooks";
import CourseEditor from "./pages/profesor/CourseEditor";
import EbookEditor from "./pages/profesor/EbookEditor";
import ProfesorComentarios from "./pages/profesor/ProfesorComentarios";
import ProfesorResponderComentarios from "./pages/profesor/ProfesorResponderComentarios";
import ProfesorAlumnos from "./pages/profesor/ProfesorAlumnos";
import ProfesorAlumnoDetail from "./pages/profesor/ProfesorAlumnoDetail";
import ProfesorVentas from "./pages/profesor/ProfesorVentas";
import ProfesorConfiguracion from "./pages/profesor/ProfesorConfiguracion";

import HubLanding from "./pages/hub/HubLanding";
import CursoDetalle from "./pages/hub/CursoDetalle";
import EbookDetalle from "./pages/hub/EbookDetalle";
import HubProductos from "./pages/hub/HubProductos";
import ClaseReproductor from "./pages/hub/ClaseReproductor";
import { PreviewProvider } from "./components/layout/PreviewProvider";

import AlumnoDashboard from "./pages/alumno/AlumnoDashboard";
import AlumnoAjustes from "./pages/alumno/AlumnoAjustes";
import AlumnoPagos from "./pages/alumno/AlumnoPagos";
import { AlumnoLayout } from "./components/alumno/AlumnoLayout";
import { HubLayout } from "./components/hub/HubLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { RoleRoute } from "./components/auth/ProtectedRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/activar-cuenta" element={<ActivarCuenta />} />
            
            <Route element={<RoleRoute allowedRoles={['profesor', 'alumno', 'super_admin']} />}>
              <Route path="/seleccionar-vista" element={<RoleSelector />} />
            </Route>

            {/* Admin */}
            <Route element={<RoleRoute allowedRoles={['super_admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/profesores" element={<AdminProfesores />} />
              <Route path="/admin/profesores/:id" element={<AdminProfesorDetail />} />
              <Route path="/admin/alumnos" element={<AdminAlumnos />} />
              <Route path="/admin/alumnos/:id" element={<AdminAlumnoDetail />} />
              <Route path="/admin/ventas" element={<AdminVentas />} />
              <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
            </Route>

            {/* Profesor */}
            <Route element={<RoleRoute allowedRoles={['profesor']} />}>
              <Route path="/dashboard" element={<ProfesorDashboard />} />
              <Route path="/dashboard/hubs" element={<ProfesorHubs />} />
              <Route path="/dashboard/hubs/:id" element={<HubEditor />} />
              <Route path="/dashboard/hubs/:id/cursos" element={<ProfesorHubCursos />} />
              <Route path="/dashboard/hubs/:id/ebooks" element={<ProfesorHubEbooks />} />
              <Route path="/dashboard/cursos/:id" element={<CourseEditor />} />
              <Route path="/dashboard/ebooks/:id" element={<EbookEditor />} />
              <Route path="/dashboard/comentarios" element={<ProfesorComentarios />} />
              <Route path="/dashboard/comentarios/responder" element={<ProfesorResponderComentarios />} />
              <Route path="/dashboard/alumnos" element={<ProfesorAlumnos />} />
              <Route path="/dashboard/alumnos/:id" element={<ProfesorAlumnoDetail />} />
              <Route path="/dashboard/ventas" element={<ProfesorVentas />} />
              <Route path="/dashboard/configuracion" element={<ProfesorConfiguracion />} />
            </Route>

            {/* Alumno */}
            <Route element={<RoleRoute allowedRoles={['alumno']} />}>
              <Route element={<AlumnoLayout />}>
                <Route path="/mi-cuenta" element={<AlumnoDashboard />} />
                <Route path="/mis-ajustes" element={<AlumnoAjustes />} />
                <Route path="/mis-pagos" element={<AlumnoPagos />} />
              </Route>
            </Route>

            {/* Hub public & student (Shared HubLayout) */}
            <Route path="/:slug" element={
              <PreviewProvider>
                <HubLayout />
              </PreviewProvider>
            }>
              <Route index element={<HubLanding />} />
              <Route path="curso/:id" element={<CursoDetalle />} />
              <Route path="ebook/:id" element={<EbookDetalle />} />
              <Route path="productos" element={<HubProductos />} />
              <Route path="clase/:id" element={<ClaseReproductor />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
