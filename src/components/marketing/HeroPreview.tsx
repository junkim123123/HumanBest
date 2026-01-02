"use client"

import React from "react"
import { DollarSign, ShieldCheck } from "lucide-react"

interface HeroPreviewProps {
  label: string
  caption: string
}

export default function HeroPreview({ label, caption }: HeroPreviewProps) {
  return (
    <div className="relative rounded-3xl border border-slate-200/80 bg-white/92 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur before:absolute before:inset-6 before:-z-10 before:rounded-[28px] before:bg-blue-500/8 before:blur-2xl">
      <div className="absolute inset-0 -z-20 rounded-[28px] bg-gradient-to-br from-blue-50/35 via-white to-slate-50" />
      <div className="mb-3 text-xs font-semibold text-blue-700">{label}</div>
      <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden ring-1 ring-slate-100">
        <div className="flex items-center gap-1 border-b border-slate-100 bg-slate-50 px-3 py-2 text-slate-400">
          <span className="h-2 w-2 rounded-full bg-red-300" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-amber-300" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
          <span className="ml-2 text-[11px] font-semibold text-slate-600">Control Room</span>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          {/* Left inputs */}
          <div className="space-y-3">
            <div className="rounded-3xl border border-slate-100 bg-slate-50/90 p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Inputs</div>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200/70">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-500">IMG</span>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-slate-900">sample-toy.jpg</div>
                    <div className="text-[11px] text-slate-500">Photo attached</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Shipping mode</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200/70">
                    Ocean
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Weight</span>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">150 g</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Volume</span>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">0.0015 m³</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right metrics */}
          <div className="space-y-3">
            <div className="rounded-3xl border border-slate-100 bg-blue-50/70 p-3 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-800">
                <span>Delivered cost</span>
                <DollarSign className="h-3.5 w-3.5 text-blue-700" strokeWidth={2} />
              </div>
              <div className="mt-2 text-[26px] font-bold text-slate-900 tabular-nums leading-tight">$2.44</div>
              <div className="mt-1 text-[11px] text-slate-600">Range $2.22 – $2.66</div>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-emerald-50/70 p-3 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>Margin</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" strokeWidth={2} />
              </div>
              <div className="mt-2 text-[24px] font-bold text-emerald-700 tabular-nums leading-tight">41% – 49%</div>
              <div className="mt-1 text-[11px] text-slate-600">Profit per unit $2.33 – $2.55</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              Photo attached · Assumptions labeled
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-600">{caption}</div>
    </div>
  )
}
