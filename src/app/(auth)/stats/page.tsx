import type { Metadata } from 'next'
import { getAnalyticsData } from '@/server/actions/analytics-actions'
import { ActivityChart } from '@/components/analytics/activity-chart'
import type { AnalyticsData } from '@/server/actions/analytics-actions'

export const metadata: Metadata = { title: 'Estatísticas — StudyApp' }

// ── Reusable sub-components (Server) ──────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function RatingBar({ distribution }: { distribution: AnalyticsData['distribution'] }) {
  const { again, hard, good, easy } = distribution
  const total = again + hard + good + easy
  if (total === 0) return <p className="text-sm text-gray-400">Sem dados</p>

  const pct = (n: number) => Math.round((n / total) * 100)
  const segments = [
    { label: 'Again', value: again, pct: pct(again), color: 'bg-red-400', text: 'text-red-700' },
    { label: 'Hard', value: hard, pct: pct(hard), color: 'bg-orange-400', text: 'text-orange-700' },
    { label: 'Good', value: good, pct: pct(good), color: 'bg-green-400', text: 'text-green-700' },
    { label: 'Easy', value: easy, pct: pct(easy), color: 'bg-blue-400', text: 'text-blue-700' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Stacked bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {segments.map(
          (s) =>
            s.pct > 0 && (
              <div
                key={s.label}
                className={s.color}
                style={{ width: `${s.pct}%` }}
                title={`${s.label}: ${s.pct}%`}
              />
            )
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className={`inline-block h-2 w-2 rounded-full ${s.color}`} />
              {s.label}
            </span>
            <span className={`text-xs font-medium ${s.text}`}>
              {s.pct}% <span className="font-normal text-gray-400">({s.value})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeeklyTrend({ weekly }: { weekly: AnalyticsData['weekly'] }) {
  const max = Math.max(...weekly.map((w) => w.count), 1)

  return (
    <div className="flex flex-col gap-3">
      {weekly.map((week) => {
        const barPct = max === 0 ? 0 : Math.round((week.count / max) * 100)
        return (
          <div key={week.label} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-right text-xs text-gray-500">{week.label}</span>
            <div className="flex flex-1 items-center gap-2">
              <div
                className="flex-1 overflow-hidden rounded-full bg-gray-100"
                style={{ height: '8px' }}
              >
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${barPct}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs font-medium text-gray-700">{week.count}</span>
              {week.count > 0 && (
                <span className="w-10 text-right text-xs text-gray-400">{week.accuracy}%</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WeeklyComparison({ comparison }: { comparison: AnalyticsData['weeklyComparison'] }) {
  const { thisWeek, lastWeek, thisAccuracy, lastAccuracy } = comparison
  const max = Math.max(thisWeek, lastWeek, 1)

  const rows = [
    { label: 'Esta semana', count: thisWeek, accuracy: thisAccuracy, color: 'bg-indigo-500' },
    { label: 'Semana passada', count: lastWeek, accuracy: lastAccuracy, color: 'bg-gray-300' },
  ]

  const diff = thisWeek - lastWeek
  const diffLabel =
    diff === 0
      ? 'Igual à semana passada'
      : diff > 0
        ? `+${diff} revisões a mais`
        : `${diff} revisões a menos`
  const diffColor = diff >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-gray-600">{row.label}</span>
            <span className="text-gray-500">
              {row.count} rev. · {row.accuracy}% acerto
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${row.color}`}
              style={{ width: `${Math.round((row.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}

      <p className={`text-xs font-medium ${diffColor}`}>{diffLabel}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

export default async function StatsPage() {
  const data = await getAnalyticsData()

  const summaryCards = [
    {
      label: '🔥 Streak atual',
      value: `${data.currentStreak}d`,
      sub: `Recorde: ${data.longestStreak} dias`,
      accent: data.currentStreak > 0 ? 'text-orange-600' : 'text-gray-900',
    },
    {
      label: '✅ Taxa de acerto',
      value: `${data.accuracyRate}%`,
      sub: 'Últimos 30 dias',
      accent:
        data.accuracyRate >= 80
          ? 'text-green-600'
          : data.accuracyRate >= 60
            ? 'text-amber-600'
            : 'text-red-600',
    },
    {
      label: '📚 Total revisões',
      value: data.totalReviews.toLocaleString('pt-BR'),
      sub: `~${data.weeklyAvg}/dia esta semana`,
      accent: 'text-indigo-700',
    },
    {
      label: '🎓 Cards maduros',
      value: data.cardsMatured,
      sub: 'Intervalo ≥ 21 dias',
      accent: 'text-blue-700',
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Estatísticas</h1>
        <p className="mt-1 text-sm text-gray-500">Acompanhe sua evolução de aprendizado</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Activity chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Atividade — últimos 30 dias</h2>
        <ActivityChart data={data.daily} />
      </div>

      {/* Two-column section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rating distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Distribuição de avaliações
            <span className="ml-1 font-normal text-gray-400">(30 dias)</span>
          </h2>
          <RatingBar distribution={data.distribution} />
        </div>

        {/* Weekly comparison */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Esta semana vs anterior</h2>
          <WeeklyComparison comparison={data.weeklyComparison} />
        </div>
      </div>

      {/* Weekly trend */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Tendência semanal</h2>
        <p className="mb-4 text-xs text-gray-400">Revisões · Acerto%</p>
        <WeeklyTrend weekly={data.weekly} />
      </div>

      {/* Daily breakdown table — last 7 days */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Últimos 7 dias</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {data.daily
            .slice(-7)
            .reverse()
            .map((day) => {
              const date = new Date(day.date)
              const label = date.toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
              })
              const isToday = day.date === new Date().toISOString().split('T')[0]

              return (
                <div key={day.date} className="flex items-center justify-between px-6 py-3">
                  <span className="w-32 text-sm text-gray-700 capitalize">
                    {label}
                    {isToday && (
                      <span className="ml-1.5 rounded bg-indigo-50 px-1 py-0.5 text-xs text-indigo-600">
                        hoje
                      </span>
                    )}
                  </span>

                  {day.count === 0 ? (
                    <span className="text-sm text-gray-400">—</span>
                  ) : (
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-medium text-gray-900">{day.count} rev.</span>
                      <span
                        className={`text-sm font-medium ${
                          day.accuracy >= 80
                            ? 'text-green-600'
                            : day.accuracy >= 60
                              ? 'text-amber-600'
                              : 'text-red-600'
                        }`}
                      >
                        {day.accuracy}%
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
