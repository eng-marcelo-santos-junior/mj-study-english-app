import type { Metadata } from 'next'
import Link from 'next/link'
import { getUserDecks } from '@/server/actions/deck-actions'
import { DeckCard } from '@/components/cards/deck-card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Meus Decks — StudyApp' }

export default async function DecksPage() {
  const decks = await getUserDecks()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Meus Decks</h1>
          <p className="mt-1 text-sm text-gray-500">
            {decks.length === 0
              ? 'Nenhum deck criado ainda'
              : `${decks.length} ${decks.length === 1 ? 'deck' : 'decks'}`}
          </p>
        </div>
        <Link href="/decks/new">
          <Button>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Novo deck
          </Button>
        </Link>
      </div>

      {/* Grid or Empty State */}
      {decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <svg
              className="h-7 w-7 text-indigo-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-medium text-gray-900">Nenhum deck ainda</h3>
          <p className="mt-1 text-sm text-gray-500">
            Crie seu primeiro deck para começar a estudar
          </p>
          <Link href="/decks/new" className="mt-4">
            <Button>Criar deck</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      )}
    </div>
  )
}
