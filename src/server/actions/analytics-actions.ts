'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface DailyActivity {
  date: string
  count: number
  accuracy: number
}

export interface WeeklyData {
  label: string
  count: number
  accuracy: number
}

export interface AnalyticsData {
  currentStreak: number
  longestStreak: number
  totalReviews: number
  accuracyRate: number
  cardsMatured: number
  weeklyAvg: number
  daily: DailyActivity[]
  distribution: { again: number; hard: number; good: number; easy: number }
  weekly: WeeklyData[]
  weeklyComparison: {
    thisWeek: number
    lastWeek: number
    thisAccuracy: number
    lastAccuracy: number
  }
}

async function requireAuth(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return session.user.id
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function calculateStreaks(sortedDatesDesc: string[]): { current: number; longest: number } {
  if (sortedDatesDesc.length === 0) return { current: 0, longest: 0 }

  const today = new Date()
  const todayStr = toDateStr(today)
  const yesterdayStr = toDateStr(new Date(today.getTime() - 86_400_000))

  // Current streak: start counting from today or yesterday
  let current = 0
  const canStart = sortedDatesDesc[0] === todayStr || sortedDatesDesc[0] === yesterdayStr

  if (canStart) {
    let prevDate: Date | null = null
    for (const dateStr of sortedDatesDesc) {
      const d = new Date(dateStr)
      if (!prevDate) {
        current = 1
        prevDate = d
      } else {
        const diffMs = prevDate.getTime() - d.getTime()
        if (diffMs === 86_400_000) {
          current++
          prevDate = d
        } else {
          break
        }
      }
    }
  }

  // Longest streak: scan ascending
  const ascending = [...sortedDatesDesc].reverse()
  let longest = 0
  let run = 0
  let prev: Date | null = null

  for (const dateStr of ascending) {
    const d = new Date(dateStr)
    if (!prev) {
      run = 1
    } else {
      const diffMs = d.getTime() - prev.getTime()
      run = diffMs === 86_400_000 ? run + 1 : 1
    }
    if (run > longest) longest = run
    prev = d
  }

  return { current, longest: Math.max(current, longest) }
}

function accuracyOf(logs: { rating: string }[]): number {
  if (logs.length === 0) return 0
  const correct = logs.filter((l) => l.rating === 'good' || l.rating === 'easy').length
  return Math.round((correct / logs.length) * 100)
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const userId = await requireAuth()

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  // Recent logs (30 days) + all-time dates for streak
  const [recentLogs, allDates, cardsMatured] = await Promise.all([
    prisma.reviewLog.findMany({
      where: { userId, reviewedAt: { gte: thirtyDaysAgo } },
      select: { rating: true, reviewedAt: true },
      orderBy: { reviewedAt: 'asc' },
    }),
    prisma.reviewLog.findMany({
      where: { userId },
      select: { reviewedAt: true },
      orderBy: { reviewedAt: 'desc' },
    }),
    prisma.flashcard.count({ where: { deck: { userId }, difficulty: 'REVIEW' } }),
  ])

  // ── Daily activity (last 30 days) ──────────────────────────
  const dailyMap = new Map<string, { count: number; correct: number }>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dailyMap.set(toDateStr(d), { count: 0, correct: 0 })
  }

  for (const log of recentLogs) {
    const key = toDateStr(log.reviewedAt)
    const entry = dailyMap.get(key)
    if (entry) {
      entry.count++
      if (log.rating === 'good' || log.rating === 'easy') entry.correct++
    }
  }

  const daily: DailyActivity[] = [...dailyMap.entries()].map(([date, { count, correct }]) => ({
    date,
    count,
    accuracy: count > 0 ? Math.round((correct / count) * 100) : 0,
  }))

  // ── Rating distribution (30 days) ─────────────────────────
  const distribution = { again: 0, hard: 0, good: 0, easy: 0 }
  for (const log of recentLogs) {
    const r = log.rating as keyof typeof distribution
    if (r in distribution) distribution[r]++
  }

  // ── Weekly comparison ──────────────────────────────────────
  const startOfThisWeek = new Date(now)
  startOfThisWeek.setDate(now.getDate() - now.getDay())
  startOfThisWeek.setHours(0, 0, 0, 0)

  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

  const thisWeekLogs = recentLogs.filter((l) => l.reviewedAt >= startOfThisWeek)
  const lastWeekLogs = recentLogs.filter(
    (l) => l.reviewedAt >= startOfLastWeek && l.reviewedAt < startOfThisWeek
  )

  // ── Weekly trend (last 4 complete weeks + current) ─────────
  const weekly: WeeklyData[] = []
  for (let w = 4; w >= 0; w--) {
    const start = new Date(startOfThisWeek)
    start.setDate(start.getDate() - w * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    const weekLogs = recentLogs.filter((l) => l.reviewedAt >= start && l.reviewedAt < end)

    const day = start.getDate().toString().padStart(2, '0')
    const month = (start.getMonth() + 1).toString().padStart(2, '0')
    weekly.push({
      label: w === 0 ? 'Esta sem.' : `${day}/${month}`,
      count: weekLogs.length,
      accuracy: accuracyOf(weekLogs),
    })
  }

  // ── Streak ─────────────────────────────────────────────────
  const uniqueDates = [...new Set(allDates.map((l) => toDateStr(l.reviewedAt)))].sort().reverse()
  const { current: currentStreak, longest: longestStreak } = calculateStreaks(uniqueDates)

  // ── Aggregated metrics ─────────────────────────────────────
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const last7 = recentLogs.filter((l) => l.reviewedAt >= sevenDaysAgo)

  return {
    currentStreak,
    longestStreak,
    totalReviews: allDates.length,
    accuracyRate: accuracyOf(recentLogs),
    cardsMatured,
    weeklyAvg: Math.round(last7.length / 7),
    daily,
    distribution,
    weekly,
    weeklyComparison: {
      thisWeek: thisWeekLogs.length,
      lastWeek: lastWeekLogs.length,
      thisAccuracy: accuracyOf(thisWeekLogs),
      lastAccuracy: accuracyOf(lastWeekLogs),
    },
  }
}
