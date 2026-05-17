'use client'

import { type Editor } from '@tiptap/react'

const FONT_SIZES = ['12px', '14px', '16px', '18px', '24px', '32px']

interface FontSizeSelectorProps {
  editor: Editor
}

export function FontSizeSelector({ editor }: FontSizeSelectorProps) {
  const currentSize = (editor.getAttributes('textStyle').fontSize as string | undefined) ?? '16px'

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run()
  }

  return (
    <select
      value={currentSize}
      onChange={handleChange}
      className="h-7 rounded border border-gray-300 bg-white px-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      title="Tamanho da fonte"
    >
      {FONT_SIZES.map((size) => (
        <option key={size} value={size}>
          {size}
        </option>
      ))}
    </select>
  )
}
