import { getCurrentAlumno, hubs, courses } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { FolderOpen, LogOut, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";

export default function AlumnoDashboard() {
  const alumno = getCurrentAlumno();
  const navigate = useNavigate();

  // Find hubs where alumno has purchased courses
  const purchasedCourseIds = alumno.purchasedCourses;
  const purchasedCourses = courses.filter(c => purchasedCourseIds.includes(c.id));
  const hubIds = [...new Set(purchasedCourses.map(c => c.hubId))];
  const myHubs = hubs.filter(h => hubIds.includes(h.id));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <AcroshubLogo className="h-7 w-7" /> Acroshub
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">{alumno.name.charAt(0)}</div>
                <span className="hidden sm:inline">{alumno.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/')}>
                <LogOut className="mr-2 h-4 w-4" />Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Mis Academias</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {myHubs.map(hub => {
            const hubCoursesCount = purchasedCourses.filter(c => c.hubId === hub.id).length;
            return (
              <Card key={hub.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/${hub.slug}/mis-productos`)}>
                <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <FolderOpen className="h-12 w-12 text-primary/40" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">{hub.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{hubCoursesCount} cursos comprados</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
