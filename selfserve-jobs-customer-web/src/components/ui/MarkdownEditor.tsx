'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  id?: string;
  minHeight?: string;
  disabled?: boolean;
}

// ─── Icons ────────────────────────────────────────────────────

function BoldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.5 3.5h4a2.5 2.5 0 0 1 0 5h-4V3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4.5 8.5h4.5a2.5 2.5 0 0 1 0 5h-4.5V8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10.5 3h-5M10.5 13h-5M9 3 7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 3v5a4 4 0 0 0 8 0V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3" cy="4.5" r="1.1" fill="currentColor" />
      <circle cx="3" cy="8" r="1.1" fill="currentColor" />
      <circle cx="3" cy="11.5" r="1.1" fill="currentColor" />
      <path d="M6.5 4.5h7M6.5 8h7M6.5 11.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 3.5h1.5V7H2M2 7h2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 9.5h2L2 12h2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4.5h7M7 8.5h7M7 12.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5.5 5 2 8l3.5 3M10.5 5 14 8l-3.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 3.5l-3 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Toolbar button ───────────────────────────────────────────

function ToolbarButton({
  label,
  active,
  onMouseDown,
  children,
}: {
  label: string;
  active: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e); }}
      className={cn(
        'p-1.5 rounded-lg transition-colors select-none',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-text-muted hover:bg-primary/5 hover:text-text-main',
      )}
    >
      {children}
    </button>
  );
}

// ─── Heading dropdown ─────────────────────────────────────────

type HeadingLevel = 1 | 2 | 3;

const HEADING_OPTIONS: { label: string; level: HeadingLevel | null }[] = [
  { label: 'Paragraph', level: null },
  { label: 'Heading 1', level: 1 },
  { label: 'Heading 2', level: 2 },
  { label: 'Heading 3', level: 3 },
];

function HeadingDropdown({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLevel: HeadingLevel | null =
    editor.isActive('heading', { level: 1 }) ? 1 :
    editor.isActive('heading', { level: 2 }) ? 2 :
    editor.isActive('heading', { level: 3 }) ? 3 :
    null;

  const triggerLabel = activeLevel ? `H${activeLevel}` : 'P';
  const isHeading = activeLevel !== null;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Text style"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Text style"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={cn(
          'flex items-center gap-1 pl-2 pr-1.5 py-1.5 rounded-lg transition-colors select-none text-xs font-semibold min-w-[44px]',
          isHeading
            ? 'bg-primary/10 text-primary'
            : 'text-text-muted hover:bg-primary/5 hover:text-text-main',
        )}
      >
        <span className="w-4 text-center">{triggerLabel}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Text style"
          className="absolute top-full left-0 mt-1 bg-surface-lowest rounded-xl overflow-hidden z-50 shadow-ambient min-w-[140px]"
        >
          {HEADING_OPTIONS.map(({ label, level }) => {
            const isActive =
              level === null ? activeLevel === null : activeLevel === level;
            return (
              <button
                key={label}
                role="option"
                aria-selected={isActive}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (level === null) {
                    editor.chain().focus().setParagraph().run();
                  } else {
                    editor.chain().focus().toggleHeading({ level }).run();
                  }
                  setOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2.5',
                  isActive
                    ? 'bg-primary/8 text-primary font-medium'
                    : 'text-text-main hover:bg-surface',
                  level === 1 && 'text-base font-heading font-semibold',
                  level === 2 && 'text-sm font-heading font-semibold',
                  level === 3 && 'text-xs font-heading font-semibold uppercase tracking-wide',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────

function MarkdownToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/20 flex-shrink-0"
    >
      <HeadingDropdown editor={editor} />

      <span className="mx-1.5 h-4 w-px bg-border/30 flex-shrink-0" aria-hidden="true" />

      <ToolbarButton
        label="Bold (⌘B)"
        active={editor.isActive('bold')}
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
      >
        <BoldIcon />
      </ToolbarButton>
      <ToolbarButton
        label="Italic (⌘I)"
        active={editor.isActive('italic')}
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
      >
        <ItalicIcon />
      </ToolbarButton>
      <ToolbarButton
        label="Underline (⌘U)"
        active={editor.isActive('underline')}
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
      >
        <UnderlineIcon />
      </ToolbarButton>

      <span className="mx-1.5 h-4 w-px bg-border/30 flex-shrink-0" aria-hidden="true" />

      <ToolbarButton
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
      >
        <BulletListIcon />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
      >
        <OrderedListIcon />
      </ToolbarButton>

      <span className="mx-1.5 h-4 w-px bg-border/30 flex-shrink-0" aria-hidden="true" />

      <ToolbarButton
        label="Code block"
        active={editor.isActive('codeBlock')}
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleCodeBlock().run(); }}
      >
        <CodeIcon />
      </ToolbarButton>
    </div>
  );
}

// ─── Inner editor (client-only) ───────────────────────────────
// Separated from the public component so `useEditor` never runs during SSR.

function MarkdownEditorContent({
  value,
  onChange,
  placeholder,
  error,
  editorId,
  minHeight,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  editorId: string | undefined;
  minHeight: string;
  disabled?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Markdown.configure({
        html: false,
        transformCopiedText: true,
        transformPastedText: true,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? '',
      }),
    ],
    content: value,
    immediatelyRender: false,
    editable: !disabled,
    editorProps: {
      attributes: {
        id: editorId ?? '',
        class: 'prose outline-none w-full',
      },
    },
    onUpdate({ editor: e }) {
      onChange((e.storage as any).markdown.getMarkdown());
    },
  });

  // Controlled sync — only push new value when it differs to avoid cursor reset.
  useEffect(() => {
    if (!editor) return;
    const current = (editor.storage as any).markdown.getMarkdown();
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl bg-surface transition-all',
        'focus-within:ring-1 focus-within:ring-primary/30 focus-within:bg-surface-lowest',
        error ? 'ring-1 ring-red-400 bg-red-50' : '',
        disabled ? 'opacity-50 pointer-events-none' : '',
      )}
    >
      <MarkdownToolbar editor={editor} />
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="flex-1 px-4 py-3 cursor-text"
        onClick={() => !disabled && editor?.commands.focus()}
      />
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────
// Renders a plain shell on the server / before hydration, then swaps to
// the live Tiptap editor after mount to keep `useEditor` off the server.

export function MarkdownEditor({
  value,
  onChange,
  label,
  placeholder,
  error,
  hint,
  required,
  id,
  minHeight = '200px',
  disabled,
}: MarkdownEditorProps) {
  const editorId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={editorId}
          className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted"
        >
          {label}
          {required && <span className="ml-1 text-primary">*</span>}
        </label>
      )}

      {mounted ? (
        <MarkdownEditorContent
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          error={error}
          editorId={editorId}
          minHeight={minHeight}
          disabled={disabled}
        />
      ) : (
        // Server / pre-hydration placeholder — same dimensions, no Tiptap
        <div
          className={cn(
            'rounded-xl bg-surface',
            error ? 'ring-1 ring-red-400 bg-red-50' : '',
          )}
          style={{ minHeight: `calc(${minHeight} + 44px)` }}
        />
      )}

      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
