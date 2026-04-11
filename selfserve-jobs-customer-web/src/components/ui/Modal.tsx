'use client';

import { useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Use 'alertdialog' for destructive confirmations — prevents backdrop-click dismiss */
  role?: 'dialog' | 'alertdialog';
}

export function Modal({ open, onClose, title, children, size = 'md', role = 'dialog' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Track the element that opened the modal so we can return focus on close
  const returnFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      returnFocusRef.current = document.activeElement;
      dialog.showModal();
      // Move focus to the first focusable element inside the dialog
      const focusable = dialog.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
      // Return focus to the element that triggered the modal
      if (returnFocusRef.current instanceof HTMLElement) {
        returnFocusRef.current.focus();
      }
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      role={role}
      aria-labelledby={title ? titleId : undefined}
      className={cn(
        'w-full rounded-2xl shadow-ambient-hover p-0 backdrop:bg-black/40 backdrop:backdrop-blur-sm',
        'bg-surface-lowest',
        sizes[size]
      )}
      onClick={(e) => {
        // alertdialog requires explicit action — no backdrop dismiss
        if (role !== 'alertdialog' && e.target === dialogRef.current) onClose();
      }}
    >
      <div className="p-6">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 id={titleId} className="text-xl font-semibold text-primary">
              {title}
            </h2>
            {role !== 'alertdialog' && (
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </Button>
            )}
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
