'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateNextReview, type Rating } from '@/lib/spaced-repetition'

type ActionResult = { error: string } | undefined

export interface ReviewCard {
  id: string
  frontContent: string
  backContent: string
  intervalDays: number
  easeFactor: number
  repetitions: number
  difficulty: string
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

function computeDifficulty(
  result: { intervalDays: number; repetitions: number },
  rating: Rating,
  prevIntervalDays: number
): string {
  if (rating === 'again') return prevIntervalDays >= 21 ? 'RELEARNING' : 'LEARNING'
  if (result.intervalDays >= 21) return 'REVIEW'
  if (result.repetitions >= 1) return 'LEARNING'
  return 'NEW'
}

// ── Queries ───────────────────────────────────────────────

export async function getDueCards(deckId: string): Promise<ReviewCard[]> {
  const userId = await requireAuth()

  const deck = await verifyDeckOwnership(deckId, userId)
  if (!deck) return []

  return prisma.flashcard.findMany({
    where: { deckId, nextReviewAt: { lte: new Date() } },
    orderBy: { nextReviewAt: 'asc' },
    select: {
      id: true,
      frontContent: true,
      backContent: true,
      intervalDays: true,
      easeFactor: true,
      repetitions: true,
      difficulty: true,
    },
  })
}

export async function getReviewedTodayCount(deckId: string): Promise<number> {
  const userId = await requireAuth()

  const deck = await verifyDeckOwnership(deckId, userId)
  if (!deck) return 0

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  return prisma.reviewLog.count({
    where: {
      userId,
      flashcard: { deckId },
      reviewedAt: { gte: todayStart },
    },
  })
}

// ── Mutations ─────────────────────────────────────────────

export async function submitRating(cardId: string, rating: Rating): Promise<ActionResult> {
  const userId = await requireAuth()

  const card = await prisma.flashcard.findUnique({
    where: { id: cardId },
    include: { deck: { select: { userId: true, id: true } } },
  })

  if (!card || card.deck.userId !== userId) return { error: 'Card não encontrado.' }

  const result = calculateNextReview(
    { intervalDays: card.intervalDays, easeFactor: card.easeFactor, repetitions: card.repetitions },
    rating
  )

  const difficulty = computeDifficulty(result, rating, card.intervalDays)

  await prisma.$transaction([
    prisma.flashcard.update({
      where: { id: cardId },
      data: {
        intervalDays: result.intervalDays,
        easeFactor: result.easeFactor,
        repetitions: result.repetitions,
        nextReviewAt: result.nextReviewAt,
        difficulty,
      },
    }),
    prisma.reviewLog.create({
      data: {
        flashcardId: cardId,
        userId,
        rating,
        previousIntervalDays: card.intervalDays,
        newIntervalDays: result.intervalDays,
        previousEaseFactor: card.easeFactor,
        newEaseFactor: result.easeFactor,
      },
    }),
  ])

  revalidatePath(`/decks/${card.deck.id}`)
  revalidatePath('/dashboard')
}
