import { describe, it, expect } from 'vitest'
import { computePracticeStats } from '@/lib/practice-stats'

const start = new Date('2024-01-01T10:00:00Z')
const fiveMinutesLater = new Date('2024-01-01T10:05:00Z')

describe('computePracticeStats', () => {
  it('counts correct ratings (good + easy)', () => {
    const stats = computePracticeStats(['good', 'easy', 'again', 'hard'], start, fiveMinutesLater)
    expect(stats.correct).toBe(2)
  })

  it('counts incorrect ratings (again + hard)', () => {
    const stats = computePracticeStats(['good', 'easy', 'again', 'hard'], start, fiveMinutesLater)
    expect(stats.incorrect).toBe(2)
  })

  it('counts total cards', () => {
    const stats = computePracticeStats(['good', 'easy', 'again'], start, fiveMinutesLater)
    expect(stats.total).toBe(3)
  })

  it('computes 100% accuracy when all ratings are good/easy', () => {
    const stats = computePracticeStats(['good', 'easy', 'good'], start, fiveMinutesLater)
    expect(stats.accuracyPct).toBe(100)
  })

  it('computes 0% accuracy when all ratings are again/hard', () => {
    const stats = computePracticeStats(['again', 'hard', 'again'], start, fiveMinutesLater)
    expect(stats.accuracyPct).toBe(0)
  })

  it('computes rounded accuracy percentage', () => {
    // 1 correct out of 3 = 33.33... → rounds to 33
    const stats = computePracticeStats(['good', 'again', 'again'], start, fiveMinutesLater)
    expect(stats.accuracyPct).toBe(33)
  })

  it('returns 0% accuracy for empty ratings', () => {
    const stats = computePracticeStats([], start, fiveMinutesLater)
    expect(stats.accuracyPct).toBe(0)
    expect(stats.total).toBe(0)
  })

  it('computes duration in seconds', () => {
    const stats = computePracticeStats(['good'], start, fiveMinutesLater)
    expect(stats.durationSeconds).toBe(300)
  })

  it('formats duration with minutes and seconds', () => {
    const stats = computePracticeStats([], start, fiveMinutesLater)
    expect(stats.durationFormatted).toBe('5m 0s')
  })

  it('formats short duration in seconds only', () => {
    const thirtySecondsLater = new Date('2024-01-01T10:00:30Z')
    const stats = computePracticeStats([], start, thirtySecondsLater)
    expect(stats.durationFormatted).toBe('30s')
  })

  it('formats duration with leftover seconds', () => {
    const ninetySecondsLater = new Date('2024-01-01T10:01:30Z')
    const stats = computePracticeStats([], start, ninetySecondsLater)
    expect(stats.durationFormatted).toBe('1m 30s')
  })

  it('handles zero duration without negative values', () => {
    const stats = computePracticeStats([], start, start)
    expect(stats.durationSeconds).toBe(0)
  })
})
