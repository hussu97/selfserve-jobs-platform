'use client';

import { useState, useRef, useEffect } from 'react';
import { DIAL_CODES } from '@/lib/constants';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
}

const DEFAULT_DIAL = DIAL_CODES[0]; // UAE

function parsePhone(value: string): { dialCode: string; number: string } {
  for (const entry of DIAL_CODES) {
    if (value.startsWith(entry.dialCode + ' ')) {
      return { dialCode: entry.dialCode, number: value.slice(entry.dialCode.length + 1) };
    }
    if (value.startsWith(entry.dialCode)) {
      return { dialCode: entry.dialCode, number: value.slice(entry.dialCode.length) };
    }
  }
  return { dialCode: DEFAULT_DIAL.dialCode, number: value };
}

export function PhoneInput({ value, onChange, error, required, label = 'Contact number' }: PhoneInputProps) {
  const parsed = parsePhone(value);
  const currentEntry = DIAL_CODES.find((d) => d.dialCode === parsed.dialCode) ?? DEFAULT_DIAL;

  const [selected, setSelected] = useState(currentEntry);
  const [localNumber, setLocalNumber] = useState(parsed.number);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync outward value whenever dial code or number changes
  useEffect(() => {
    const combined = localNumber ? `${selected.dialCode} ${localNumber}` : '';
    onChange(combined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, localNumber]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = search
    ? DIAL_CODES.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.dialCode.includes(search)
      )
    : DIAL_CODES;

  const selectEntry = (entry: typeof DIAL_CODES[0]) => {
    setSelected(entry);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
          {label}
          {required && <span className="text-primary ml-1">*</span>}
        </label>
      )}
      <div className={`flex rounded-xl overflow-visible bg-surface focus-within:ring-2 focus-within:ring-primary transition-shadow ${error ? 'ring-2 ring-red-400' : ''}`}>
        {/* Dial code dropdown trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-3.5 h-full rounded-l-xl bg-surface hover:bg-surface-lowest transition-colors text-sm font-medium text-text-main border-r border-border/40 whitespace-nowrap focus:outline-none"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="text-text-muted text-[13px]">{selected.dialCode}</span>
            <svg className={`w-3 h-3 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {open && (
            <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-surface-lowest rounded-xl shadow-[0_4px_24px_rgba(28,28,26,0.12)] border border-border/30 overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-border/20">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country..."
                  className="w-full px-3 py-2 text-sm bg-surface rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-text-main placeholder:text-text-muted"
                  autoFocus
                />
              </div>
              {/* Options */}
              <ul role="listbox" className="max-h-52 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-4 py-2 text-sm text-text-muted">No results</li>
                ) : (
                  filtered.map((entry) => (
                    <li
                      key={entry.code}
                      role="option"
                      aria-selected={entry.code === selected.code}
                      onClick={() => selectEntry(entry)}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer text-sm transition-colors ${
                        entry.code === selected.code
                          ? 'bg-primary/8 text-primary font-medium'
                          : 'text-text-main hover:bg-surface'
                      }`}
                    >
                      <span className="text-base w-6 text-center">{entry.flag}</span>
                      <span className="flex-1 truncate">{entry.name}</span>
                      <span className="text-text-muted text-xs shrink-0">{entry.dialCode}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Number input */}
        <input
          type="tel"
          value={localNumber}
          onChange={(e) => setLocalNumber(e.target.value)}
          placeholder="50 123 4567"
          className="flex-1 min-w-0 px-4 py-3.5 bg-transparent text-sm text-text-main placeholder:text-text-muted focus:outline-none rounded-r-xl"
          required={required}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
