import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Download, AlertTriangle, StretchHorizontal, StretchVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Using unpkg worker for react-pdf as recommended for simple Vite setups
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface EbookViewerProps {
  url: string;
  title: string;
}

export function EbookViewer({ url, title }: EbookViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [containerHeight, setContainerHeight] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 32);
        setContainerHeight(containerRef.current.clientHeight - 80);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.5, 4.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  
  const fitWidth = () => {
    const newScale = containerWidth / 600;
    setScale(Math.min(Math.max(newScale, 0.5), 2.5));
  };
  
  const fitHeight = () => {
    // Altura estándar de PDF ~840px. 
    const newScale = containerHeight / 840;
    setScale(Math.min(Math.max(newScale, 0.5), 2.5));
  };
  
  // Auto-fit initial load
  useEffect(() => {
    if (containerWidth > 0 && scale === 1.0) {
      fitWidth();
    }
  }, [containerWidth]);

  return (
    <div className="flex flex-col h-[80vh] w-full border rounded-2xl bg-card shadow-sm overflow-hidden" ref={containerRef}>
      {/* Control Bar */}
      <div className="h-14 bg-muted/50 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={zoomOut} title="Alejar"><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={zoomIn} title="Acercar"><ZoomIn className="h-4 w-4" /></Button>
          <div className="h-4 w-px bg-border mx-2" />
          <Button variant="ghost" size="icon" onClick={fitWidth} title="Ajustar al ancho"><StretchHorizontal className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={fitHeight} title="Ajustar al alto"><StretchVertical className="h-4 w-4" /></Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPageNumber(p => Math.max(p - 1, 1))} disabled={pageNumber <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium tabular-nums px-2 whitespace-nowrap">
            {pageNumber} / {numPages || '-'}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPageNumber(p => Math.min(p + 1, numPages))} disabled={pageNumber >= numPages || numPages === 0}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="hidden sm:flex gap-2" onClick={() => window.open(url, '_blank')}>
            <Download className="h-4 w-4" /> Descargar
          </Button>
        </div>
      </div>

      {/* PDF Viewport */}
      <div className="flex-1 overflow-auto bg-black/5 flex justify-center p-4 relative pt-6">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-transparent z-10 m-auto">
              <div className="relative flex items-center justify-center h-16 w-16 bg-white rounded-full shadow-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Preparando E-Book...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-full text-destructive gap-2 text-center p-6 w-full">
              <AlertTriangle className="h-10 w-10 mb-2 opacity-80" />
              <p className="font-semibold text-lg">No se pudo cargar el E-Book</p>
              <p className="text-sm opacity-80 max-w-sm">Verifica tu conexión a internet o decarga el archivo directamente con el botón.</p>
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-xl rounded-sm overflow-hidden bg-white mx-auto transition-transform origin-top"
            loading={<div className="h-[600px] w-full max-w-[800px] flex items-center justify-center bg-white shadow-xl animate-pulse mx-auto"><Loader2 className="h-8 w-8 animate-spin text-muted/30" /></div>}
          />
        </Document>
      </div>
    </div>
  );
}
