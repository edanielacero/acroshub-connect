import { ProfesorLayout } from "@/components/layout/ProfesorLayout";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Book, UploadCloud, FileText, Trash2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Since we use mock data, we simulate the ebook object
const mockEbooks = [
  { id: "ebook-1", hubId: "hub-1", title: "Guía Definitiva de React", description: "Aprende a crear apps modernas", price: 19.99 }
];

export default function EbookEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ebook = mockEbooks.find(e => e.id === id) || { id, hubId: "hub-1", title: "Nuevo Ebook", description: "", price: 0 };
  
  // Controlled fields to track unsaved changes
  const [ebookTitle, setEbookTitle] = useState(ebook.title);
  const [ebookDescription, setEbookDescription] = useState(ebook.description);
  const [attachedFiles, setAttachedFiles] = useState<{name: string, size: string}[]>([]);
  
  // Unsaved changes tracking
  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState(false);

  // Compute Unsaved Changes
  const unsavedChanges = [];
  if (ebookTitle !== ebook.title) {
    unsavedChanges.push({ field: "Título del Ebook", original: ebook.title, new: ebookTitle });
  }
  if (ebookDescription !== ebook.description) {
    unsavedChanges.push({ field: "Descripción", original: ebook.description || "(Vacía)", new: ebookDescription || "(Vacía)" });
  }
  if (attachedFiles.length > 0) {
    unsavedChanges.push({ field: "Archivos del Ebook", original: "0 Archivos", new: `${attachedFiles.length} Archivos adjuntos` });
  }

  const handleBackClick = () => {
    if (unsavedChanges.length > 0) {
      setIsConfirmLeaveOpen(true);
    } else {
      navigate(`/dashboard/hubs/${ebook.hubId}/ebooks`);
    }
  };

  const simulateUpload = () => {
    toast.success("Archivo subido simulado");
    setAttachedFiles([...attachedFiles, { name: `libro-capitulos-${attachedFiles.length + 1}.pdf`, size: "4.2 MB" }]);
  };

  return (
    <ProfesorLayout>
      <div className="space-y-4 animate-fade-in pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input 
            value={ebookTitle} 
            onChange={(e) => setEbookTitle(e.target.value)} 
            className="px-0 text-xl font-bold border-none shadow-none focus-visible:ring-0 sm:text-2xl" 
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr]">
          <Card>
            <CardContent className="space-y-6 p-4 sm:p-6">
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Book className="h-4 w-4" />Introducción / Descripción Ampliada</Label>
                <Textarea 
                  rows={6} 
                  value={ebookDescription} 
                  onChange={e => setEbookDescription(e.target.value)} 
                  placeholder="Escribe la sinopsis o el contenido principal de lectura aquí..."
                />
              </div>

              <div className="space-y-4">
                <Label className="flex items-center gap-2"><UploadCloud className="h-4 w-4" />Archivo del Ebook (PDF, EPUB)</Label>
                
                {/* Zona de subida */}
                <div onClick={simulateUpload} className="rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors p-8 text-center cursor-pointer group">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UploadCloud className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Haz clic o arrastra el archivo de tu libro aquí</p>
                      <p className="text-sm text-muted-foreground mt-1">Soporta formatos PDF y EPUB (Máx. 100MB)</p>
                    </div>
                  </div>
                </div>

                {/* Lista de archivos subidos */}
                {attachedFiles.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {attachedFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-muted rounded-md shrink-0">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button className="w-full sm:w-auto" onClick={() => {
                toast.success("Contenido del Ebook guardado correctamente");
                navigate(`/dashboard/hubs/${ebook.hubId}/ebooks`);
              }}>Guardar Ebook</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* UNSAVED CHANGES DIALOG */}
      <Dialog open={isConfirmLeaveOpen} onOpenChange={setIsConfirmLeaveOpen}>
        <DialogContent className="sm:max-w-[600px] w-11/12 max-w-[95vw] p-4 sm:p-6 rounded-lg md:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Cambios sin guardar
            </DialogTitle>
            <DialogDescription>
              Aún no has guardado las últimas modificaciones hechas en tu Ebook.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 max-h-[50vh] overflow-y-auto w-full">
            <div className="rounded-md border overflow-hidden w-full overflow-x-auto">
              <table className="w-full text-sm min-w-full text-left max-w-full table-fixed">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 sm:px-4 font-medium min-w-[100px] w-[30%]">Campo</th>
                    <th className="px-3 py-2 sm:px-4 font-medium min-w-[100px] w-[35%]">Original</th>
                    <th className="px-3 py-2 sm:px-4 font-medium min-w-[100px] w-[35%]">Nuevo</th>
                  </tr>
                </thead>
                <tbody className="divide-y relative">
                  {unsavedChanges.map((change, i) => (
                    <tr key={i} className="bg-background">
                      <td className="px-3 sm:px-4 py-2 font-medium bg-background text-xs sm:text-sm truncate" title={change.field}>{change.field}</td>
                      <td className="px-3 sm:px-4 py-2 text-muted-foreground text-xs sm:text-sm bg-background border-l relative group">
                        <div className="truncate max-w-[60px] sm:max-w-none" title={change.original}>
                          {change.original}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 text-emerald-600 font-semibold bg-background text-xs sm:text-sm border-l relative group">
                        <div className="truncate max-w-[60px] sm:max-w-none" title={change.new}>
                          {change.new}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter className="sm:justify-between flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="destructive" className="w-full sm:w-auto order-3 sm:order-1" onClick={() => navigate(`/dashboard/hubs/${ebook.hubId}/ebooks`)}>
              Salir sin guardar
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsConfirmLeaveOpen(false)}>Cancelar</Button>
              <Button className="w-full sm:w-auto" onClick={() => {
                toast.success("Todos los cambios fueron guardados exitosamente."); 
                navigate(`/dashboard/hubs/${ebook.hubId}/ebooks`);
              }}>Guardar y salir</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfesorLayout>
  );
}
