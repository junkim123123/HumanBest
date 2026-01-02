# ReportDecisionSupport - Quick Reference

## 🚀 What Was Added

Complete decision support framework with 6 new features:

| Feature | Component | Location |
|---------|-----------|----------|
| HS Code & Duty Info | HsDutyCard | `cards/HsDutyCard.tsx` |
| Quantity Planning | QuantityPlannerCard | `cards/QuantityPlannerCard.tsx` |
| Profit Scenarios | ProfitScenariosCard | `cards/ProfitScenariosCard.tsx` |
| Backend Calculations | DecisionSupportBuilder | `lib/server/decision-support-builder.ts` |
| API Integration | GET /api/reports/[reportId] | Adds `_decisionSupport` to response |
| NextSteps Enhancement | NextStepsCard | Shows blockers, actions, timeline |

---

## 📊 What Users See

### HsDutyCard
```
┌────────────────────────┐
│ HS Code & Duty         │
├────────────────────────┤
│ HS Code Candidates:    │
│ • 1704 (40%) Sugar...  │
│ • 2106 (30%) Prepared..│
│ • 9999 (20%) Unknown.. │
├────────────────────────┤
│ Estimated Duty Rate:   │
│ 8% to 25%              │
└────────────────────────┘
```

### QuantityPlannerCard
```
┌──────────────────────────┐
│ 📦 Quantity Planner      │
├──────────────────────────┤
│ 100 units:               │
│  Total: $500→$550→$600   │
│  Profit: $200→$250→$300  │
├──────────────────────────┤
│ 300 units:               │
│  Total: $1500→$1650→1800 │
│  Profit: $600→$750→$900  │
└──────────────────────────┘
```

### ProfitScenariosCard
```
┌──────────────────────────┐
│ 📈 Profit Scenarios      │
├──────────────────────────┤
│ Break-Even Price:        │
│ $10.50 → $11.20 → $12.00 │
├──────────────────────────┤
│ 30% Margin: $15.00→$16→17│
│ 40% Margin: $17.50→$18→20│
│ 50% Margin: $21.00→$22→24│
└──────────────────────────┘
```

---

## 💻 Backend API

### What You Get
```javascript
{
  "success": true,
  "reportId": "uuid-xxx",
  "report": {
    ...allExistingFields,
    "_decisionSupport": {
      "hs": {
        "candidates": [
          {
            "code": "1704",
            "confidence": 40,
            "rationale": "Sugar confectionery...",
            "evidenceSnippet": "Category-based fallback",
            "source": "FALLBACK"
          }
        ],
        "status": "DRAFT",
        "customsCategoryText": "Candy/Confectionery"
      },
      "dutyRate": {
        "rateMin": 5,
        "rateMax": 25,
        "rationale": "Estimated based on HS code",
        "status": "DRAFT"
      },
      "cost": {
        "landedPerUnit": {
          "min": 10.50,
          "mid": 11.20,
          "max": 12.00
        },
        "componentsPerUnit": {
          "factoryUnitPrice": {...},
          "shipping": {...},
          "duty": {...},
          "fees": {...}
        },
        "confidenceTier": "medium",
        "evidenceSummary": "Based on 5 similar import records",
        "currency": "USD"
      },
      "quantityPlanner": {
        "options": [
          {
            "quantity": 100,
            "totalLanded": {
              "min": 1050,
              "mid": 1120,
              "max": 1200
            },
            "totalProfit": null  // null if no shelf price
          },
          { "quantity": 300, ... },
          { "quantity": 1000, ... }
        ]
      },
      "profit": {
        "shelfPrice": null,  // or number
        "breakEvenPrice": {
          "min": 10.50,
          "mid": 11.20,
          "max": 12.00
        },
        "targetMarginPrices": [
          {
            "marginPercent": 30,
            "requiredShelfPrice": {
              "min": 15.00,
              "mid": 16.00,
              "max": 17.14
            }
          },
          { "marginPercent": 40, ... },
          { "marginPercent": 50, ... }
        ],
        "profitPerUnit": undefined,  // only if shelf price provided
        "marginPercent": undefined   // only if shelf price provided
      },
      "nexsupplyValue": {
        "blockers": [
          "Shelf price not provided",
          "HS code not confirmed"
        ],
        "whatWeDo": [
          "Find verified suppliers with quotes",
          "Verify HS code and estimate duty",
          "Calculate landed cost and profit",
          "Monitor import trends"
        ],
        "expectedTimelineText": "3-5 business days",
        "ctaPrimaryText": "Start verification with NexSupply",
        "ctaSecondaryText": "View more suppliers"
      }
    }
  }
}
```

---

## 🎨 Using in Components

### Example: Display HS Candidates
```tsx
import HsDutyCard from "@/components/report-v2/cards/HsDutyCard";

const report = await fetch(`/api/reports/${id}`).then(r => r.json());

return (
  <HsDutyCard decisionSupport={report._decisionSupport} />
);
```

### Example: Show Profit Scenarios
```tsx
import ProfitScenariosCard from "@/components/report-v2/cards/ProfitScenariosCard";

const { cost, profit } = report._decisionSupport;

return (
  <ProfitScenariosCard decisionSupport={report._decisionSupport} />
);
```

### Example: Access Raw Data
```tsx
const { hs, cost, quantityPlanner, profit } = report._decisionSupport;

// HS codes
hs.candidates.forEach(candidate => {
  console.log(`${candidate.code}: ${candidate.confidence}%`);
});

// Total cost at scale
quantityPlanner.options.forEach(opt => {
  console.log(`Qty ${opt.quantity}: $${opt.totalLanded.mid}`);
});

// Profit at margin
profit.targetMarginPrices.forEach(margin => {
  console.log(`${margin.marginPercent}% margin: $${margin.requiredShelfPrice.mid}`);
});
```

---

## 🔧 Customization

### Change Fallback HS Codes
**File**: `src/lib/server/decision-support-builder.ts`
```typescript
function generateFallbackHsCandidates(category: string) {
  const categoryMap: Record<string, HsCandidate[]> = {
    candy: [
      // Edit these
      { code: "1704", confidence: 0.4, ... },
      { code: "2106", confidence: 0.3, ... },
    ],
    // Add more categories
  };
}
```

### Change Duty Rate Estimates
**File**: `src/lib/server/decision-support-builder.ts`
```typescript
// Line ~260
const dutyMin = standard.dutyPerUnit > 0 ? 8 : 5;  // ← Change these
const dutyMax = conservative.dutyPerUnit > 0 ? 25 : 15;
```

### Change Quantity Options
**File**: `src/lib/server/decision-support-builder.ts`
```typescript
// Line ~310
const quantities = [100, 300, 1000];  // ← Edit to [50, 250, 500] etc
```

### Change Target Margins
**File**: `src/lib/server/decision-support-builder.ts`
```typescript
// Line ~345
const margins = [30, 40, 50];  // ← Edit to [25, 35, 45] etc
```

---

## ❓ FAQ

**Q: What if there's no HS code?**
A: Fallback candidates generated based on category with 20-50% confidence

**Q: What if there's no shelf price?**
A: Break-even and target margins still show; profit not calculated

**Q: What if OCR failed?**
A: All decision support data still visible; HS candidates use fallbacks

**Q: Are these numbers final?**
A: No - all marked as "Draft"; users can confirm or edit

**Q: Does this block anything?**
A: No - all data is optional for viewing; no gates

---

## 📈 Metrics to Track

After launch, monitor:
- % of reports with _decisionSupport populated
- Time spent on each card
- Click-through rate on NexSupply CTA
- Users who update shelf price based on profit scenarios
- HS candidate confirmation rate

---

## 🐛 Common Issues

**Issue**: "Cannot find module DecisionSupport"
**Fix**: Check import path: `@/lib/server/decision-support-builder`

**Issue**: NaN in cost calculations
**Fix**: Ensure baseline.costRange has numeric values; check for null

**Issue**: Fallback candidates not showing
**Fix**: Check if category is recognized in categoryMap

**Issue**: _decisionSupport undefined
**Fix**: Ensure API was deployed; check server logs

---

## 📚 Full Documentation
See: [DECISION_SUPPORT_IMPLEMENTATION.md](DECISION_SUPPORT_IMPLEMENTATION.md)
