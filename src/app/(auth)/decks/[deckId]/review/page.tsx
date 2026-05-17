import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDeckById } from '@/server/actions/deck-actions'
import { getDueCards } from '@/server/actions/review-actions'
import { ReviewSession } from '@/components/review/review-session'
import { Button } from '@/components/ui/button'

interface Props {
  params: Promise<{ deckId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params
  const deck = await getDeckById(deckId)
  return { title: deck ? `Revisão — ${deck.name}` : 'Revisão — StudyApp' }
}

export default async function ReviewPage({ params }: Props) {
  const { deckId } = await params
  const [deck, cards] = await Promise.all([getDeckById(deckId), getDueCards(deckId)])

  if (!deck) notFound()

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
          ✅
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Tudo em dia!</h1>
          <p className="mt-2 text-sm text-gray-500">
            Nenhum card de <span className="font-medium text-gray-700">{deck.name}</span> precisa de
            revisão agora.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/decks/${deckId}`}>
            <Button variant="ghost">← Voltar ao deck</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <ReviewSession cards={cards} deckId={deckId} deckName={deck.name} />
    </div>
  )
}
