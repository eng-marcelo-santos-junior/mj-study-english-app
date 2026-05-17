export type Rating = 'again' | 'hard' | 'good' | 'easy'

export interface CardState {
  intervalDays: number
  easeFactor: number
  repetitions: number
}

export interface ReviewResult extends CardState {
  nextReviewAt: Date
}

const MIN_EASE_FACTOR = 1.3

export function calculateNextReview(card: CardState, rating: Rating): ReviewResult {
  let { intervalDays, easeFactor, repetitions } = card

  switch (rating) {
    case 'again':
      intervalDays = 1
      easeFactor = Math.max(easeFactor - 0.2, MIN_EASE_FACTOR)
      repetitions = 0
      break

    case 'hard':
      intervalDays = Math.max(1, intervalDays * 1.2)
      easeFactor = Math.max(easeFactor - 0.15, MIN_EASE_FACTOR)
      break

    case 'good':
      if (repetitions === 0) intervalDays = 1
      else if (repetitions === 1) intervalDays = 3
      else intervalDays = intervalDays * easeFactor
      repetitions += 1
      break

    case 'easy':
      intervalDays = intervalDays * easeFactor * 1.3
      easeFactor = easeFactor + 0.15
      repetitions += 1
      break
  }

  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + Math.round(intervalDays))
  nextReviewAt.setHours(0, 0, 0, 0)

  return { intervalDays, easeFactor, repetitions, nextReviewAt }
}
