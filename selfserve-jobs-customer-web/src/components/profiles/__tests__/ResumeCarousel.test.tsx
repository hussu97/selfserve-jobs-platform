import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResumeCarousel } from '../ResumeCarousel';

type ObservedResize = {
  callback: ResizeObserverCallback;
  disconnect: ReturnType<typeof vi.fn>;
  observe: ReturnType<typeof vi.fn>;
  trigger: (width: number) => void;
};

const observedResizes: ObservedResize[] = [];

class MockResizeObserver {
  callback: ResizeObserverCallback;
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    observedResizes.push({
      callback,
      disconnect: this.disconnect,
      observe: this.observe,
      trigger: (width: number) => {
        callback(
          [{ contentRect: { width } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      },
    });
  }
}

vi.mock('react-pdf', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  return {
    pdfjs: {
      GlobalWorkerOptions: {
        workerSrc: '',
      },
    },
    Document: ({
      children,
      onLoadSuccess,
    }: {
      children: React.ReactNode;
      onLoadSuccess: (result: { numPages: number }) => void;
    }) => {
      React.useEffect(() => {
        onLoadSuccess({ numPages: 2 });
      }, [onLoadSuccess]);

      return <div data-testid="pdf-document">{children}</div>;
    },
    Page: ({ pageNumber, width }: { pageNumber: number; width: number }) => (
      <div data-testid={`pdf-page-${pageNumber}`} data-width={width}>
        PDF page {pageNumber}
      </div>
    ),
  };
});

describe('ResumeCarousel', () => {
  beforeEach(() => {
    observedResizes.length = 0;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders PDF pages from the measured viewer width instead of a fallback width', async () => {
    render(<ResumeCarousel url="https://example.com/resume.pdf" />);

    expect(await screen.findAllByText('Measuring resume width...')).toHaveLength(2);
    expect(screen.queryByTestId('pdf-page-1')).not.toBeInTheDocument();

    act(() => {
      observedResizes[0].trigger(642);
    });

    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toHaveAttribute('data-width', '642');
    });
    expect(screen.getByTestId('pdf-page-2')).toHaveAttribute('data-width', '642');
  });

  it('keeps rendered pages synced to later viewer width changes', async () => {
    render(<ResumeCarousel url="https://example.com/resume.pdf" />);

    expect(await screen.findAllByText('Measuring resume width...')).toHaveLength(2);

    act(() => {
      observedResizes[0].trigger(500);
    });

    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toHaveAttribute('data-width', '500');
    });

    act(() => {
      observedResizes[0].trigger(728);
    });

    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toHaveAttribute('data-width', '728');
    });
    expect(screen.getByTestId('pdf-page-2')).toHaveAttribute('data-width', '728');
  });
});
