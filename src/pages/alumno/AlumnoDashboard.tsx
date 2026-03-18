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

  const purchasedCourseIds = alumno.purchasedCourses;
  const purchasedCourses = courses.filter(c => purchasedCourseIds.includes(c.id));
  const hubIds = [...new Set(purchasedCourses.map(c => c.hubId))];
  const myHubs = hubs.filter(h => hubIds.includes(h.id));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary sm:text-xl">
            <AcroshubLogo className="h-6 w-6 sm:h-7 sm:w-7" /> Acroshub
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full gap-2 sm:w-auto">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">{alumno.name.charAt(0)}</div>
                <span className="truncate">{alumno.name}</span>
                <ChevronDown className="h-4 w-4 shrink-0" />
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

      <main className="container py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold">Mis Academias</h1>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {myHubs.map(hub => {
            const hubCoursesCount = purchasedCourses.filter(c => c.hubId === hub.id).length;
            return (
              <Card key={hub.id} className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md" onClick={() => navigate(`/${hub.slug}/mis-productos`)}>
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <FolderOpen className="h-12 w-12 text-primary/40" />
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold">{hub.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{hubCoursesCount} cursos comprados</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
