// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Package, AlertTriangle, Shield } from "lucide-react";
import type { LandedCost } from "@/lib/intelligence-pipeline";
import type { ImageAnalysisResult } from "@/lib/intelligence-pipeline";

interface LandedCostCardProps {
  landedCost: LandedCost;
  quantity: number;
  dutyRate: number;
  analysis?: ImageAnalysisResult; // Optional: for risk management display
  packMath?: {
    unitsPerInnerPack?: number;
    innerPacksPerCarton?: number;
    unitsPerCarton?: number;
    cartonGrossWeightKg?: number;
    cartonDimensionsCm?: {
      length: number;
      width: number;
      height: number;
    };
  };
}

export function LandedCostCard({
  landedCost,
  quantity,
  dutyRate,
  analysis,
  packMath,
}: LandedCostCardProps) {
  const totalCost = landedCost.totalLandedCost * quantity;
  const unitCost = landedCost.totalLandedCost;
  const margin = 50; // Estimated margin 50% (needs calculation in production)
  
  // Calculate per carton costs if pack math is available
  const unitsPerCarton = packMath?.unitsPerCarton;
  const innerPacksPerCarton = packMath?.innerPacksPerCarton;
  const unitsPerInnerPack = packMath?.unitsPerInnerPack;
  
  const cartonLandedCost = unitsPerCarton ? unitCost * unitsPerCarton : null;
  const innerPackLandedCost = unitsPerInnerPack ? unitCost * unitsPerInnerPack : null;
  
  const cartonFobCost = unitsPerCarton ? landedCost.unitPrice * unitsPerCarton : null;
  const innerPackFobCost = unitsPerInnerPack ? landedCost.unitPrice * unitsPerInnerPack : null;

  const costBreakdown = [
    {
      label: "Unit Price",
      value: landedCost.unitPrice,
      color: "bg-slate-400",
      percentage: (landedCost.unitPrice / unitCost) * 100,
    },
    {
      label: "Duty",
      value: landedCost.breakdown.dutyAmount,
      color: "bg-electric-blue-400",
      percentage: (landedCost.breakdown.dutyAmount / unitCost) * 100,
    },
    {
      label: "Shipping",
      value: landedCost.shippingCost,
      color: "bg-electric-blue-500",
      percentage: (landedCost.shippingCost / unitCost) * 100,
    },
    {
      label: "Fee",
      value: landedCost.fee,
      color: "bg-electric-blue-600",
      percentage: (landedCost.fee / unitCost) * 100,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-electric-blue-100 rounded-xl">
          <DollarSign className="w-5 h-5 text-electric-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Landed Cost</h2>
      </div>

      {/* Top summary message */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-slate-700">
          {landedCost.unitPrice > 0 
            ? "Based on available unit pricing. Real quote may differ by spec and packaging."
            : "Market estimate only. Get a real quote to confirm."}
        </p>
      </div>

      <div className="space-y-6">
        {/* Pricing for Retail and Wholesale */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-700">Pricing for retail and wholesale</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Per Unit */}
            <div className="bg-white rounded-xl p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Per unit</div>
              <div className="text-lg font-bold text-slate-900">
                ${unitCost.toFixed(2)}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                FOB: ${landedCost.unitPrice.toFixed(2)}
              </div>
            </div>
            
            {/* Per Inner Pack */}
            {innerPackLandedCost ? (
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">
                  Per inner pack ({unitsPerInnerPack} units)
                </div>
                <div className="text-lg font-bold text-slate-900">
                  ${innerPackLandedCost.toFixed(2)}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  FOB: ${innerPackFobCost?.toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-3 border border-slate-200 opacity-50">
                <div className="text-xs text-slate-500 mb-1">Per inner pack</div>
                <div className="text-sm text-slate-400">Unknown</div>
                <div className="text-xs text-slate-500 mt-1">
                  Label photo or carton specs needed
                </div>
              </div>
            )}
            
            {/* Per Master Carton */}
            {cartonLandedCost ? (
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">
                  Per master carton ({unitsPerCarton} units)
                </div>
                <div className="text-lg font-bold text-slate-900">
                  ${cartonLandedCost.toFixed(2)}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  FOB: ${cartonFobCost?.toFixed(2)}
                </div>
                {packMath?.cartonGrossWeightKg && (
                  <div className="text-xs text-slate-500 mt-1">
                    Weight: {packMath.cartonGrossWeightKg}kg
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-3 border border-slate-200 opacity-50">
                <div className="text-xs text-slate-500 mb-1">Per master carton</div>
                <div className="text-sm text-slate-400">Unknown</div>
                <div className="text-xs text-slate-500 mt-1">
                  Label photo or carton specs needed
                </div>
              </div>
            )}
          </div>
          
          {/* Pack Math Assumptions */}
          {packMath && (unitsPerCarton || unitsPerInnerPack) && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="text-xs font-medium text-slate-700 mb-2">Assumptions used for pack math</div>
              <div className="space-y-1 text-xs text-slate-600">
                {unitsPerInnerPack && (
                  <div>• Inner pack: {unitsPerInnerPack} units per pack</div>
                )}
                {innerPacksPerCarton && (
                  <div>• Carton: {innerPacksPerCarton} inner packs per carton</div>
                )}
                {unitsPerCarton && (
                  <div>• Total: {unitsPerCarton} units per carton</div>
                )}
                {packMath.cartonGrossWeightKg && (
                  <div>• Carton weight: {packMath.cartonGrossWeightKg}kg</div>
                )}
                {packMath.cartonDimensionsCm && (
                  <div>• Carton size: {packMath.cartonDimensionsCm.length} × {packMath.cartonDimensionsCm.width} × {packMath.cartonDimensionsCm.height} cm</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Total Cost (for backward compatibility) */}
        <div className="bg-slate-50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Total Landed Cost</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">
              ${totalCost.toFixed(2)}
            </span>
            <span className="text-sm text-slate-500">
              ({quantity} units)
            </span>
          </div>
          <div className="mt-2 text-sm text-slate-600">
            Unit Cost: <span className="font-semibold">${unitCost.toFixed(2)}</span>
          </div>
        </div>

        {/* Cost Breakdown Bar */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            Cost Breakdown
          </h3>
          <div className="space-y-2">
            {costBreakdown.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium text-slate-900">
                    ${item.value.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    className={`h-full ${item.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estimated Margin */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-electric-blue-600" />
            <span className="text-sm font-medium text-slate-700">
              Estimated Margin
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-electric-blue-600">
              {margin}%
            </span>
            <span className="text-sm text-slate-500">
              (Est. Selling Price: ${(unitCost * (1 + margin / 100)).toFixed(2)})
            </span>
          </div>
        </div>

        {/* Risk Management: Section 301 Tariff Warning */}
        {analysis?.estimatedHsCode && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-slate-700">
                Risk Management
              </span>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-900 mb-1">
                    Section 301 Tariff Consideration
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Estimated based on current sea freight rates and Section 301 tariffs for HS Code{" "}
                    <span className="font-mono font-semibold">{analysis.estimatedHsCode}</span>.
                    Many FBA sellers face 25% China tariff - this estimate includes that risk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Assumptions */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              Key Assumptions
            </span>
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>
                <strong>Pack size:</strong> {quantity} units per pack
                {analysis?.attributes?.weight && (
                  <span className="text-slate-500"> (Total weight: {analysis.attributes.weight})</span>
                )}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>
                <strong>Shipping mode:</strong> Sea freight (standard)
                <span className="text-slate-500"> (Air freight would increase by ~40-60%)</span>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>
                <strong>Target market:</strong> US import
                <span className="text-slate-500"> (Duty rate: {(dutyRate * 100).toFixed(1)}%)</span>
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            These assumptions affect the cost range. Changing pack size, shipping mode, or target market will change the estimate.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

