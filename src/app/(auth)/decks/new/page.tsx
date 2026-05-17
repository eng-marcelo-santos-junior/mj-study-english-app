import type { Metadata } from 'next'
import Link from 'next/link'
import { createDeck } from '@/server/actions/deck-actions'
import { DeckForm } from '@/components/forms/deck-form'

export const metadata: Metadata = { title: 'Novo Deck — StudyApp' }

export default function NewDeckPage() {
  return (
    <div className="mx-auto max-w-lg">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/decks" className="hover:text-gray-700">
          Decks
        </Link>
        <span>/</span>
        <span className="text-gray-900">Novo deck</span>
      </nav>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-gray-900">Criar novo deck</h1>
        <p className="mb-6 text-sm text-gray-500">
          Um deck é uma coleção de flashcards sobre um mesmo tema.
        </p>
        <DeckForm action={createDeck} submitLabel="Criar deck" />
      </div>
    </div>
  )
}
