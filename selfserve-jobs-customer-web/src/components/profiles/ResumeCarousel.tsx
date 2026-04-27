'use client';

import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface ResumeCarouselProps {
  url: string;
}

const FALLBACK_PAGE_WIDTH = 860;

export function ResumeCarousel({ url }: ResumeCarouselProps) {
  const [numPages, setNumPages] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pageWidth, setPageWidth] = useState(FALLBACK_PAGE_WIDTH);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = Math.max(280, Math.floor(entry.contentRect.width));
      setPageWidth((prev) => (prev === nextWidth ? prev : nextWidth));
    });

    resizeObserver.observe(frame);
    return () => resizeObserver.disconnect();
  }, []);

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
    const clampedIndex = Math.max(0, Math.min(index, numPages - 1));
    pageRefs.current[clampedIndex]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
          {numPages > 0 ? `Page ${activePage} of ${numPages}` : 'Loading pages'}
        </p>
        {numPages > 1 && (
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
              disabled={activePage === numPages}
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

      <Document
        file={url}
        loading={
          <div className="rounded-[1.5rem] bg-surface px-5 py-12 text-center text-sm text-text-muted">
            Loading resume pages...
          </div>
        }
        error={
          <div className="rounded-[1.5rem] bg-surface px-5 py-12 text-center text-sm text-text-muted">
            Unable to render the resume preview right now.
          </div>
        }
        onLoadSuccess={({ numPages: nextNumPages }) => {
          setNumPages(nextNumPages);
          setActivePage(1);
          setIsLoading(false);
          setHasError(nextNumPages === 0);
        }}
        onLoadError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      >
        {!hasError && (
          <div
            ref={trackRef}
            onScroll={updateActivePage}
            className="resume-strip flex snap-x snap-mandatory overflow-x-auto pb-2"
          >
            {Array.from({ length: numPages }, (_, index) => (
              <div
                key={`${url}-page-${index + 1}`}
                ref={(node) => {
                  pageRefs.current[index] = node;
                }}
                className="min-w-full shrink-0 snap-center px-1 sm:px-3"
              >
                <div
                  ref={index === 0 ? frameRef : undefined}
                  className="mx-auto w-full max-w-[860px] rounded-[1.5rem] bg-white shadow-ambient"
                >
                  <Page
                    pageNumber={index + 1}
                    width={pageWidth}
                    loading={
                      <div className="flex min-h-[420px] w-full items-center justify-center bg-surface text-sm text-text-muted">
                        Loading page {index + 1}...
                      </div>
                    }
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    className="resume-page"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Document>

      {isLoading && !hasError && numPages === 0 && (
        <div className="rounded-[1.5rem] bg-surface px-5 py-12 text-center text-sm text-text-muted">
          Preparing resume preview...
        </div>
      )}
    </div>
  );
}
