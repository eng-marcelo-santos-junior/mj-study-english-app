import type { Metadata } from 'next'
import Link from 'next/link'
import { getUserDecks } from '@/server/actions/deck-actions'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Prática Livre — StudyApp' }

export default async function PracticeIndexPage() {
  const decks = await getUserDecks()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            Prática Livre
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Prática Livre</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Estude cards quantas vezes quiser sem alterar o agendamento de revisão.
        </p>
      </div>

      {/* Deck list */}
      {decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-50">
            Nenhum deck encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">Crie um deck para começar a praticar</p>
          <Link href="/decks/new" className="mt-4">
            <Button size="sm">+ Criar deck</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {decks.map((deck) => {
            const count = deck._count.flashcards
            return (
              <div
                key={deck.id}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xl font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  {deck.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-gray-50">
                    {deck.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {count} {count === 1 ? 'card' : 'cards'}
                  </p>
                </div>
                <Link href={`/decks/${deck.id}/practice`}>
                  <Button
                    size="sm"
                    disabled={count === 0}
                    className="shrink-0 bg-violet-600 hover:bg-violet-700"
                  >
                    Praticar
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
