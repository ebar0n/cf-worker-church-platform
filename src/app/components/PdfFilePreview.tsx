'use client';

import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

// Loaded only when a preview is expanded. Documents stay on this origin;
// no health or identity attachment is sent to an external PDF viewer.
export default function PdfFilePreview({ source, label }: { source: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(false);
  const [renderedPage, setRenderedPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | undefined;
    async function load() {
      try {
        const pdfjs = await import('pdfjs-dist');
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
        task = pdfjs.getDocument({ url: source, useSystemFonts: true });
        const pdf = await task.promise;
        if (!cancelled) setDocument(pdf);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
      void task?.destroy().catch(() => {});
    };
  }, [source]);

  useEffect(() => {
    if (!document) return;
    let cancelled = false;
    let renderTask: RenderTask | undefined;
    async function render() {
      try {
        const page = await document!.getPage(pageNumber);
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        const size = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(2, 1200 / size.width) });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        renderTask = page.render({ canvas, viewport });
        await renderTask.promise;
        if (!cancelled) setRenderedPage(pageNumber);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    void render();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber]);

  if (error)
    return (
      <p role="alert" className="mt-3 text-sm text-amber-800">
        No se pudo mostrar la vista previa. Si el PDF tiene contraseña o está dañado, sube una copia
        que se pueda abrir sin contraseña o una imagen en JPG o PNG.
      </p>
    );

  return (
    <div className="mt-3">
      {(!document || renderedPage !== pageNumber) && (
        <p role="status" className="text-sm text-gray-600">
          Cargando vista previa…
        </p>
      )}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Vista previa: ${label}, página ${pageNumber}`}
        className="h-auto w-full rounded border bg-white"
      />
      {document && (
        <div className="mt-2 flex items-center justify-between gap-2 text-sm">
          <button
            type="button"
            disabled={pageNumber === 1}
            onClick={() => setPageNumber((page) => page - 1)}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >
            Anterior
          </button>
          <span>
            Página {pageNumber} de {document.numPages}
          </span>
          <button
            type="button"
            disabled={pageNumber === document.numPages}
            onClick={() => setPageNumber((page) => page + 1)}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
