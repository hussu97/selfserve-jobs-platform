'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  searching?: boolean;
}

export function SearchBar({ value = '', onChange, placeholder = 'Search…', className, searching = false }: SearchBarProps) {
  const [internal, setInternal] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternal(e.target.value);
    onChange(e.target.value);
  };

  const handleClear = () => {
    setInternal('');
    onChange('');
  };

  return (
    <div className={cn('relative', className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg
          className="h-4 w-4 text-text-muted"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <input
        type="search"
        value={internal}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-2xl border-0 bg-surface-lowest shadow-ambient pl-9 pr-9 py-3 text-sm text-text-main',
          'placeholder:text-text-muted/60',
          'focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all'
        )}
      />
      {searching && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3" aria-hidden="true">
          <svg className="h-4 w-4 animate-spin text-text-muted" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
      {!searching && internal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
          aria-label="Clear search"
        >
          <svg
            className="h-4 w-4 transition-colors text-text-muted"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}
