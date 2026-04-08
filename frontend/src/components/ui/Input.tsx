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
            className="text-sm font-medium"
            style={{ color: 'var(--color-text)' }}
          >
            {label}
            {props.required && (
              <span className="ml-1" style={{ color: 'var(--color-primary)' }}>*</span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
            'placeholder:text-[#7A7067]',
            'focus:outline-none focus:ring-2 focus:ring-[#C2703E] focus:border-transparent',
            error
              ? 'border-red-400 bg-red-50'
              : 'border-[#DDD5C8] bg-white hover:border-[#C2703E]/50',
            className
          )}
          style={{ color: 'var(--color-text)' }}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
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
