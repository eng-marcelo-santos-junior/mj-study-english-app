'use client'

import { useState } from 'react'
import type { DailyActivity } from '@/server/actions/analytics-actions'

interface TooltipData {
  x: number
  y: number
  day: DailyActivity
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

export function ActivityChart({ data }: { data: DailyActivity[] }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const max = Math.max(...data.map((d) => d.count), 1)

  // Show month labels at week boundaries
  const monthLabels: { index: number; label: string }[] = []
  let lastMonth = -1
  data.forEach((day, i) => {
    const month = new Date(day.date).getMonth()
    if (month !== lastMonth) {
      const label = new Date(day.date).toLocaleDateString('pt-BR', { month: 'short' })
      monthLabels.push({ index: i, label })
      lastMonth = month
    }
  })

  return (
    <div className="relative select-none">
      {/* Bars */}
      <div className="flex items-end gap-px" style={{ height: '80px' }}>
        {data.map((day, i) => {
          const heightPct = day.count === 0 ? 3 : Math.max((day.count / max) * 100, 6)
          const isToday = day.date === new Date().toISOString().split('T')[0]

          let bg = '#e5e7eb' // gray-200 for zero days
          if (day.count > 0) {
            if (day.accuracy >= 80)
              bg = '#4338ca' // indigo-700
            else if (day.accuracy >= 60)
              bg = '#6366f1' // indigo-500
            else bg = '#a5b4fc' // indigo-300
          }

          return (
            <div
              key={day.date}
              className="relative flex-1 cursor-default rounded-sm transition-opacity hover:opacity-75"
              style={{ height: `${heightPct}%`, backgroundColor: bg }}
              onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, day })}
              onMouseLeave={() => setTooltip(null)}
            >
              {isToday && (
                <div className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-indigo-600" />
              )}
            </div>
          )
        })}
      </div>

      {/* Month labels */}
      <div className="relative mt-1 flex" style={{ height: '16px' }}>
        {monthLabels.map(({ index, label }) => (
          <span
            key={label + index}
            className="absolute text-xs text-gray-400 capitalize"
            style={{ left: `${(index / data.length) * 100}%` }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-200" />
          Sem revisão
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-300" />
          Acerto &lt; 60%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-500" />
          60–79%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-700" />≥ 80%
        </span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 52 }}
        >
          <p className="font-medium capitalize">{formatDateLabel(tooltip.day.date)}</p>
          {tooltip.day.count === 0 ? (
            <p className="text-gray-400">Sem revisões</p>
          ) : (
            <>
              <p>{tooltip.day.count} revisões</p>
              <p>{tooltip.day.accuracy}% de acerto</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
