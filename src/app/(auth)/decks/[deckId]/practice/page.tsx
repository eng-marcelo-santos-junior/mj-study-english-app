import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDeckById } from '@/server/actions/deck-actions'
import { getPracticeFilterCounts } from '@/server/actions/practice-actions'
import { PracticePage } from '@/components/practice/practice-page'

interface Props {
  params: Promise<{ deckId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params
  const deck = await getDeckById(deckId)
  return { title: deck ? `Prática Livre — ${deck.name}` : 'Prática Livre — StudyApp' }
}

export default async function DeckPracticePage({ params }: Props) {
  const { deckId } = await params
  const [deck, filterCounts] = await Promise.all([
    getDeckById(deckId),
    getPracticeFilterCounts(deckId),
  ])

  if (!deck) notFound()

  return (
    <div className="mx-auto w-full max-w-xl">
      <PracticePage deckId={deckId} deckName={deck.name} filterCounts={filterCounts} />
    </div>
  )
}
