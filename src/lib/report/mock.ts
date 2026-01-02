// @ts-nocheck
// ============================================================================
// Mock Report Data - Golden Fixtures for Contract Testing
// ============================================================================

import type { Report } from "./types";
import { REPORT_SCHEMA_VERSION } from "./types";

export function getMockReport(reportId: string): Report | null {
  // Return different mock data based on reportId
  const mockReports: Record<string, Report> = {
    "line-friends-jelly": {
      schemaVersion: REPORT_SCHEMA_VERSION,
      id: "line-friends-jelly",
      productName: "LINE FRIENDS Jelly Candy with Mini Figure",
      summary: "Hybrid product combining candy and figure. HS code classification may vary between 1704 (candy) and 9503 (toys)",
      category: "hybrid",
      confidence: "medium",
      categoryConfidence: 0.75,
      signals: {
        hasImportEvidence: true,
        hasInternalSimilarRecords: false,
        hasSupplierCandidates: true,
        verificationStatus: "none",
      },
      
      baseline: {
        costRange: {
        conservative: {
          unitPrice: 0.85,
          shippingPerUnit: 1.50,
          dutyPerUnit: 0.21,
          feePerUnit: 0.10,
          totalLandedCost: 2.66,
        },
        standard: {
          unitPrice: 0.75,
          shippingPerUnit: 1.20,
          dutyPerUnit: 0.19,
          feePerUnit: 0.08,
          totalLandedCost: 2.22,
        },
      },
      
      riskScores: {
        tariff: 65,
        compliance: 45,
        supply: 30,
        total: 47,
      },
      
      riskFlags: {
        tariff: {
          hsCodeRange: ["1704.90", "9503.00"],
          adCvdPossible: false,
          originSensitive: true,
        },
        compliance: {
          requiredCertifications: ["FDA Food Registration", "CPSIA (if toy > 50%)"],
          labelingRisks: ["Allergen labeling required", "Age grade if toy component"],
          recallHints: ["Small parts warning if figure detachable"],
        },
        supply: {
          moqRange: { min: 500, max: 5000, typical: 2000 },
          leadTimeRange: { min: 45, max: 90, typical: 60 },
          qcChecks: ["Figure quality consistency", "Candy freshness", "Packaging integrity"],
        },
      },
      
      evidence: {
        types: ["similar_records", "category_based"],
        assumptions: {
          packaging: "Blister pack, 12 units per inner, 12 inner per carton",
          weight: "0.15kg per unit, 21.6kg per carton",
          volume: "0.0015 m³ per carton",
          incoterms: "FOB Shanghai",
          shippingMode: "Air Express (DHL/FedEx)",
        },
        items: [],
        lastAttemptAt: null,
        lastSuccessAt: null,
        lastResult: null,
        lastErrorCode: null,
      },
      },
      
      verification: {
        status: "not_requested",
      },
      
      nextActions: [
        {
          title: "Confirm HS Code",
          description: "Verify candy ratio from label photo to confirm HS code",
          estimatedTime: "24 hours",
        },
        {
          title: "Collect Actual Shipping Quotes",
          description: "Request accurate shipping quotes from 3 logistics providers",
          estimatedTime: "24 hours",
        },
        {
          title: "Propose 3 Factory Candidates",
          description: "Request samples from top 3 matched factories",
          estimatedTime: "48 hours",
        },
      ],
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    
    "toy-example": {
      schemaVersion: REPORT_SCHEMA_VERSION,
      id: "toy-example",
      productName: "Plush Toy with Sound Module",
      summary: "Plush toy with electronic module. Battery regulations and CPSIA certification required",
      category: "toy",
      confidence: "high",
      categoryConfidence: 0.9,
      upc: "123456789012",
      materialsAndDimensions: "Polyester fabric, 8x6x4 inches",
      packagingAndPrinting: "Polybag with header card, custom printing available",
      hasBackLabelPhoto: false,
      certificationsNeeded: ["CPSIA", "Battery UN38.3", "FCC"],
      signals: {
        hasImportEvidence: false,
        hasInternalSimilarRecords: false,
        hasSupplierCandidates: true,
        verificationStatus: "quoted",
      },
      
      baseline: {
        costRange: {
          conservative: {
            unitPrice: 3.50,
            shippingPerUnit: 2.00,
            dutyPerUnit: 0.88,
            feePerUnit: 0.15,
            totalLandedCost: 6.53,
          },
          standard: {
            unitPrice: 3.20,
            shippingPerUnit: 1.80,
            dutyPerUnit: 0.80,
            feePerUnit: 0.12,
            totalLandedCost: 5.92,
          },
        },
        
        riskScores: {
          tariff: 25,
          compliance: 70,
          supply: 35,
          total: 43,
        },
        
        riskFlags: {
          tariff: {
            hsCodeRange: ["9503.00"],
            adCvdPossible: false,
            originSensitive: false,
          },
          compliance: {
            requiredCertifications: ["CPSIA", "Battery UN38.3", "FCC (if wireless)"],
            labelingRisks: ["Age grade mandatory", "Battery warning", "Small parts warning"],
            recallHints: ["Battery overheating risk", "Sound module malfunction"],
          },
          supply: {
            moqRange: { min: 1000, max: 10000, typical: 3000 },
            leadTimeRange: { min: 60, max: 120, typical: 90 },
            qcChecks: ["Sound module functionality", "Battery safety", "Stitching quality"],
          },
        },
        
        evidence: {
          types: ["similar_records", "regulation_check"],
          assumptions: {
            packaging: "Polybag, 1 unit per inner, 24 inner per carton",
            weight: "0.3kg per unit, 7.2kg per carton",
            volume: "0.003 m³ per carton",
            incoterms: "FOB Shenzhen",
            shippingMode: "Air Express",
          },
          items: [],
          lastAttemptAt: null,
          lastSuccessAt: null,
          lastResult: null,
          lastErrorCode: null,
        },
      },
      
      verification: {
        status: "quoted",
        requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date().toISOString(),
      },
      
      verifiedQuotes: {
        suppliers: [
          {
            id: "quote-001",
            supplierName: "Shenzhen Plush Manufacturing Co.",
            country: "China",
            supplierType: "manufacturer",
            quoteMin: 1.90,
            quoteMax: 2.30,
            currency: "USD",
            incoterms: "FOB",
            moq: 1500,
            leadTimeDays: 45,
            sampleAvailable: true,
            certifications: ["CPSIA", "Battery UN38.3"],
            riskFlags: ["Battery shipping restrictions"],
            notes: "Factory has 15 years experience with plush toys",
            supplierWhatsApp: "8613812345678",
            supplierEmail: "david.chen@shenzhenplush.com",
            supplierContactName: "David Chen",
          },
          {
            id: "quote-002",
            supplierName: "Guangzhou Toy Trading Ltd.",
            country: "China",
            supplierType: "trading",
            quoteMin: 2.10,
            quoteMax: 2.50,
            currency: "USD",
            incoterms: "FOB",
            moq: 2000,
            leadTimeDays: 50,
            sampleAvailable: true,
            certifications: ["CPSIA", "FCC"],
            riskFlags: ["Longer lead time", "Higher MOQ"],
            notes: "Trading company with multiple factory sources",
            supplierWhatsApp: "8613923456789",
            supplierEmail: "lisa.wang@guangzhoutoy.com",
            supplierContactName: "Lisa Wang",
          },
          {
            id: "quote-003",
            supplierName: "Dongguan Electronics & Toys Factory",
            country: "China",
            supplierType: "manufacturer",
            quoteMin: 1.95,
            quoteMax: 2.25,
            currency: "USD",
            incoterms: "FOB",
            moq: 1000,
            leadTimeDays: 40,
            sampleAvailable: true,
            certifications: ["CPSIA", "Battery UN38.3", "FCC"],
            riskFlags: [],
            notes: "Specializes in electronic toys with sound modules",
            supplierWhatsApp: null, // No WhatsApp for testing fallback
            supplierEmail: null, // No email for testing fallback
            supplierContactName: null,
          },
        ],
        updatedAt: new Date().toISOString(),
      },
      
      nextActions: [
        {
          title: "Verify CPSIA Certification",
          description: "Check factory's CPSIA certificate and review test reports",
          estimatedTime: "48 hours",
        },
        {
          title: "Check Battery Regulations",
          description: "Verify shipping regulations based on battery type and capacity",
          estimatedTime: "24 hours",
        },
        {
          title: "Propose Factory Candidates",
          description: "Request samples from 3 factories with CPSIA certification",
          estimatedTime: "about 1 week",
        },
      ],
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  
  return mockReports[reportId] || mockReports["line-friends-jelly"];
}

