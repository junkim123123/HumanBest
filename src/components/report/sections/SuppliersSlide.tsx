// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Report } from "@/lib/report/types";
import { FactoriesSection } from "./FactoriesSection";
import { LeadCard } from "./LeadCard";

interface SuppliersSlideProps {
  report: Report;
}

export function SuppliersSlide({ report }: SuppliersSlideProps) {
  const reportAny = report as any;
  const supplierMatches = reportAny._supplierMatches || [];
  const recommendedCount = reportAny._supplierRecommendedCount || 0;
  const candidateCount = reportAny._supplierCandidateCount || 0;
  const totalCount = supplierMatches.length;
  const factories = reportAny.categoryFactories || [];

  const [showMoreRecommended, setShowMoreRecommended] = useState(false);
  const [showMoreCandidates, setShowMoreCandidates] = useState(false);
  const [expandedSupplierIds, setExpandedSupplierIds] = useState<Set<string>>(new Set());
  const [supplierStatuses, setSupplierStatuses] = useState<Record<string, any>>({});

  // Fetch supplier statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch(`/api/reports/${report.id}/supplier-statuses`);
        if (response.ok) {
          const data = await response.json();
          setSupplierStatuses(data.statuses || {});
        }
      } catch (error) {
        console.error("Failed to fetch supplier statuses:", error);
      }
    };

    fetchStatuses();
  }, [report.id]);

  // Sort suppliers: Factory first, Trading next, Logistics at bottom
  const sortSuppliers = (suppliers: Array<any>) => {
    return [...suppliers].sort((a, b) => {
      const getRolePriority = (supplier: any): number => {
        // Use profile role first (from entity resolution)
        const profileRole = supplier.role || supplier._profile?.role;
        if (profileRole === "factory") return 1;
        if (profileRole === "trading") return 2;
        if (profileRole === "logistics") return 3;
        
        // Fallback to enrichment or flags
        const flags = supplier.flags || {};
        const enrichment = supplier._enrichment || {};
        const supplierType = supplier.supplier_type || supplier.type;
        
        if (supplierType === "factory" || enrichment.role_factory_pct > 50 || flags.type_factory) {
          return 1;
        }
        if (supplierType === "trading" || enrichment.role_trading_pct > 50 || flags.type_trading) {
          return 2;
        }
        if (supplierType === "logistics" || enrichment.role_logistics_pct > 50 || flags.type_logistics) {
          return 3;
        }
        return 2; // Unknown defaults to middle
      };
      
      const aPriority = getRolePriority(a);
      const bPriority = getRolePriority(b);
      
      // Sort by priority (lower number = higher priority)
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same priority, sort by shipment count (more shipments = higher), then by match score
      const aShipments = a.shipment_count_12m || a._profile?.shipment_count_12m || 0;
      const bShipments = b.shipment_count_12m || b._profile?.shipment_count_12m || 0;
      if (aShipments !== bShipments) {
        return bShipments - aShipments;
      }
      
      const aScore = a.match_score || a.rerank_score || 0;
      const bScore = b.match_score || b.rerank_score || 0;
      return bScore - aScore;
    });
  };

  const recommendedSuppliers = sortSuppliers(supplierMatches.filter((m: any) => m.tier === "recommended"));
  const candidateSuppliers = sortSuppliers(supplierMatches.filter((m: any) => m.tier === "candidate"));

  const toggleExpand = (supplierId: string) => {
    const newSet = new Set(expandedSupplierIds);
    if (newSet.has(supplierId)) {
      newSet.delete(supplierId);
    } else {
      newSet.add(supplierId);
    }
    setExpandedSupplierIds(newSet);
  };

  const copyOutreachMessage = async (supplier: any) => {
    const productName = report.productName;
    const category = report.category;
    const intel = supplier._intel;

    const messageText = `Hello, we are reviewing this product and would like your confirmed price per unit, MOQ, lead time, and packaging specs.

Product: ${productName}
Category: ${category}
${intel?.moq_median ? `\nNote: Typical MOQ in market: ${intel.moq_median} units` : ""}

Please provide:
- Unit price (FOB)
- Minimum order quantity (MOQ)
- Lead time
- Packaging specifications

Best regards`;

    try {
      await navigator.clipboard.writeText(messageText);
      // Could add toast notification here
    } catch (err) {
      console.error("Failed to copy outreach message:", err);
    }
  };

  const downloadQuestionsChecklist = () => {
    const checklist = `Questions to Ask Suppliers
=====================

Product Details
- Unit price (FOB)
- Minimum order quantity (MOQ)
- Lead time
- Product specifications
- Packaging options
- Material composition

Quality & Compliance
- Quality certifications
- Compliance requirements
- Testing procedures
- Sample availability

Logistics
- Shipping terms (FOB, CIF, etc.)
- Shipping methods available
- Estimated shipping cost
- Delivery timeline

Payment & Terms
- Payment terms
- Currency
- Production milestones

Additional
- Customization options
- Bulk pricing tiers
- Return/exchange policy
- After-sales support`;

    const blob = new Blob([checklist], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier-questions-checklist.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSupplierList = (suppliers: Array<any>, showMore: boolean, onShowMore: () => void) => {
    const visibleSuppliers = showMore ? suppliers : suppliers.slice(0, 8);
    const hasMore = suppliers.length > 8;

    if (suppliers.length === 0) {
      return (
        <div className="text-sm text-slate-500 py-4">
          No sourcing leads found. Upload packaging photo or add barcode to improve matching.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {visibleSuppliers.map((supplier: any) => {
          const isExpanded = expandedSupplierIds.has(supplier.id);
          const statusInfo = supplierStatuses[supplier.supplier_id] || {};
          return (
            <LeadCard
              key={supplier.id}
              supplier={supplier}
              report={report}
              onCopyMessage={copyOutreachMessage}
              onDownloadChecklist={downloadQuestionsChecklist}
              isExpanded={isExpanded}
              onToggleExpand={() => toggleExpand(supplier.id)}
              status={statusInfo.status || null}
              confirmedInWriting={statusInfo.confirmed_in_writing || false}
            />
          );
        })}
        {hasMore && !showMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={onShowMore}
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 text-xs h-8"
          >
            Show {suppliers.length - 8} more
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {/* Stats row - removed duplicate helper text (already in Sheet header) */}
      <div className="shrink-0 mb-6">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>
              <span className="font-medium text-slate-900">{totalCount}</span> total
            </span>
            <span>
              <span className="font-medium text-green-700">{recommendedCount}</span> recommended
            </span>
            <span>
              <span className="font-medium text-slate-700">{candidateCount}</span> candidates
            </span>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="space-y-6">
        {/* Section A: Factories we know for this category */}
        <FactoriesSection factories={factories} category={report.category} report={report} />

        {/* Section B: Sourcing leads from records */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Sourcing leads from records
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Not verified quotes. Leads inferred from customs records, keyword matches, or category inference. We only have the company name from records for now. Quotes confirm manufacturer status, price, MOQ, and lead time.
            </p>
          </div>

          {/* Recommended Suppliers */}
          <Card className="border border-slate-200 rounded-xl p-5 mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Recommended
                {recommendedCount > 0 && (
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({recommendedCount})
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Strong evidence match from keywords, category alignment, or similar records. Not verified quotes.
              </p>
            </div>
            {recommendedCount > 0 ? (
              renderSupplierList(recommendedSuppliers, showMoreRecommended, () => setShowMoreRecommended(true))
            ) : (
              <div className="text-sm text-slate-500 py-4">
                <div className="font-medium text-slate-700 mb-1">No recommended suppliers</div>
                <div className="text-xs text-slate-500">
                  Upload packaging photo or add barcode to improve matching. See candidates below.
                </div>
              </div>
            )}
          </Card>

          {/* Candidate Suppliers */}
          <Card className="border border-slate-200 rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Candidates
                {candidateCount > 0 && (
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({candidateCount})
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Exploration leads from partial matches or category inference. Not verified quotes.
              </p>
            </div>
            {candidateCount > 0 ? (
              renderSupplierList(candidateSuppliers, showMoreCandidates, () => setShowMoreCandidates(true))
            ) : totalCount === 0 ? (
              <div className="text-sm text-slate-500 py-4">
                <div className="font-medium text-slate-700 mb-1">No supplier matches found</div>
                <div className="text-xs text-slate-500">
                  Upload packaging photo, add barcode, or provide materials and size to improve matching.
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}

