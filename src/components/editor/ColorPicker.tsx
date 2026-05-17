'use client'

import { useState, useRef, useEffect } from 'react'

const PRESET_COLORS = [
  { label: 'Preto', value: '#000000' },
  { label: 'Branco', value: '#ffffff' },
  { label: 'Cinza', value: '#6b7280' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Laranja', value: '#f97316' },
  { label: 'Âmbar', value: '#f59e0b' },
  { label: 'Verde', value: '#22c55e' },
  { label: 'Verde-azulado', value: '#14b8a6' },
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Índigo', value: '#6366f1' },
  { label: 'Roxo', value: '#a855f7' },
  { label: 'Rosa', value: '#ec4899' },
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label: string
  icon: React.ReactNode
}

export function ColorPicker({ value, onChange, label, icon }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={label}
        className="flex h-7 w-7 flex-col items-center justify-center gap-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <span className="text-xs leading-none">{icon}</span>
        <span className="h-1 w-4 rounded-sm" style={{ backgroundColor: value || '#000000' }} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-6 gap-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                title={color.label}
                onClick={() => {
                  onChange(color.value)
                  setOpen(false)
                }}
                className="h-5 w-5 rounded-sm border border-gray-300 transition-transform hover:scale-110 dark:border-gray-600"
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1">
            <label className="text-[10px] text-gray-500 dark:text-gray-400">Custom:</label>
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="h-5 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
            />
          </div>
        </div>
      )}
    </div>
  )
}
