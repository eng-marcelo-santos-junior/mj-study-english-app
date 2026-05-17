import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDeckById } from '@/server/actions/deck-actions'
import { createFlashcard, createFlashcardAndContinue } from '@/server/actions/flashcard-actions'
import { FlashcardForm } from '@/components/forms/flashcard-form'

interface Props {
  params: Promise<{ deckId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params
  const deck = await getDeckById(deckId)
  return { title: deck ? `Novo card — ${deck.name}` : 'Novo card — StudyApp' }
}

export default async function NewFlashcardPage({ params }: Props) {
  const { deckId } = await params
  const deck = await getDeckById(deckId)

  if (!deck) notFound()

  const createAction = createFlashcard.bind(null, deckId)
  const createAndContinueAction = createFlashcardAndContinue.bind(null, deckId)

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/decks" className="hover:text-gray-700">
          Decks
        </Link>
        <span>/</span>
        <Link href={`/decks/${deckId}`} className="max-w-[160px] truncate hover:text-gray-700">
          {deck.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Novo card</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Novo flashcard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Adicionando ao deck <span className="font-medium text-gray-700">{deck.name}</span>
        </p>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <FlashcardForm
          action={createAction}
          submitLabel="Salvar e voltar"
          showAddAnother
          onAddAnother={createAndContinueAction}
          onCancel={undefined}
        />
      </div>

      <div className="flex justify-start">
        <Link
          href={`/decks/${deckId}`}
          className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          ← Voltar para o deck
        </Link>
      </div>
    </div>
  )
}
