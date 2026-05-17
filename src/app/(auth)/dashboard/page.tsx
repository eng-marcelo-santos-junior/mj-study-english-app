import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DeckCard } from '@/components/cards/deck-card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Dashboard — StudyApp' }

async function getDashboardData(userId: string) {
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  )

  const [deckCount, cardCount, dueCount, reviewedToday, recentDecks] = await Promise.all([
    prisma.deck.count({ where: { userId } }),
    prisma.flashcard.count({ where: { deck: { userId } } }),
    prisma.flashcard.count({
      where: { deck: { userId }, nextReviewAt: { lte: endOfToday } },
    }),
    prisma.reviewLog.count({
      where: { userId, reviewedAt: { gte: startOfToday } },
    }),
    prisma.deck.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      include: { _count: { select: { flashcards: true } } },
    }),
  ])

  return { deckCount, cardCount, dueCount, reviewedToday, recentDecks }
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id
  const firstName = session?.user?.name?.split(' ')[0] ?? 'Usuário'

  const { deckCount, cardCount, dueCount, reviewedToday, recentDecks } =
    await getDashboardData(userId)

  const stats = [
    { label: 'Decks', value: deckCount, color: 'text-indigo-700', bg: 'bg-indigo-50' },
    { label: 'Flashcards', value: cardCount, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Para revisar hoje', value: dueCount, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Revisados hoje', value: reviewedToday, color: 'text-green-700', bg: 'bg-green-50' },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Olá, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-gray-500">Aqui está o resumo dos seus estudos</p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`mt-1 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Decks */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Decks recentes</h2>
          {deckCount > 3 && (
            <Link
              href="/decks"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Ver todos →
            </Link>
          )}
        </div>

        {recentDecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-14">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
              <svg
                className="h-6 w-6 text-indigo-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-medium text-gray-900">Nenhum deck ainda</h3>
            <p className="mt-1 text-sm text-gray-500">Crie seu primeiro deck para começar</p>
            <Link href="/decks/new" className="mt-4">
              <Button>Criar deck</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
