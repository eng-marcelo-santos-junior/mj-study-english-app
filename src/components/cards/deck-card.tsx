'use client'

import Link from 'next/link'
import { deleteDeck } from '@/server/actions/deck-actions'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { Button } from '@/components/ui/button'

interface DeckCardProps {
  deck: {
    id: string
    name: string
    description: string | null
    updatedAt: Date
    _count: { flashcards: number }
  }
}

export function DeckCard({ deck }: DeckCardProps) {
  const cardCount = deck._count.flashcards
  const handleDelete = () => deleteDeck(deck.id)

  return (
    <div className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-lg font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
          aria-hidden
        >
          {deck.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/decks/${deck.id}`}>
            <h3 className="truncate font-semibold text-gray-900 hover:text-indigo-600 dark:text-gray-50 dark:hover:text-indigo-400">
              {deck.name}
            </h3>
          </Link>
          {deck.description ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
              {deck.description}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-gray-400 italic dark:text-gray-600">Sem descrição</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {cardCount} {cardCount === 1 ? 'card' : 'cards'}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <Link href={`/decks/${deck.id}`}>
          <Button size="sm">Ver deck</Button>
        </Link>

        <div className="flex items-center gap-1">
          <Link href={`/decks/${deck.id}/edit`}>
            <Button variant="ghost" size="sm">
              Editar
            </Button>
          </Link>

          <ConfirmModal
            title="Excluir deck"
            description={`Tem certeza que deseja excluir "${deck.name}"? Todos os flashcards serão permanentemente excluídos.`}
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
    </div>
  )
}
