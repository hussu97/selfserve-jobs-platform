declare module 'pdfjs-dist/build/pdf.mjs' {
  interface PdfViewport {
    width: number;
    height: number;
  }

  interface PdfPageRenderTask {
    promise: Promise<void>;
  }

  interface PdfPageProxy {
    getViewport(options: { scale: number }): PdfViewport;
    render(options: {
      canvasContext: CanvasRenderingContext2D;
      viewport: PdfViewport;
    }): PdfPageRenderTask;
  }

  interface PdfDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfPageProxy>;
    cleanup(): void;
    destroy(): Promise<void>;
  }

  interface PdfLoadingTask {
    promise: Promise<PdfDocumentProxy>;
    destroy(): void;
  }

  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  export function getDocument(src: string | { url: string }): PdfLoadingTask;
}
