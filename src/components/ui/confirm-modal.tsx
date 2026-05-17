'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ConfirmModalProps {
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => Promise<{ error: string } | undefined>
  trigger: React.ReactNode
}

export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Excluir',
  onConfirm,
  trigger,
}: ConfirmModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const handleConfirm = async () => {
    setLoading(true)
    setError(undefined)
    const result = await onConfirm()
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    // se não houver erro o Server Action redirecionou, componente desmonta
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && setOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <svg
                className="h-5 w-5 text-red-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <h3 className="mt-2 text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleConfirm} loading={loading}>
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
