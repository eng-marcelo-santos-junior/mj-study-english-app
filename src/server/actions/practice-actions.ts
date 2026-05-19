'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSignedDownloadUrl } from '@/lib/audio/audio-storage'
import type { ReviewCard } from './review-actions'

export type PracticeFilter = 'all' | 'new' | 'difficult' | 'due'

export interface PracticeFilterCounts {
  all: number
  new: number
  difficult: number
  due: number
}

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

async function resolveAudioUrl(path: string | null): Promise<string | null> {
  if (!path) return null
  try {
    return await getSignedDownloadUrl(path)
  } catch {
    return null
  }
}

// ── Queries ────────────────────────────────────────────────

export async function getPracticeFilterCounts(deckId: string): Promise<PracticeFilterCounts> {
  const userId = await requireAuth()
  const deck = await verifyDeckOwnership(deckId, userId)
  if (!deck) return { all: 0, new: 0, difficult: 0, due: 0 }

  const [all, newCount, difficultCount, dueCount] = await Promise.all([
    prisma.flashcard.count({ where: { deckId } }),
    prisma.flashcard.count({ where: { deckId, repetitions: 0 } }),
    prisma.flashcard.count({ where: { deckId, difficulty: { in: ['LEARNING', 'RELEARNING'] } } }),
    prisma.flashcard.count({ where: { deckId, nextReviewAt: { lte: new Date() } } }),
  ])

  return { all, new: newCount, difficult: difficultCount, due: dueCount }
}

export async function getCardsForPractice(
  deckId: string,
  filter: PracticeFilter
): Promise<ReviewCard[]> {
  const userId = await requireAuth()
  const deck = await verifyDeckOwnership(deckId, userId)
  if (!deck) return []

  type FlashcardWhere = {
    deckId: string
    repetitions?: number
    difficulty?: { in: string[] }
    nextReviewAt?: { lte: Date }
  }
  const where: FlashcardWhere = { deckId }

  if (filter === 'new') where.repetitions = 0
  else if (filter === 'difficult') where.difficulty = { in: ['LEARNING', 'RELEARNING'] }
  else if (filter === 'due') where.nextReviewAt = { lte: new Date() }

  const rows = await prisma.flashcard.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      frontContent: true,
      backContent: true,
      intervalDays: true,
      easeFactor: true,
      repetitions: true,
      difficulty: true,
      frontAudioPath: true,
      backAudioPath: true,
    },
  })

  // Shuffle so repeated practice isn't in the same order
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rows[i], rows[j]] = [rows[j], rows[i]]
  }

  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      frontAudioUrl: await resolveAudioUrl(row.frontAudioPath),
      backAudioUrl: await resolveAudioUrl(row.backAudioPath),
    }))
  )
}

// ── Mutations ─────────────────────────────────────────────

export async function createPracticeSession(
  deckId: string,
  filter: PracticeFilter,
  totalCards: number
): Promise<{ id: string } | { error: string }> {
  const userId = await requireAuth()
  const deck = await verifyDeckOwnership(deckId, userId)
  if (!deck) return { error: 'Deck não encontrado.' }

  const session = await prisma.practiceSession.create({
    data: { userId, deckId, filter, totalCards },
  })

  return { id: session.id }
}

export async function submitPracticeRating(
  sessionId: string,
  cardId: string,
  rating: string
): Promise<{ error: string } | undefined> {
  const userId = await requireAuth()

  const session = await prisma.practiceSession.findUnique({ where: { id: sessionId } })
  if (!session || session.userId !== userId) return { error: 'Sessão não encontrada.' }

  const card = await prisma.flashcard.findUnique({
    where: { id: cardId },
    include: { deck: { select: { userId: true } } },
  })
  if (!card || card.deck.userId !== userId) return { error: 'Card não encontrado.' }

  // Only logs the practice — never touches the Flashcard's SM-2 fields
  await prisma.practiceReview.create({
    data: { sessionId, flashcardId: cardId, rating },
  })
}

export async function endPracticeSession(
  sessionId: string
): Promise<{ error: string } | undefined> {
  const userId = await requireAuth()

  const session = await prisma.practiceSession.findUnique({ where: { id: sessionId } })
  if (!session || session.userId !== userId) return { error: 'Sessão não encontrada.' }

  await prisma.practiceSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  })
}
