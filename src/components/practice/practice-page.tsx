'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  getCardsForPractice,
  createPracticeSession,
  submitPracticeRating,
  endPracticeSession,
  type PracticeFilter,
  type PracticeFilterCounts,
} from '@/server/actions/practice-actions'
import { computePracticeStats, type PracticeStats } from '@/lib/practice-stats'
import { Button } from '@/components/ui/button'
import { AudioPlayer } from '@/components/audio/AudioPlayer'
import type { ReviewCard } from '@/server/actions/review-actions'

// ── Types ──────────────────────────────────────────────────

type Phase = 'select' | 'practicing' | 'done'

interface Props {
  deckId: string
  deckName: string
  filterCounts: PracticeFilterCounts
}

// ── Filter selection ───────────────────────────────────────

const FILTER_OPTIONS: {
  key: PracticeFilter
  label: string
  description: string
  icon: string
}[] = [
  {
    key: 'all',
    label: 'Todos os cards',
    description: 'Todos os cards do deck',
    icon: '📚',
  },
  {
    key: 'new',
    label: 'Cards novos',
    description: 'Ainda não revisados nenhuma vez',
    icon: '✨',
  },
  {
    key: 'difficult',
    label: 'Cards difíceis',
    description: 'Em processo de aprendizado ou reaprendizado',
    icon: '🔥',
  },
  {
    key: 'due',
    label: 'Para revisar hoje',
    description: 'Vencidos ou devidos agora',
    icon: '📅',
  },
]

function FilterSelector({
  deckName,
  deckId,
  filterCounts,
  selected,
  onSelect,
  onStart,
  loading,
}: {
  deckName: string
  deckId: string
  filterCounts: PracticeFilterCounts
  selected: PracticeFilter
  onSelect: (f: PracticeFilter) => void
  onStart: () => void
  loading: boolean
}) {
  const count = filterCounts[selected]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            Prática Livre
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{deckName}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Pratique sem alterar o agendamento oficial dos seus cards.
        </p>
      </div>

      {/* Filter options */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Selecione os cards para praticar:
        </p>
        {FILTER_OPTIONS.map((opt) => {
          const cnt = filterCounts[opt.key]
          const isSelected = selected === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => onSelect(opt.key)}
              className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 ${
                isSelected
                  ? 'border-violet-500 bg-violet-50 dark:border-violet-600 dark:bg-violet-950/40'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'
              }`}
              aria-pressed={isSelected}
            >
              <span className="text-2xl" aria-hidden>
                {opt.icon}
              </span>
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    isSelected
                      ? 'text-violet-900 dark:text-violet-100'
                      : 'text-gray-900 dark:text-gray-50'
                  }`}
                >
                  {opt.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{opt.description}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-bold ${
                  isSelected
                    ? 'bg-violet-200 text-violet-800 dark:bg-violet-800 dark:text-violet-200'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {cnt}
              </span>
            </button>
          )
        })}
      </div>

      {/* Start button */}
      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={onStart}
          disabled={count === 0 || loading}
          className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
          aria-label={
            count === 0
              ? 'Nenhum card disponível neste filtro'
              : `Iniciar prática com ${count} cards`
          }
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Carregando cards…
            </>
          ) : count === 0 ? (
            'Nenhum card disponível'
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Iniciar prática ({count} {count === 1 ? 'card' : 'cards'})
            </>
          )}
        </Button>
        <Link
          href={`/decks/${deckId}`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Voltar ao deck
        </Link>
      </div>
    </div>
  )
}

// ── Rating buttons (no interval hints) ────────────────────

const RATING_CONFIG: {
  key: string
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
        className="h-full rounded-full bg-violet-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── Practice session (card loop) ───────────────────────────

function PracticeSession({
  cards,
  sessionId,
  deckId,
  deckName,
  onEnd,
}: {
  cards: ReviewCard[]
  sessionId: string
  deckId: string
  deckName: string
  onEnd: (ratings: string[]) => void
}) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [audioKey, setAudioKey] = useState(0)
  const ratingsRef = useRef<string[]>([])

  const card = cards[index]

  const advance = useCallback(
    (rating: string) => {
      ratingsRef.current = [...ratingsRef.current, rating]
      if (index + 1 >= cards.length) {
        onEnd(ratingsRef.current)
      } else {
        setIndex((i) => i + 1)
        setRevealed(false)
        setExiting(false)
        setBusy(false)
        setAudioKey((k) => k + 1)
      }
    },
    [index, cards.length, onEnd]
  )

  const handleRate = useCallback(
    async (rating: string) => {
      if (busy || !card) return
      setBusy(true)
      setExiting(true)

      await Promise.all([
        submitPracticeRating(sessionId, card.id, rating),
        new Promise<void>((r) => setTimeout(r, 300)),
      ])

      advance(rating)
    },
    [busy, card, sessionId, advance]
  )

  const handleFinishEarly = useCallback(async () => {
    if (busy) return
    setBusy(true)
    onEnd(ratingsRef.current)
  }, [busy, onEnd])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      if ((e.key === ' ' || e.key === 'Enter') && !revealed) {
        e.preventDefault()
        setRevealed(true)
        return
      }

      if (revealed && !busy) {
        const map: Record<string, string> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' }
        if (map[e.key]) {
          e.preventDefault()
          handleRate(map[e.key])
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [revealed, busy, handleRate])

  if (!card) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
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
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            Prática Livre
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
            {index + 1} / {cards.length}
          </span>
          <button
            onClick={handleFinishEarly}
            disabled={busy}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Encerrar sessão de prática"
          >
            Encerrar
          </button>
        </div>
      </div>

      <ProgressBar current={index} total={cards.length} />

      {/* Card */}
      <div
        className={`flex min-h-[340px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 ${
          exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-label={revealed ? 'Card com frente e verso revelado' : 'Card — frente'}
      >
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
            <p className="mb-3 text-center text-xs text-gray-400 dark:text-gray-500">
              Como foi? (prática — não afeta o agendamento)
            </p>
            <div className="flex w-full gap-2 sm:gap-3" role="group" aria-label="Avalie este card">
              {RATING_CONFIG.map(({ key, label, kbd, color, hover }) => (
                <button
                  key={key}
                  onClick={() => handleRate(key)}
                  disabled={busy}
                  aria-label={`${label} (tecla ${kbd})`}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 ${color} ${hover}`}
                >
                  <span className="text-sm">{label}</span>
                  <span className="mt-0.5 rounded bg-black/5 px-1 py-px font-mono text-[10px] opacity-50 dark:bg-white/10">
                    {kbd}
                  </span>
                </button>
              ))}
            </div>
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

// ── Practice summary ───────────────────────────────────────

function PracticeSummary({
  stats,
  deckId,
  deckName,
  onPracticeAgain,
}: {
  stats: PracticeStats
  deckId: string
  deckName: string
  onPracticeAgain: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="flex flex-col items-center gap-3">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-4xl dark:bg-violet-950"
          aria-hidden
        >
          🏋️
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
          Sessão concluída!
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Prática livre de{' '}
          <span className="font-medium text-gray-800 dark:text-gray-200">{deckName}</span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        {[
          { label: 'Cards vistos', value: stats.total, color: 'text-gray-800 dark:text-gray-100' },
          {
            label: 'Acertos',
            value: stats.correct,
            color: 'text-green-600 dark:text-green-400',
          },
          { label: 'Erros', value: stats.incorrect, color: 'text-red-600 dark:text-red-400' },
          {
            label: 'Tempo',
            value: stats.durationFormatted,
            color: 'text-indigo-600 dark:text-indigo-400',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Accuracy bar */}
      {stats.total > 0 && (
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">Taxa de acerto</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {stats.accuracyPct}%
            </p>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
            role="meter"
            aria-valuenow={stats.accuracyPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-700"
              style={{ width: `${stats.accuracyPct}%` }}
            />
          </div>
        </div>
      )}

      <p className="max-w-xs text-center text-xs text-gray-400 dark:text-gray-600">
        Esta sessão foi registrada como prática livre. Seu agendamento de revisão não foi alterado.
      </p>

      <div className="flex gap-3">
        <Link href={`/decks/${deckId}`}>
          <Button variant="ghost">← Voltar ao deck</Button>
        </Link>
        <Button onClick={onPracticeAgain} className="bg-violet-600 hover:bg-violet-700">
          Praticar novamente
        </Button>
      </div>
    </div>
  )
}

// ── Main orchestrator ──────────────────────────────────────

export function PracticePage({ deckId, deckName, filterCounts }: Props) {
  const [phase, setPhase] = useState<Phase>('select')
  const [filter, setFilter] = useState<PracticeFilter>('all')
  const [cards, setCards] = useState<ReviewCard[]>([])
  const [sessionId, setSessionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<PracticeStats | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  const handleStart = async () => {
    const count = filterCounts[filter]
    if (count === 0) return
    setLoading(true)

    const [fetchedCards, sessionResult] = await Promise.all([
      getCardsForPractice(deckId, filter),
      createPracticeSession(deckId, filter, count),
    ])

    if ('error' in sessionResult) {
      setLoading(false)
      return
    }

    startTimeRef.current = new Date()
    setCards(fetchedCards)
    setSessionId(sessionResult.id)
    setPhase('practicing')
    setLoading(false)
  }

  const handleSessionEnd = useCallback(
    async (ratings: string[]) => {
      const endTime = new Date()
      await endPracticeSession(sessionId)
      setStats(computePracticeStats(ratings, startTimeRef.current ?? endTime, endTime))
      setPhase('done')
    },
    [sessionId]
  )

  const handlePracticeAgain = () => {
    setPhase('select')
    setCards([])
    setSessionId('')
    setStats(null)
    startTimeRef.current = null
  }

  if (phase === 'select') {
    return (
      <FilterSelector
        deckName={deckName}
        deckId={deckId}
        filterCounts={filterCounts}
        selected={filter}
        onSelect={setFilter}
        onStart={handleStart}
        loading={loading}
      />
    )
  }

  if (phase === 'practicing') {
    return (
      <PracticeSession
        cards={cards}
        sessionId={sessionId}
        deckId={deckId}
        deckName={deckName}
        onEnd={handleSessionEnd}
      />
    )
  }

  return (
    <PracticeSummary
      stats={stats!}
      deckId={deckId}
      deckName={deckName}
      onPracticeAgain={handlePracticeAgain}
    />
  )
}
