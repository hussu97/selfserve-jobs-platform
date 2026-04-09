import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-primary">*</span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border-0 bg-surface px-5 py-3.5 text-sm transition-all text-text-main',
            'placeholder:text-text-muted/60',
            'focus:outline-none focus:ring-1 focus:ring-primary/30 focus:bg-surface-lowest',
            error
              ? 'bg-red-50 ring-1 ring-red-400'
              : '',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
