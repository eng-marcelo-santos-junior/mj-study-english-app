'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { submitRating } from '@/server/actions/review-actions'
import { calculateNextReview, type Rating } from '@/lib/spaced-repetition'
import { Button } from '@/components/ui/button'
import type { ReviewCard } from '@/server/actions/review-actions'

interface ReviewSessionProps {
  cards: ReviewCard[]
  deckId: string
  deckName: string
}

interface SessionStats {
  again: number
  hard: number
  good: number
  easy: number
}

// ── Interval preview helper ────────────────────────────────

function formatDays(days: number): string {
  const rounded = Math.round(days)
  if (rounded < 1) return '< 1 dia'
  if (rounded === 1) return '1 dia'
  if (rounded < 30) return `${rounded} dias`
  const months = Math.round(rounded / 30)
  return months === 1 ? '1 mês' : `${months} meses`
}

function getIntervalHints(card: ReviewCard): Record<Rating, string> {
  const ratings: Rating[] = ['again', 'hard', 'good', 'easy']
  const state = {
    intervalDays: card.intervalDays,
    easeFactor: card.easeFactor,
    repetitions: card.repetitions,
  }
  return Object.fromEntries(
    ratings.map((r) => [r, formatDays(calculateNextReview(state, r).intervalDays)])
  ) as Record<Rating, string>
}

// ── Sub-components ─────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 100 : Math.round((current / total) * 100)
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function RatingButtons({
  hints,
  onRate,
  disabled,
}: {
  hints: Record<Rating, string>
  onRate: (r: Rating) => void
  disabled: boolean
}) {
  const ratings: { key: Rating; label: string; color: string; hover: string }[] = [
    {
      key: 'again',
      label: 'Again',
      color: 'border-red-200 text-red-700 bg-red-50',
      hover: 'hover:bg-red-100',
    },
    {
      key: 'hard',
      label: 'Hard',
      color: 'border-orange-200 text-orange-700 bg-orange-50',
      hover: 'hover:bg-orange-100',
    },
    {
      key: 'good',
      label: 'Good',
      color: 'border-green-200 text-green-700 bg-green-50',
      hover: 'hover:bg-green-100',
    },
    {
      key: 'easy',
      label: 'Easy',
      color: 'border-blue-200 text-blue-700 bg-blue-50',
      hover: 'hover:bg-blue-100',
    },
  ]

  return (
    <div className="flex w-full gap-3">
      {ratings.map(({ key, label, color, hover }) => (
        <button
          key={key}
          onClick={() => onRate(key)}
          disabled={disabled}
          className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 ${color} ${hover}`}
        >
          <span className="text-sm">{label}</span>
          <span className="text-xs opacity-70">{hints[key]}</span>
        </button>
      ))}
    </div>
  )
}

function ReviewSummary({
  stats,
  total,
  deckId,
  deckName,
}: {
  stats: SessionStats
  total: number
  deckId: string
  deckName: string
}) {
  const breakdown = [
    {
      key: 'again' as const,
      label: 'Again',
      color: 'text-red-600 bg-red-50',
      border: 'border-red-100',
    },
    {
      key: 'hard' as const,
      label: 'Hard',
      color: 'text-orange-600 bg-orange-50',
      border: 'border-orange-100',
    },
    {
      key: 'good' as const,
      label: 'Good',
      color: 'text-green-600 bg-green-50',
      border: 'border-green-100',
    },
    {
      key: 'easy' as const,
      label: 'Easy',
      color: 'text-blue-600 bg-blue-50',
      border: 'border-blue-100',
    },
  ]

  const retained = stats.good + stats.easy
  const retentionPct = total > 0 ? Math.round((retained / total) * 100) : 0

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {/* Trophy */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-4xl">
          🎉
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Sessão concluída!</h1>
        <p className="text-sm text-gray-500">
          Você revisou <span className="font-medium text-gray-800">{total}</span>{' '}
          {total === 1 ? 'card' : 'cards'} do deck{' '}
          <span className="font-medium text-gray-800">{deckName}</span>
        </p>
      </div>

      {/* Retention */}
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="mb-1 text-xs text-gray-500">Taxa de retenção</p>
        <p className="text-4xl font-bold text-indigo-600">{retentionPct}%</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-700"
            style={{ width: `${retentionPct}%` }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid w-full max-w-sm grid-cols-4 gap-3">
        {breakdown.map(({ key, label, color, border }) => (
          <div
            key={key}
            className={`flex flex-col items-center rounded-xl border p-3 ${color} ${border}`}
          >
            <span className="text-xl font-bold">{stats[key]}</span>
            <span className="text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/decks/${deckId}`}>
          <Button variant="ghost">← Voltar ao deck</Button>
        </Link>
        <Link href="/dashboard">
          <Button>Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────

export function ReviewSession({ cards, deckId, deckName }: ReviewSessionProps) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [stats, setStats] = useState<SessionStats>({ again: 0, hard: 0, good: 0, easy: 0 })
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const card = cards[index]
  const hints = card ? getIntervalHints(card) : ({} as Record<Rating, string>)

  const handleRate = useCallback(
    async (rating: Rating) => {
      if (busy || !card) return
      setBusy(true)
      setStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }))
      setExiting(true)

      await Promise.all([
        submitRating(card.id, rating),
        new Promise<void>((r) => setTimeout(r, 300)),
      ])

      if (index + 1 >= cards.length) {
        setDone(true)
      } else {
        setIndex((i) => i + 1)
        setRevealed(false)
        setExiting(false)
        setBusy(false)
      }
    },
    [busy, card, index, cards.length]
  )

  if (done) {
    return <ReviewSummary stats={stats} total={cards.length} deckId={deckId} deckName={deckName} />
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/decks/${deckId}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {deckName}
        </Link>
        <span className="text-sm text-gray-500">
          {index + 1} / {cards.length}
        </span>
      </div>

      <ProgressBar current={index} total={cards.length} />

      {/* Card */}
      <div
        className={`flex min-h-[340px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 ${
          exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Front */}
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="text-center text-lg leading-relaxed whitespace-pre-wrap text-gray-900">
            {card.front}
          </p>
        </div>

        {/* Divider + Back */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            revealed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-dashed border-gray-200" />
          <div className="flex items-center justify-center p-8">
            <p className="text-center text-base leading-relaxed whitespace-pre-wrap text-gray-700">
              {card.back}
            </p>
          </div>
        </div>
      </div>

      {/* Action area */}
      <div
        className={`flex flex-col items-center gap-4 transition-all duration-200 ${
          exiting ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {!revealed ? (
          <Button onClick={() => setRevealed(true)} className="w-full max-w-xs" disabled={busy}>
            Mostrar resposta
          </Button>
        ) : (
          <div className="w-full">
            <p className="mb-3 text-center text-xs text-gray-400">Como foi?</p>
            <RatingButtons hints={hints} onRate={handleRate} disabled={busy} />
          </div>
        )}
      </div>

      {/* Card counter hint */}
      {!revealed && (
        <p className="text-center text-xs text-gray-400">
          {cards.length - index - 1}{' '}
          {cards.length - index - 1 === 1 ? 'card restante' : 'cards restantes'}
        </p>
      )}
    </div>
  )
}
