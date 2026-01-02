"use client"

import Link from "next/link"
import React, { useMemo, useState } from "react"

interface DecisionRailProps {
  deliveredLow: number
  deliveredHigh: number
  deliveredTypical: number
  marginLow: number | null
  marginHigh: number | null
  profitLow: number | null
  profitHigh: number | null
  hasRetailPrice: boolean
  confidenceState: "verified" | "assumption" | "needs-proof"
  suggestion: string
  onRunEstimate: () => void
  isRunning: boolean
  lastUpdated: Date | null
  isDemo: boolean
  evidenceDetails: {
    matched: boolean
    evidence: string[]
    assumptions: string[]
    upgrades: string[]
  }
  lastError: string | null
  onUploadCta?: () => void
  onUseSamplePrice?: () => void
}

function formatMoney(n: number) {
  const v = Number.isFinite(n) ? n : 0
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatPct(n: number) {
  const v = Number.isFinite(n) ? n : 0
  return v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function DecisionRail({
  deliveredLow,
  deliveredHigh,
  deliveredTypical,
  marginLow,
  marginHigh,
  profitLow,
  profitHigh,
  hasRetailPrice,
  confidenceState,
  suggestion,
  onRunEstimate,
  isRunning,
  lastUpdated,
  isDemo,
  evidenceDetails,
  lastError,
  onUploadCta,
  onUseSamplePrice,
}: DecisionRailProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const confidenceCopy = useMemo(() => {
    if (confidenceState === "verified") return { label: "Verified record", tone: "bg-emerald-50 text-emerald-700 border-emerald-100" }
    if (confidenceState === "assumption") return { label: "Needs proof", tone: "bg-amber-50 text-amber-700 border-amber-200" }
    return { label: "Needs proof", tone: "bg-amber-50 text-amber-700 border-amber-200" }
  }, [confidenceState])

  const needsProof = confidenceState !== "verified"
  const evidenceCompleted = (isDemo ? 0 : 1) + (hasRetailPrice ? 1 : 0)
  const evidenceTotal = 2

  const renderBody = () => (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Delivered cost per unit</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div key={deliveredTypical} className="text-3xl font-semibold text-slate-900 tabular-nums transition-all duration-200">
                ${formatMoney(deliveredTypical)}
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span>Range {formatMoney(deliveredLow)} to {formatMoney(deliveredHigh)}</span>
              <span className="text-slate-300">•</span>
              <span>{isDemo ? "Needs proof" : "Live numbers"}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${confidenceCopy.tone}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
              {confidenceCopy.label}
            </span>
            <Link href="/reports/sample" className="text-xs font-semibold text-blue-700 hover:underline">
              View sample report
            </Link>
          </div>
        </div>
      </div>

      {hasRetailPrice ? (
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Margin & profit</div>
              <div className="mt-1 text-sm text-slate-700">
                Margin {formatPct(marginLow ?? 0)}% – {formatPct(marginHigh ?? 0)}% · Profit ${formatMoney(profitLow ?? 0)} to ${formatMoney(profitHigh ?? 0)}
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500">Retail provided</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs font-semibold text-amber-800">
          <span>Add a retail price to see margin & profit.</span>
          {onUseSamplePrice && (
            <button
              type="button"
              onClick={onUseSamplePrice}
              className="rounded-lg border border-amber-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-white"
            >
              Use sample price
            </button>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Confidence</div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            Evidence {evidenceCompleted}/{evidenceTotal}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span>{confidenceState === "verified" ? "Photo attached to delivered cost." : "Upload a photo to attach evidence."}</span>
          <button
            type="button"
            onClick={() => onUploadCta?.()}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            {needsProof ? "Upload photo" : "View record"}
          </button>
        </div>
      </div>

      {lastError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {lastError}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <button
            type="button"
            onClick={onRunEstimate}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-blue-700"
          >
            {isRunning ? "Running..." : "Run estimate"}
          </button>
          <Link href="/reports/sample" className="text-sm font-semibold text-blue-700 hover:underline">
            View sample report
          </Link>
        </div>
        <div className="text-[11px] text-slate-500">
          {lastUpdated ? `Last refreshed ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Live preview updates instantly."}
        </div>
      </div>
    </div>
  )

  return (
    <div className="lg:sticky lg:top-24">
      <div className="hidden lg:block rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-100/80 backdrop-blur">
        {renderBody()}
      </div>

      {/* Mobile sticky rail */}
      <div className="lg:hidden">
        <div className="fixed bottom-4 left-4 right-4 z-30 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl shadow-slate-200/80">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Delivered cost</div>
              <div className="text-xl font-semibold text-slate-900 tabular-nums">${formatMoney(deliveredTypical)}</div>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm"
            >
              Expand
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex flex-col bg-slate-900/40 backdrop-blur-sm">
            <div className="mt-auto rounded-t-3xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Decision Rail</div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-semibold text-slate-600"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 max-h-[70vh] overflow-y-auto pr-1">{renderBody()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
