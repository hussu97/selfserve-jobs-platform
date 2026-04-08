'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value = '', onChange, placeholder = 'Search…', className }: SearchBarProps) {
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
          className="h-4 w-4"
          style={{ color: 'var(--color-text-muted)' }}
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
          'w-full rounded-xl border border-[#DDD5C8] bg-white pl-9 pr-9 py-2.5 text-sm',
          'placeholder:text-[#7A7067]',
          'focus:outline-none focus:ring-2 focus:ring-[#C2703E] focus:border-transparent',
          'hover:border-[#C2703E]/50 transition-colors'
        )}
        style={{ color: 'var(--color-text)' }}
      />
      {internal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
          aria-label="Clear search"
        >
          <svg
            className="h-4 w-4 transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
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
