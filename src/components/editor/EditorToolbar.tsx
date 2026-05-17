'use client'

import { type Editor } from '@tiptap/react'
import { FontSizeSelector } from './FontSizeSelector'
import { ColorPicker } from './ColorPicker'

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded text-sm transition-colors ${
        active
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

interface EditorToolbarProps {
  editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  const textColor = (editor.getAttributes('textStyle').color as string | undefined) ?? '#000000'
  const highlightColor =
    (editor.getAttributes('highlight').color as string | undefined) ?? '#fef08a'

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800/50">
      {/* Bold */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Negrito (Ctrl+B)"
      >
        <strong>B</strong>
      </ToolbarButton>

      {/* Italic */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Itálico (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarButton>

      {/* Underline */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Sublinhado (Ctrl+U)"
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600" />

      {/* Font size */}
      <FontSizeSelector editor={editor} />

      <div className="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600" />

      {/* Text color */}
      <ColorPicker
        value={textColor}
        onChange={(color) => editor.chain().focus().setColor(color).run()}
        label="Cor do texto"
        icon={
          <span className="text-xs font-bold" style={{ color: textColor }}>
            A
          </span>
        }
      />

      {/* Highlight */}
      <ColorPicker
        value={highlightColor}
        onChange={(color) => editor.chain().focus().setHighlight({ color }).run()}
        label="Destaque/fundo"
        icon={
          <span className="text-xs" style={{ backgroundColor: highlightColor, padding: '0 2px' }}>
            H
          </span>
        }
      />
    </div>
  )
}
