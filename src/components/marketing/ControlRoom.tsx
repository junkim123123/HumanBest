"use client"

import React, { useMemo, useRef, useState } from "react"
import { useShelfPrice } from "@/contexts/ShelfPriceContext"
import { recalcReportFromAssumptions } from "@/lib/report/recalc"
import type { Report } from "@/lib/report/types"
import { InputPanel } from "./InputPanel"
import { DecisionRail } from "./DecisionRail"

const SAMPLE_RETAIL_PRICE = 4.99

const BASE_REPORT: Report = {
  schemaVersion: 1,
  id: "demo",
  productName: "Demo Product",
  summary: "",
  category: "toy",
  confidence: "medium",
  evidenceLevel: "category_prior",
  signals: {
    hasImportEvidence: false,
    hasInternalSimilarRecords: false,
    hasSupplierCandidates: false,
    verificationStatus: "none",
  },
  baseline: {
    costRange: {
      conservative: {
        unitPrice: 0.85,
        shippingPerUnit: 1.5,
        dutyPerUnit: 0.21,
        feePerUnit: 0.1,
        totalLandedCost: 2.66,
      },
      standard: {
        unitPrice: 0.75,
        shippingPerUnit: 1.2,
        dutyPerUnit: 0.19,
        feePerUnit: 0.08,
        totalLandedCost: 2.22,
      },
    },
    riskScores: { tariff: 0, compliance: 0, supply: 0, total: 0 },
    riskFlags: {
      tariff: { hsCodeRange: [], adCvdPossible: false, originSensitive: false },
      compliance: { requiredCertifications: [], labelingRisks: [], recallHints: [] },
      supply: { moqRange: { min: 0, max: 0, typical: 0 }, leadTimeRange: { min: 0, max: 0, typical: 0 }, qcChecks: [] },
    },
    evidence: {
      types: [],
      assumptions: {
        packaging: "",
        weight: "150g",
        volume: "0.0015 m³",
        incoterms: "FOB",
        shippingMode: "Air Express",
      },
      items: [],
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastResult: null,
      lastErrorCode: null,
    },
  },
  verification: { status: "not_requested" },
  nextActions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

interface ControlRoomProps {
  focusUploadId?: string
}

export default function ControlRoom({ focusUploadId }: ControlRoomProps) {
  const { shelfPrice, setShelfPrice } = useShelfPrice()
  const [unitWeightG, setUnitWeightG] = useState(150)
  const [unitVolumeCbm, setUnitVolumeCbm] = useState(0.0015)
  const [shippingMode, setShippingMode] = useState<"Air" | "Ocean">("Air")
  const [uploadName, setUploadName] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [changed, setChanged] = useState<Record<string, boolean>>({})
  const timersRef = useRef<Record<string, number>>({})
  const [lastStableReport, setLastStableReport] = useState<Report>(BASE_REPORT)
  const uploadInputId = focusUploadId ?? "control-room-upload"

  const liveReport = useMemo(
    () =>
      recalcReportFromAssumptions(BASE_REPORT, {
        unitWeightG,
        unitVolumeCbm,
        shipMode: shippingMode === "Air" ? "Air Express" : "Ocean Freight",
      }),
    [unitWeightG, unitVolumeCbm, shippingMode]
  )

  const report = lastError ? lastStableReport : liveReport

  const deliveredLow = report.baseline.costRange.standard.totalLandedCost
  const deliveredHigh = report.baseline.costRange.conservative.totalLandedCost
  const deliveredTypical = report.baseline.costRange.standard.totalLandedCost

  const hasRetailPrice = shelfPrice !== null && shelfPrice > 0 && Number.isFinite(shelfPrice)
  const retailValue = hasRetailPrice ? shelfPrice! : null

  const marginLow = retailValue ? ((retailValue - deliveredHigh) / retailValue) * 100 : null
  const marginHigh = retailValue ? ((retailValue - deliveredLow) / retailValue) * 100 : null
  const profitLow = retailValue ? retailValue - deliveredHigh : null
  const profitHigh = retailValue ? retailValue - deliveredLow : null

  const confidenceState: "verified" | "assumption" | "needs-proof" = uploadName
    ? "verified"
    : hasRetailPrice
    ? "assumption"
    : "needs-proof"

  const suggestion = ""

  const evidenceDetails = {
    matched: confidenceState === "verified",
    evidence: uploadName ? ["Photo attached to delivered cost"] : ["Using category and shipping assumptions"],
    assumptions: [
      `Shipping mode: ${shippingMode}`,
      `Weight: ${unitWeightG}g`,
      `Volume: ${unitVolumeCbm.toFixed(4)} m³`,
    ],
    upgrades: ["Upload label or barcode", "Confirm destination port", "Share HS code if available"],
  }

  const markChanged = (key: string) => {
    if (timersRef.current[key]) window.clearTimeout(timersRef.current[key])
    setChanged((prev) => ({ ...prev, [key]: true }))
    timersRef.current[key] = window.setTimeout(
      () => setChanged((prev) => ({ ...prev, [key]: false })),
      2000
    )
  }

  const handleRunEstimate = async () => {
    setIsRunning(true)
    setLastError(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 900))
      setLastStableReport(liveReport)
      setLastUpdated(new Date())
    } catch (err) {
      setLastError("Unable to refresh estimate right now. Keeping last good numbers.")
    } finally {
      setIsRunning(false)
    }
  }

  const handleUseSamplePrice = () => {
    setShelfPrice(SAMPLE_RETAIL_PRICE)
    markChanged("retail")
  }

  const handleUploadCta = () => {
    const el = document.getElementById(uploadInputId) as HTMLInputElement | null
    if (el) {
      el.focus()
      el.click()
    }
  }

  return (
    <div className="landing-container">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="landing-kicker">CONTROL ROOM</div>
          <div className="landing-title text-[1.625rem] sm:text-2xl">Update once, see cost and margin live</div>
          <p className="landing-subtitle">All inputs in one spot. Cost, margin, confidence update instantly.</p>
        </div>
        <div className="text-xs text-slate-500">Last good numbers stay visible while we recalc.</div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div>
          <InputPanel
            uploadName={uploadName}
            onUpload={(name) => {
              setUploadName(name)
              markChanged("upload")
            }}
            onClearUpload={() => {
              setUploadName(null)
              markChanged("upload")
            }}
            onUseSampleUpload={() => {
              setUploadName("sample-product.jpg")
              markChanged("upload")
            }}
            shelfPrice={shelfPrice}
            onShelfPriceChange={(value) => {
              setShelfPrice(value)
              markChanged("retail")
            }}
            onUseSamplePrice={handleUseSamplePrice}
            shippingMode={shippingMode}
            onShippingModeChange={(mode) => {
              setShippingMode(mode)
              markChanged("shipping")
            }}
            unitWeight={unitWeightG}
            onWeightChange={(v) => {
              setUnitWeightG(v)
              markChanged("weight")
            }}
            unitVolume={unitVolumeCbm}
            onVolumeChange={(v) => {
              setUnitVolumeCbm(Number(v.toFixed(4)))
              markChanged("volume")
            }}
            changed={changed}
            uploadInputId={uploadInputId}
          />
        </div>

        <div className="lg:w-[380px] lg:max-w-[400px]">
          <DecisionRail
            deliveredLow={deliveredLow}
            deliveredHigh={deliveredHigh}
            deliveredTypical={deliveredTypical}
            marginLow={marginLow}
            marginHigh={marginHigh}
            profitLow={profitLow}
            profitHigh={profitHigh}
            hasRetailPrice={hasRetailPrice}
            confidenceState={confidenceState}
            suggestion={suggestion}
            onRunEstimate={handleRunEstimate}
            isRunning={isRunning}
            lastUpdated={lastUpdated}
            isDemo={!uploadName}
            evidenceDetails={evidenceDetails}
            lastError={lastError}
            onUploadCta={handleUploadCta}
            onUseSamplePrice={handleUseSamplePrice}
          />
        </div>
      </div>
    </div>
  )
}
