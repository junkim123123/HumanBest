"use client"

import * as React from "react"

type RangeBarProps = {
  min: number
  max: number
  domainMin?: number
  domainMax?: number
  marker?: number
  className?: string
}

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(1, x))
}

export function RangeBar(props: RangeBarProps) {
  const { min, max, domainMin, domainMax, marker, className } = props

  const dMin = Number.isFinite(domainMin as number) ? (domainMin as number) : min
  const dMax = Number.isFinite(domainMax as number) ? (domainMax as number) : max
  const span = Math.max(1e-9, dMax - dMin)

  const a = clamp01((min - dMin) / span)
  const b = clamp01((max - dMin) / span)

  const left = Math.min(a, b)
  const right = Math.max(a, b)
  const width = Math.max(0, right - left)

  const hasMarker = typeof marker === "number" && Number.isFinite(marker)
  const m = hasMarker ? clamp01(((marker as number) - dMin) / span) : 0

  return (
    <div className={className}>
      <div className="relative w-full rounded-full overflow-hidden h-1.5 bg-slate-200/70">
        <div
          className="absolute top-0 h-1.5 bg-slate-900/10 transition-all duration-200 ease-out"
          style={{ left: `${left * 100}%`, width: `${width * 100}%` }}
        />
        {hasMarker ? (
          <div
            className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white border border-slate-300 shadow-sm transition-all duration-200 ease-out"
            style={{ left: `${m * 100}%` }}
          />
        ) : null}
      </div>
    </div>
  )
}
