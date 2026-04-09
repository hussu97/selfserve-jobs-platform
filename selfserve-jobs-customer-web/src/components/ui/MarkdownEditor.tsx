'use client';

import { useState, useEffect } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { cn } from '@/lib/utils';

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

// ── Toolbar icons ─────────────────────────────────────────────

function BoldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 3h4.5a3 3 0 0 1 0 6H4V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 9h5a3 3 0 0 1 0 6H4V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3H6M10 13H6M9 3 7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HeadingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3v10M9 3v10M3 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11.5 9.5h3M13 8v4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3" cy="5" r="1" fill="currentColor" />
      <circle cx="3" cy="9" r="1" fill="currentColor" />
      <circle cx="3" cy="13" r="1" fill="currentColor" />
      <path d="M6 5h7M6 9h7M6 13h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 3.5h1.5V7H2M2 7h2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 9.5h2L2 12h2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4.5h7M7 8.5h7M7 12.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 5 2 8l3 3M11 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 3.5l-3 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

// ── Toolbar ───────────────────────────────────────────────────

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
      onMouseDown={onMouseDown}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-text-muted hover:bg-surface-lowest hover:text-text-main'
      )}
    >
      {children}
    </button>
  );
}

function MarkdownToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const tools = [
    {
      label: 'Bold',
      icon: <BoldIcon />,
      active: editor.isActive('bold'),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'Italic',
      icon: <ItalicIcon />,
      active: editor.isActive('italic'),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Heading',
      icon: <HeadingIcon />,
      active: editor.isActive('heading', { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Bullet List',
      icon: <BulletListIcon />,
      active: editor.isActive('bulletList'),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Ordered List',
      icon: <OrderedListIcon />,
      active: editor.isActive('orderedList'),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Code Block',
      icon: <CodeIcon />,
      active: editor.isActive('codeBlock'),
      action: () => editor.chain().focus().toggleCodeBlock().run(),
    },
  ];

  return (
    <div
      className="border-t border-border/10 flex items-center gap-0.5 px-3 py-2"
      role="toolbar"
      aria-label="Text formatting"
    >
      {tools.map((tool) => (
        <ToolbarButton
          key={tool.label}
          label={tool.label}
          active={tool.active}
          onMouseDown={(e) => {
            e.preventDefault(); // keep editor focus
            tool.action();
          }}
        >
          {tool.icon}
        </ToolbarButton>
      ))}
    </div>
  );
}

// ── Inner editor (client-only) ────────────────────────────────
// Separated into its own component so useEditor never runs during SSR.

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
        class: 'prose outline-none px-4 py-3 text-sm text-text-main',
      },
    },
    onUpdate({ editor: e }) {
      onChange(e.storage.markdown.getMarkdown());
    },
  });

  // Controlled sync — only update when value differs to avoid cursor reset
  useEffect(() => {
    if (!editor) return;
    const current = editor.storage.markdown.getMarkdown();
    if (current !== value) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  return (
    <div
      className={cn(
        'rounded-xl bg-surface transition-all cursor-text',
        'focus-within:ring-1 focus-within:ring-primary/30 focus-within:bg-surface-lowest',
        error ? 'ring-1 ring-red-400 bg-red-50' : ''
      )}
      style={{ minHeight }}
      onClick={() => editor?.commands.focus()}
    >
      <EditorContent
        editor={editor}
        style={{ minHeight: `calc(${minHeight} - 44px)` }}
      />
      <MarkdownToolbar editor={editor} />
    </div>
  );
}

// ── Public component ──────────────────────────────────────────
// Renders a plain shell on the server / before hydration.
// Swaps to the live Tiptap editor after mount to keep useEditor off the server.

export function MarkdownEditor({
  value,
  onChange,
  label,
  placeholder,
  error,
  hint,
  required,
  id,
  minHeight = '240px',
  disabled,
}: MarkdownEditorProps) {
  const editorId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col gap-1">
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
        // Server / pre-hydration shell — same dimensions, no Tiptap
        <div
          className={cn(
            'rounded-xl bg-surface',
            error ? 'ring-1 ring-red-400 bg-red-50' : ''
          )}
          style={{ minHeight }}
        />
      )}

      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
