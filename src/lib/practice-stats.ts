export type PracticeRating = 'again' | 'hard' | 'good' | 'easy'

export interface PracticeStats {
  total: number
  correct: number
  incorrect: number
  durationSeconds: number
  accuracyPct: number
  durationFormatted: string
}

export function computePracticeStats(
  ratings: string[],
  startedAt: Date,
  endedAt: Date
): PracticeStats {
  const total = ratings.length
  const correct = ratings.filter((r) => r === 'good' || r === 'easy').length
  const incorrect = ratings.filter((r) => r === 'again' || r === 'hard').length
  const durationSeconds = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000))
  const accuracyPct = total > 0 ? Math.round((correct / total) * 100) : 0

  const mins = Math.floor(durationSeconds / 60)
  const secs = durationSeconds % 60
  const durationFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  return { total, correct, incorrect, durationSeconds, accuracyPct, durationFormatted }
}
