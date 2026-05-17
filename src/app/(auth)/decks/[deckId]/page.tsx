import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDeckById, getDeckDueCount, deleteDeck } from '@/server/actions/deck-actions'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { Button } from '@/components/ui/button'

interface Props {
  params: Promise<{ deckId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params
  const deck = await getDeckById(deckId)
  return { title: deck ? `${deck.name} — StudyApp` : 'Deck — StudyApp' }
}

export default async function DeckDetailPage({ params }: Props) {
  const { deckId } = await params
  const [deck, dueCount] = await Promise.all([getDeckById(deckId), getDeckDueCount(deckId)])

  if (!deck) notFound()

  const cardCount = deck._count.flashcards
  const handleDelete = () => deleteDeck(deck.id)

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/decks" className="hover:text-gray-700">
          Decks
        </Link>
        <span>/</span>
        <span className="max-w-[200px] truncate text-gray-900">{deck.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-2xl font-bold text-indigo-700">
            {deck.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{deck.name}</h1>
            {deck.description && <p className="mt-1 text-sm text-gray-500">{deck.description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
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
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Excluir
              </Button>
            }
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total de cards', value: cardCount, color: 'text-gray-900' },
          {
            label: 'Para revisar hoje',
            value: dueCount,
            color: dueCount > 0 ? 'text-amber-600' : 'text-gray-900',
          },
          { label: 'Revisados hoje', value: 0, color: 'text-green-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button disabled={cardCount === 0 || dueCount === 0} className="gap-2">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {dueCount > 0 ? `Revisar (${dueCount})` : 'Nada para revisar'}
        </Button>

        <Button variant="ghost" disabled>
          + Adicionar card
          <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
            em breve
          </span>
        </Button>
      </div>

      {/* Cards list placeholder */}
      {cardCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mt-3 text-sm font-medium text-gray-900">Nenhum flashcard</h3>
          <p className="mt-1 text-sm text-gray-500">Adicione cards para começar a estudar</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Lista de flashcards disponível na próxima sprint.</p>
        </div>
      )}
    </div>
  )
}
