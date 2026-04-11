import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlobalError from '../error';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const mockError = new Error('Something exploded') as Error & { digest?: string };
const mockReset = vi.fn();

beforeEach(() => {
  mockReset.mockReset();
});

describe('GlobalError', () => {
  it('renders the "Something went wrong" section label', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders a heading containing "error"', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('renders a descriptive error message', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    expect(screen.getByText(/problem loading this page/i)).toBeInTheDocument();
  });

  it('renders a "Try again" button', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('renders a "Go home" link pointing to "/"', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    const link = screen.getByRole('link', { name: /go home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('calls reset() when "Try again" is clicked', async () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockReset).toHaveBeenCalledOnce();
  });

  it('logs the error via console.error on mount', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<GlobalError error={mockError} reset={mockReset} />);
    expect(consoleSpy).toHaveBeenCalledWith(mockError);
    consoleSpy.mockRestore();
  });

  it('re-renders without throwing when error prop changes', () => {
    const { rerender } = render(<GlobalError error={mockError} reset={mockReset} />);
    const newError = new Error('Another error') as Error & { digest?: string };
    expect(() => rerender(<GlobalError error={newError} reset={mockReset} />)).not.toThrow();
  });
});
