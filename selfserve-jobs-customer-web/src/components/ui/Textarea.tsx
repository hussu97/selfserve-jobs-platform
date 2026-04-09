import { cn } from '@/lib/utils';
import type { TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-primary">*</span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-xl border-0 bg-surface px-4 py-3 text-sm transition-all resize-y min-h-[120px] text-text-main',
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

Textarea.displayName = 'Textarea';
