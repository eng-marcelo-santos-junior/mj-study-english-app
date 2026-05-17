'use client'

import { useState } from 'react'
import { updateFlashcard, deleteFlashcard } from '@/server/actions/flashcard-actions'
import { FlashcardForm } from '@/components/forms/flashcard-form'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { Button } from '@/components/ui/button'
import type { FlashcardInput } from '@/lib/validations'

interface Flashcard {
  id: string
  frontContent: string
  backContent: string
  difficulty: string
  intervalDays: number
  nextReviewAt: Date | null
}

interface FlashcardCardProps {
  card: Flashcard
}

export function FlashcardCard({ card }: FlashcardCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [editing, setEditing] = useState(false)

  const handleUpdate = async (data: FlashcardInput) => {
    const result = await updateFlashcard(card.id, data)
    if (!result?.error) setEditing(false)
    return result
  }

  const handleDelete = () => deleteFlashcard(card.id)

  const difficultyBadge: Record<string, { label: string; className: string }> = {
    NEW: { label: 'Novo', className: 'bg-blue-50 text-blue-700' },
    LEARNING: { label: 'Aprendendo', className: 'bg-amber-50 text-amber-700' },
    REVIEW: { label: 'Revisão', className: 'bg-green-50 text-green-700' },
    RELEARNING: { label: 'Reaprendendo', className: 'bg-orange-50 text-orange-700' },
  }

  const badge = difficultyBadge[card.difficulty] ?? difficultyBadge['NEW']

  if (editing) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-white p-5 shadow-sm dark:border-indigo-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Editar flashcard</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            ✕
          </Button>
        </div>
        <FlashcardForm
          defaultValues={{ frontContent: card.frontContent, backContent: card.backContent }}
          action={handleUpdate}
          onSuccess={() => setEditing(false)}
          onCancel={() => setEditing(false)}
          submitLabel="Salvar alterações"
        />
      </div>
    )
  }

  return (
    <div className="group rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      {/* Card face */}
      <div
        className="cursor-pointer p-5"
        onClick={() => setFlipped((f) => !f)}
        title="Clique para virar"
      >
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-xs text-gray-400">
            {flipped ? 'Verso' : 'Frente'} · clique para virar
          </span>
        </div>

        <div
          className="rich-content min-h-[3rem] text-sm text-gray-800 dark:text-gray-100"
          dangerouslySetInnerHTML={{ __html: flipped ? card.backContent : card.frontContent }}
        />

        {card.intervalDays > 0 && (
          <p className="mt-3 text-xs text-gray-400">
            Intervalo atual: {card.intervalDays} {card.intervalDays === 1 ? 'dia' : 'dias'}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-4 py-2 opacity-0 transition-opacity group-hover:opacity-100 dark:border-gray-800">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Editar
        </Button>
        <ConfirmModal
          title="Excluir flashcard"
          description="Tem certeza que deseja excluir este flashcard? O histórico de revisões também será perdido."
          confirmLabel="Excluir"
          onConfirm={handleDelete}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              Excluir
            </Button>
          }
        />
      </div>
    </div>
  )
}
