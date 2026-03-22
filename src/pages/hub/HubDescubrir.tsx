import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { hubs, courses, getCurrentAlumno } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayCircle, CheckCircle } from "lucide-react";

export default function HubDescubrir() {
  const { slug } = useParams();
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  
  const hub = hubs.find(h => h.slug === slug);
  const alumno = getCurrentAlumno();
  if (!hub) return null;

  const hubCourses = courses.filter(c => c.hubId === hub.id);

  const tieneAcceso = (courseId: string) => alumno.purchasedCourses.includes(courseId);

  return (
    <div className="animate-fade-in flex flex-col container mx-auto px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Catálogo de {hub.name}</h1>
        <p className="text-muted-foreground mt-1">Explora todos los programas educativos disponibles.</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-8">
        <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los productos</SelectItem>
            <SelectItem value="course">Solo Cursos</SelectItem>
            <SelectItem value="ebook">Solo Ebooks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid de productos */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {hubCourses.map(course => (
          <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-all group hover:-translate-y-1">
            {/* Thumbnail o placeholder */}
            <div className="h-44 bg-slate-100 flex items-center justify-center relative overflow-hidden">
              <img 
                src={`https://placehold.co/600x400/2563eb/ffffff?text=${encodeURIComponent(course.title)}`} 
                alt={course.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
              <PlayCircle className="h-12 w-12 text-white/80 absolute shadow-sm" />
            </div>
            
            <CardContent className="p-5">
              {/* Badge de tipo */}
              <Badge variant="secondary" className="mb-3 font-medium">Curso</Badge>
              
              <h3 className="font-bold text-lg line-clamp-2 leading-tight">{course.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                {course.description}
              </p>
              
              {/* Precios disponibles */}
              <div className="mt-4 space-y-1">
                <p className="text-xl font-extrabold text-primary">${course.price} <span className="text-xs font-normal text-muted-foreground">USD único</span></p>
              </div>
              
              {/* Estado del alumno */}
              {tieneAcceso(course.id) ? (
                <Button className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white" asChild>
                  <Link to={`/${slug}/curso/${course.id}`}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Ya tienes acceso
                  </Link>
                </Button>
              ) : (
                <Button className="w-full mt-6" asChild>
                  <Link to={`/${slug}/curso/${course.id}`}>Ver detalles</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
