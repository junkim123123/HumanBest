"use client"

import React, { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface InputPanelProps {
  uploadName: string | null
  onUpload: (fileName: string) => void
  onClearUpload: () => void
  onUseSampleUpload?: () => void
  shelfPrice: number | null
  onShelfPriceChange: (value: number | null) => void
  onUseSamplePrice: () => void
  shippingMode: "Air" | "Ocean"
  onShippingModeChange: (mode: "Air" | "Ocean") => void
  unitWeight: number
  onWeightChange: (value: number) => void
  unitVolume: number
  onVolumeChange: (value: number) => void
  changed: Record<string, boolean>
  uploadInputId?: string
}

function ChangedChip({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
      Updated
    </span>
  )
}

export function InputPanel({
  uploadName,
  onUpload,
  onClearUpload,
  onUseSampleUpload,
  shelfPrice,
  onShelfPriceChange,
  onUseSamplePrice,
  shippingMode,
  onShippingModeChange,
  unitWeight,
  onWeightChange,
  unitVolume,
  onVolumeChange,
  changed,
  uploadInputId,
}: InputPanelProps) {
  const priceIsEmpty = !shelfPrice
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <TooltipProvider>
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-md shadow-slate-100/80 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold tracking-wide text-slate-500">INPUT PANEL</div>
            <div className="text-base font-semibold text-slate-900">Single source of truth</div>
          </div>
          <div className="text-[11px] text-slate-500">Live updates to Decision Rail.</div>
        </div>

        <div className="mt-3 space-y-3.5">
          {/* Product photo */}
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Product photo</div>
              <ChangedChip show={!!changed.upload} />
            </div>
            <p className="mt-1 text-xs text-slate-600">Upload a product photo or barcode to replace demo values.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
                <input
                  id={uploadInputId}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onUpload(file.name)
                  }}
                />
                Upload photo
              </label>
              {uploadName ? (
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold">{uploadName}</span>
                  <button type="button" onClick={onClearUpload} className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-600">Using demo numbers until you upload.</div>
              )}
              {onUseSampleUpload && !uploadName && (
                <button type="button" onClick={onUseSampleUpload} className="text-xs font-semibold text-blue-700 hover:underline">
                  Use sample photo
                </button>
              )}
            </div>
          </div>

          {/* Retail price */}
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Retail price (optional)</div>
              <ChangedChip show={!!changed.retail} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="relative w-full max-w-[240px]">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={shelfPrice ?? ""}
                  onChange={(e) => onShelfPriceChange(e.target.value ? parseFloat(e.target.value) : null)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-7 pr-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter retail"
                  aria-label="Retail price"
                />
              </div>
              {priceIsEmpty && (
                <button type="button" onClick={onUseSamplePrice} className="text-xs font-semibold text-blue-700 hover:underline">
                  Use sample
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-600">Optional and only used for margin.</p>
          </div>

          {/* Shipping mode */}
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Shipping mode</div>
              <ChangedChip show={!!changed.shipping} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {["Air", "Ocean"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onShippingModeChange(mode as "Air" | "Ocean")}
                  className={`h-11 rounded-xl border text-sm font-semibold transition ${
                    shippingMode === mode
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-600">Air is faster, ocean cheaper.</p>
          </div>

          {/* Size */}
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Size</div>
              <ChangedChip show={!!changed.weight || !!changed.volume} />
            </div>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-28 text-xs font-semibold text-slate-700">Weight</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={unitWeight}
                    min={50}
                    max={500}
                    step={10}
                    onChange={(e) => onWeightChange(Math.max(50, Math.min(500, Number(e.target.value) || 50)))}
                    className="h-10 w-24 rounded-lg border border-slate-200 px-3 text-right text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  />
                  <span className="text-xs text-slate-600">g</span>
                  <Tooltip>
                    <TooltipTrigger className="text-slate-400">?</TooltipTrigger>
                    <TooltipContent side="top" className="bg-slate-800 text-white text-xs">
                      We use weight to scale freight and duty assumptions.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-28 text-xs font-semibold text-slate-700">Unit volume</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={unitVolume}
                    min={0.0005}
                    max={0.005}
                    step={0.0001}
                    onChange={(e) => onVolumeChange(Math.max(0.0005, Math.min(0.005, Number(e.target.value) || 0.0005)))}
                    className="h-10 w-28 rounded-lg border border-slate-200 px-3 text-right text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  />
                  <span className="text-xs text-slate-600">m³</span>
                  <Tooltip>
                    <TooltipTrigger className="text-slate-400">?</TooltipTrigger>
                    <TooltipContent side="top" className="bg-slate-800 text-white text-xs">
                      Cubic meters per unit for dimensional weight.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                {showAdvanced ? "Hide advanced" : "Show advanced sliders"}
              </button>
            </div>

            {showAdvanced && (
              <div className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3">
                <div>
                  <div className="text-xs font-semibold text-slate-700">Weight slider</div>
                  <div className="mt-2 flex items-center gap-3">
                    <Slider
                      min={50}
                      max={500}
                      step={10}
                      value={[unitWeight]}
                      onValueChange={([v]) => onWeightChange(v)}
                      className="flex-1"
                    />
                    <span className="text-xs text-slate-600">g</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-700">Volume slider</div>
                  <div className="mt-2 flex items-center gap-3">
                    <Slider
                      min={0.0005}
                      max={0.005}
                      step={0.0001}
                      value={[unitVolume]}
                      onValueChange={([v]) => onVolumeChange(v)}
                      className="flex-1"
                    />
                    <span className="text-xs text-slate-600">m³</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
