'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { submitRating } from '@/server/actions/review-actions'
import { calculateNextReview, type Rating } from '@/lib/spaced-repetition'
import { Button } from '@/components/ui/button'
import { AudioPlayer } from '@/components/audio/AudioPlayer'
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
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Card ${current} de ${total}`}
    >
      <div
        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

const RATING_CONFIG: {
  key: Rating
  label: string
  kbd: string
  color: string
  hover: string
}[] = [
  {
    key: 'again',
    label: 'Again',
    kbd: '1',
    color:
      'border-red-200 text-red-700 bg-red-50 dark:border-red-900 dark:text-red-300 dark:bg-red-950/40',
    hover: 'hover:bg-red-100 dark:hover:bg-red-900/40',
  },
  {
    key: 'hard',
    label: 'Hard',
    kbd: '2',
    color:
      'border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-900 dark:text-orange-300 dark:bg-orange-950/40',
    hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/40',
  },
  {
    key: 'good',
    label: 'Good',
    kbd: '3',
    color:
      'border-green-200 text-green-700 bg-green-50 dark:border-green-900 dark:text-green-300 dark:bg-green-950/40',
    hover: 'hover:bg-green-100 dark:hover:bg-green-900/40',
  },
  {
    key: 'easy',
    label: 'Easy',
    kbd: '4',
    color:
      'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:bg-blue-950/40',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/40',
  },
]

function RatingButtons({
  hints,
  onRate,
  disabled,
}: {
  hints: Record<Rating, string>
  onRate: (r: Rating) => void
  disabled: boolean
}) {
  return (
    <div className="flex w-full gap-2 sm:gap-3" role="group" aria-label="Avalie este card">
      {RATING_CONFIG.map(({ key, label, kbd, color, hover }) => (
        <button
          key={key}
          onClick={() => onRate(key)}
          disabled={disabled}
          aria-label={`${label} — próxima revisão em ${hints[key]} (tecla ${kbd})`}
          className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 ${color} ${hover}`}
        >
          <span className="text-sm">{label}</span>
          <span className="text-xs opacity-70">{hints[key]}</span>
          <span className="mt-0.5 rounded bg-black/5 px-1 py-px font-mono text-[10px] opacity-50 dark:bg-white/10">
            {kbd}
          </span>
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
      color: 'text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950/40',
      border: 'border-red-100 dark:border-red-900',
    },
    {
      key: 'hard' as const,
      label: 'Hard',
      color: 'text-orange-600 bg-orange-50 dark:text-orange-300 dark:bg-orange-950/40',
      border: 'border-orange-100 dark:border-orange-900',
    },
    {
      key: 'good' as const,
      label: 'Good',
      color: 'text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-950/40',
      border: 'border-green-100 dark:border-green-900',
    },
    {
      key: 'easy' as const,
      label: 'Easy',
      color: 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40',
      border: 'border-blue-100 dark:border-blue-900',
    },
  ]

  const retained = stats.good + stats.easy
  const retentionPct = total > 0 ? Math.round((retained / total) * 100) : 0

  return (
    <div className="animate-fade-in flex flex-col items-center gap-8 py-8">
      <div className="flex flex-col items-center gap-3">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-4xl dark:bg-indigo-950"
          aria-hidden
        >
          🎉
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
          Sessão concluída!
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Você revisou <span className="font-medium text-gray-800 dark:text-gray-200">{total}</span>{' '}
          {total === 1 ? 'card' : 'cards'} do deck{' '}
          <span className="font-medium text-gray-800 dark:text-gray-200">{deckName}</span>
        </p>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Taxa de retenção</p>
        <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{retentionPct}%</p>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
          role="meter"
          aria-valuenow={retentionPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-700"
            style={{ width: `${retentionPct}%` }}
          />
        </div>
      </div>

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
  // Track audio key to force AudioPlayer remount on card change
  const [audioKey, setAudioKey] = useState(0)

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
        setAudioKey((k) => k + 1)
      }
    },
    [busy, card, index, cards.length]
  )

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      // Space/Enter: reveal answer (AudioPlayer handles its own Space internally)
      if ((e.key === ' ' || e.key === 'Enter') && !revealed && !done) {
        e.preventDefault()
        setRevealed(true)
        return
      }

      if (revealed && !busy && !done) {
        const map: Record<string, Rating> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' }
        if (map[e.key]) {
          e.preventDefault()
          handleRate(map[e.key])
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [revealed, busy, done, handleRate])

  if (done) {
    return <ReviewSummary stats={stats} total={cards.length} deckId={deckId} deckName={deckName} />
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/decks/${deckId}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {deckName}
        </Link>
        <span className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
          {index + 1} / {cards.length}
        </span>
      </div>

      <ProgressBar current={index} total={cards.length} />

      {/* Card */}
      <div
        className={`flex min-h-[340px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 ${
          exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-label={revealed ? 'Card com frente e verso revelado' : 'Card — frente'}
      >
        {/* Front */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <div
            className="rich-content text-center text-lg leading-relaxed text-gray-900 dark:text-gray-50"
            dangerouslySetInnerHTML={{ __html: card.frontContent }}
          />
          {card.frontAudioUrl && (
            <AudioPlayer
              key={`front-${audioKey}`}
              src={card.frontAudioUrl}
              autoPlay
              label="Áudio — frente"
              className="w-full max-w-sm"
            />
          )}
        </div>

        {/* Divider + Back */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            revealed ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
          aria-hidden={!revealed}
        >
          <div className="border-t border-dashed border-gray-200 dark:border-gray-800" />
          <div className="flex flex-col items-center justify-center gap-4 p-8">
            <div
              className="rich-content text-center text-base leading-relaxed text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: card.backContent }}
            />
            {card.backAudioUrl && revealed && (
              <AudioPlayer
                key={`back-${audioKey}`}
                src={card.backAudioUrl}
                autoPlay
                label="Áudio — verso"
                className="w-full max-w-sm"
              />
            )}
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
          <div className="flex w-full flex-col items-center gap-2">
            <Button
              onClick={() => setRevealed(true)}
              className="w-full max-w-xs"
              disabled={busy}
              aria-label="Mostrar resposta (Espaço ou Enter)"
            >
              Mostrar resposta
            </Button>
            <p className="text-xs text-gray-400 dark:text-gray-600">
              Pressione{' '}
              <kbd className="rounded border border-gray-200 px-1 font-mono text-[10px] dark:border-gray-700">
                Espaço
              </kbd>{' '}
              ou{' '}
              <kbd className="rounded border border-gray-200 px-1 font-mono text-[10px] dark:border-gray-700">
                Enter
              </kbd>
            </p>
          </div>
        ) : (
          <div className="w-full">
            <p className="mb-3 text-center text-xs text-gray-400 dark:text-gray-500">Como foi?</p>
            <RatingButtons hints={hints} onRate={handleRate} disabled={busy} />
          </div>
        )}
      </div>

      {!revealed && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-600" aria-live="polite">
          {cards.length - index - 1}{' '}
          {cards.length - index - 1 === 1 ? 'card restante' : 'cards restantes'}
        </p>
      )}
    </div>
  )
}
