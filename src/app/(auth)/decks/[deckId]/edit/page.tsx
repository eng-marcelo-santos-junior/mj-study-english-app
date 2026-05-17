import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDeckById, updateDeck } from '@/server/actions/deck-actions'
import { DeckForm } from '@/components/forms/deck-form'

interface Props {
  params: Promise<{ deckId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params
  const deck = await getDeckById(deckId)
  return { title: deck ? `Editar ${deck.name} — StudyApp` : 'Editar Deck' }
}

export default async function EditDeckPage({ params }: Props) {
  const { deckId } = await params
  const deck = await getDeckById(deckId)

  if (!deck) notFound()

  const action = updateDeck.bind(null, deck.id)

  return (
    <div className="mx-auto max-w-lg">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/decks" className="hover:text-gray-700">
          Decks
        </Link>
        <span>/</span>
        <Link href={`/decks/${deck.id}`} className="hover:text-gray-700">
          {deck.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Editar</span>
      </nav>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-gray-900">Editar deck</h1>
        <p className="mb-6 text-sm text-gray-500">Atualize o nome ou a descrição do deck.</p>
        <DeckForm
          action={action}
          defaultValues={{ name: deck.name, description: deck.description ?? '' }}
          submitLabel="Salvar alterações"
          cancelHref={`/decks/${deck.id}`}
        />
      </div>
    </div>
  )
}
