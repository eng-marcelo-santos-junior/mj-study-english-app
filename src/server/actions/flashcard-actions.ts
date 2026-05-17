'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { flashcardSchema, type FlashcardInput } from '@/lib/validations'
import { sanitizeHtml } from '@/lib/sanitize'

type ActionResult = { error: string } | undefined

async function requireAuth(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return session.user.id
}

async function verifyDeckOwnership(deckId: string, userId: string) {
  const deck = await prisma.deck.findUnique({ where: { id: deckId } })
  if (!deck || deck.userId !== userId) return null
  return deck
}

async function verifyCardOwnership(cardId: string, userId: string) {
  const card = await prisma.flashcard.findUnique({
    where: { id: cardId },
    include: { deck: { select: { userId: true, id: true } } },
  })
  if (!card || card.deck.userId !== userId) return null
  return card
}

// ── Mutations ─────────────────────────────────────────────

export async function createFlashcard(deckId: string, data: FlashcardInput): Promise<ActionResult> {
  const userId = await requireAuth()

  const deck = await verifyDeckOwnership(deckId, userId)
  if (!deck) return { error: 'Deck não encontrado.' }

  const parsed = flashcardSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos. Verifique os campos.' }

  await prisma.flashcard.create({
    data: {
      deckId,
      frontContent: sanitizeHtml(parsed.data.frontContent),
      backContent: sanitizeHtml(parsed.data.backContent),
    },
  })

  revalidatePath(`/decks/${deckId}`)
  redirect(`/decks/${deckId}`)
}

export async function createFlashcardAndContinue(
  deckId: string,
  data: FlashcardInput
): Promise<ActionResult> {
  const userId = await requireAuth()

  const deck = await verifyDeckOwnership(deckId, userId)
  if (!deck) return { error: 'Deck não encontrado.' }

  const parsed = flashcardSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos. Verifique os campos.' }

  await prisma.flashcard.create({
    data: {
      deckId,
      frontContent: sanitizeHtml(parsed.data.frontContent),
      backContent: sanitizeHtml(parsed.data.backContent),
    },
  })

  revalidatePath(`/decks/${deckId}`)
  // sem redirect: retorna undefined para o form reiniciar
}

export async function updateFlashcard(cardId: string, data: FlashcardInput): Promise<ActionResult> {
  const userId = await requireAuth()

  const card = await verifyCardOwnership(cardId, userId)
  if (!card) return { error: 'Flashcard não encontrado.' }

  const parsed = flashcardSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos. Verifique os campos.' }

  await prisma.flashcard.update({
    where: { id: cardId },
    data: {
      frontContent: sanitizeHtml(parsed.data.frontContent),
      backContent: sanitizeHtml(parsed.data.backContent),
    },
  })

  revalidatePath(`/decks/${card.deck.id}`)
}

export async function deleteFlashcard(cardId: string): Promise<ActionResult> {
  const userId = await requireAuth()

  const card = await verifyCardOwnership(cardId, userId)
  if (!card) return { error: 'Flashcard não encontrado.' }

  await prisma.flashcard.delete({ where: { id: cardId } })

  revalidatePath(`/decks/${card.deck.id}`)
  revalidatePath('/dashboard')
}

// ── Queries ───────────────────────────────────────────────

export async function getDeckFlashcards(deckId: string) {
  const userId = await requireAuth()

  const deck = await verifyDeckOwnership(deckId, userId)
  if (!deck) return []

  return prisma.flashcard.findMany({
    where: { deckId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      frontContent: true,
      backContent: true,
      difficulty: true,
      intervalDays: true,
      easeFactor: true,
      repetitions: true,
      nextReviewAt: true,
      createdAt: true,
    },
  })
}
