import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────

const mockPrisma = {
  flashcard: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  practiceSession: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  practiceReview: {
    create: vi.fn(),
  },
  deck: {
    findUnique: vi.fn(),
  },
  flashcard_count: vi.fn(),
}

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }) }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

// Import after mocks are registered
const { submitPracticeRating, endPracticeSession, createPracticeSession } =
  await import('@/server/actions/practice-actions')

// ── Tests ──────────────────────────────────────────────────

describe('Free Practice Mode — SM-2 isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.practiceSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      deckId: 'deck-1',
    })
    mockPrisma.flashcard.findUnique.mockResolvedValue({
      id: 'card-1',
      deck: { userId: 'user-1' },
    })
    mockPrisma.practiceReview.create.mockResolvedValue({ id: 'review-1' })
  })

  it('submitPracticeRating never calls flashcard.update', async () => {
    await submitPracticeRating('session-1', 'card-1', 'again')

    expect(mockPrisma.flashcard.update).not.toHaveBeenCalled()
  })

  it('submitPracticeRating creates a PracticeReview record', async () => {
    await submitPracticeRating('session-1', 'card-1', 'good')

    expect(mockPrisma.practiceReview.create).toHaveBeenCalledWith({
      data: { sessionId: 'session-1', flashcardId: 'card-1', rating: 'good' },
    })
  })

  it('submitPracticeRating records the correct rating string', async () => {
    for (const rating of ['again', 'hard', 'good', 'easy'] as const) {
      vi.clearAllMocks()
      mockPrisma.practiceSession.findUnique.mockResolvedValue({ id: 'session-1', userId: 'user-1' })
      mockPrisma.flashcard.findUnique.mockResolvedValue({
        id: 'card-1',
        deck: { userId: 'user-1' },
      })
      mockPrisma.practiceReview.create.mockResolvedValue({})

      await submitPracticeRating('session-1', 'card-1', rating)

      expect(mockPrisma.practiceReview.create).toHaveBeenCalledWith({
        data: { sessionId: 'session-1', flashcardId: 'card-1', rating },
      })
      expect(mockPrisma.flashcard.update).not.toHaveBeenCalled()
    }
  })

  it('submitPracticeRating rejects session belonging to another user', async () => {
    mockPrisma.practiceSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'other-user',
    })

    const result = await submitPracticeRating('session-1', 'card-1', 'good')

    expect(result).toEqual({ error: 'Sessão não encontrada.' })
    expect(mockPrisma.practiceReview.create).not.toHaveBeenCalled()
    expect(mockPrisma.flashcard.update).not.toHaveBeenCalled()
  })

  it('submitPracticeRating rejects card belonging to another user', async () => {
    mockPrisma.flashcard.findUnique.mockResolvedValue({
      id: 'card-1',
      deck: { userId: 'other-user' },
    })

    const result = await submitPracticeRating('session-1', 'card-1', 'easy')

    expect(result).toEqual({ error: 'Card não encontrado.' })
    expect(mockPrisma.practiceReview.create).not.toHaveBeenCalled()
    expect(mockPrisma.flashcard.update).not.toHaveBeenCalled()
  })

  it('endPracticeSession only sets endedAt — no flashcard changes', async () => {
    mockPrisma.practiceSession.update.mockResolvedValue({})

    await endPracticeSession('session-1')

    expect(mockPrisma.practiceSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { endedAt: expect.any(Date) },
    })
    expect(mockPrisma.flashcard.update).not.toHaveBeenCalled()
  })
})
