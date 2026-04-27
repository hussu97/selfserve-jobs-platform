'use client';

import { useEffect, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/build/pdf.mjs';

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface ResumeCarouselProps {
  url: string;
}

interface RenderedPage {
  src: string;
  width: number;
  height: number;
}

const MAX_RENDER_WIDTH = 1200;
const FALLBACK_RENDER_WIDTH = 860;

export function ResumeCarousel({ url }: ResumeCarouselProps) {
  const [pageImages, setPageImages] = useState<RenderedPage[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [renderWidth, setRenderWidth] = useState(FALLBACK_RENDER_WIDTH);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = Math.max(320, Math.min(Math.floor(entry.contentRect.width - 32), FALLBACK_RENDER_WIDTH));
      setRenderWidth((prev) => (prev === nextWidth ? prev : nextWidth));
    });

    resizeObserver.observe(track);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: ReturnType<typeof getDocument> | null = null;
    let pdfDocument: { cleanup?: () => void; destroy?: () => Promise<void> } | null = null;

    async function renderPages() {
      setIsLoading(true);
      setHasError(false);
      setPageImages([]);
      setActivePage(1);

      try {
        loadingTask = getDocument(url);
        const loadedDocument = await loadingTask.promise;
        pdfDocument = loadedDocument;
        const renderedPages: RenderedPage[] = [];

        for (let pageNumber = 1; pageNumber <= loadedDocument.numPages; pageNumber += 1) {
          const page = await loadedDocument.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const widthScale = Math.min(renderWidth, MAX_RENDER_WIDTH) / baseViewport.width;
          const viewport = page.getViewport({ scale: widthScale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (!context) {
            throw new Error('Canvas context unavailable');
          }

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          if (cancelled) {
            return;
          }

          renderedPages.push({
            src: canvas.toDataURL('image/png'),
            width: canvas.width,
            height: canvas.height,
          });
        }

        if (!cancelled) {
          setPageImages(renderedPages);
          setHasError(renderedPages.length === 0);
        }
      } catch {
        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    renderPages();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
      pdfDocument?.cleanup?.();
      void pdfDocument?.destroy?.();
    };
  }, [renderWidth, url]);

  function updateActivePage() {
    const track = trackRef.current;
    if (!track || pageRefs.current.length === 0) return;

    const viewportCenter = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    pageRefs.current.forEach((page, index) => {
      if (!page) return;
      const pageCenter = page.offsetLeft + page.clientWidth / 2;
      const distance = Math.abs(pageCenter - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActivePage(closestIndex + 1);
  }

  function scrollToPage(index: number) {
    const clampedIndex = Math.max(0, Math.min(index, pageImages.length - 1));
    pageRefs.current[clampedIndex]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }

  if (isLoading) {
    return (
      <div className="rounded-[1.5rem] bg-surface px-5 py-12 text-center text-sm text-text-muted">
        Loading resume pages...
      </div>
    );
  }

  if (hasError || pageImages.length === 0) {
    return (
      <div className="rounded-[1.5rem] bg-surface px-5 py-12 text-center text-sm text-text-muted">
        Unable to render the resume preview right now.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
          Page {activePage} of {pageImages.length}
        </p>
        {pageImages.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollToPage(activePage - 2)}
              disabled={activePage === 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Previous resume page"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollToPage(activePage)}
              disabled={activePage === pageImages.length}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Next resume page"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        onScroll={updateActivePage}
        className="resume-strip flex snap-x snap-mandatory overflow-x-auto pb-2"
      >
        {pageImages.map((pageImage, index) => (
          <div
            key={`${url}-page-${index + 1}`}
            ref={(node) => {
              pageRefs.current[index] = node;
            }}
            className="min-w-full shrink-0 snap-center px-1 sm:px-3"
          >
            <div className="mx-auto w-full max-w-[860px] overflow-hidden rounded-[1.5rem] bg-white shadow-ambient">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pageImage.src}
                alt={`Resume page ${index + 1}`}
                className="block h-auto w-full"
                width={pageImage.width}
                height={pageImage.height}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
