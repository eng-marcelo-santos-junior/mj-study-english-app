'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deckSchema, type DeckInput } from '@/lib/validations'

type ActionResult = { error: string } | undefined

async function requireAuth(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return session.user.id
}

async function verifyOwnership(deckId: string, userId: string) {
  const deck = await prisma.deck.findUnique({ where: { id: deckId } })
  if (!deck || deck.userId !== userId) return null
  return deck
}

// ── Mutations ─────────────────────────────────────────────

export async function createDeck(data: DeckInput): Promise<ActionResult> {
  const userId = await requireAuth()
  const parsed = deckSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos. Verifique os campos.' }

  const deck = await prisma.deck.create({
    data: {
      userId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    },
  })

  revalidatePath('/decks')
  revalidatePath('/dashboard')
  redirect(`/decks/${deck.id}`)
}

export async function updateDeck(deckId: string, data: DeckInput): Promise<ActionResult> {
  const userId = await requireAuth()

  const existing = await verifyOwnership(deckId, userId)
  if (!existing) return { error: 'Deck não encontrado.' }

  const parsed = deckSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos. Verifique os campos.' }

  await prisma.deck.update({
    where: { id: deckId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    },
  })

  revalidatePath('/decks')
  revalidatePath(`/decks/${deckId}`)
  redirect(`/decks/${deckId}`)
}

export async function deleteDeck(deckId: string): Promise<ActionResult> {
  const userId = await requireAuth()

  const existing = await verifyOwnership(deckId, userId)
  if (!existing) return { error: 'Deck não encontrado.' }

  await prisma.deck.delete({ where: { id: deckId } })

  revalidatePath('/decks')
  revalidatePath('/dashboard')
  redirect('/decks')
}

// ── Queries ───────────────────────────────────────────────

export async function getUserDecks() {
  const userId = await requireAuth()

  return prisma.deck.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { flashcards: true } },
    },
  })
}

export async function getDeckById(deckId: string) {
  const userId = await requireAuth()

  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: {
      _count: { select: { flashcards: true } },
    },
  })

  if (!deck || deck.userId !== userId) return null
  return deck
}

export async function getDeckDueCount(deckId: string): Promise<number> {
  const userId = await requireAuth()

  const deck = await prisma.deck.findUnique({ where: { id: deckId } })
  if (!deck || deck.userId !== userId) return 0

  const now = new Date()
  return prisma.flashcard.count({
    where: { deckId, nextReviewAt: { lte: now } },
  })
}
