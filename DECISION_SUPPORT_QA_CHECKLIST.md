# ReportDecisionSupport - QA Test Checklist

## Pre-Deployment Testing

### Build & Compilation
- [x] `npm run build` completes successfully
- [x] No TypeScript errors
- [x] All 46 routes generated correctly
- [x] Production bundle size acceptable
- [x] No console warnings during build

### API Response Tests

#### Test 1: Decision Support Present in Response
```bash
curl -s http://localhost:3000/api/reports/[REPORT_ID] | jq '.report._decisionSupport' | head -20
```
**Expected**: JSON object with hs, dutyRate, cost, quantityPlanner, profit, nexsupplyValue
**Status**: [ ] PASS [ ] FAIL

#### Test 2: HS Candidates Always Present
```bash
curl -s http://localhost:3000/api/reports/[REPORT_ID] | jq '.report._decisionSupport.hs.candidates | length'
```
**Expected**: >= 2 (at minimum fallback candidates)
**Status**: [ ] PASS [ ] FAIL

#### Test 3: Fallback Generation When Missing
```bash
# Load report with NO HS codes in analysis
curl -s http://localhost:3000/api/reports/[REPORT_ID_NO_HS] | jq '.report._decisionSupport.hs.candidates[0].source'
```
**Expected**: "FALLBACK"
**Status**: [ ] PASS [ ] FAIL

#### Test 4: Duty Rate Range Calculated
```bash
curl -s http://localhost:3000/api/reports/[REPORT_ID] | jq '.report._decisionSupport.dutyRate | {min: .rateMin, max: .rateMax}'
```
**Expected**: { "min": 5-8, "max": 15-25 }
**Status**: [ ] PASS [ ] FAIL

#### Test 5: Quantity Options Present
```bash
curl -s http://localhost:3000/api/reports/[REPORT_ID] | jq '.report._decisionSupport.quantityPlanner.options | length'
```
**Expected**: 3 (for 100, 300, 1000)
**Status**: [ ] PASS [ ] FAIL

#### Test 6: Profit Calculations
```bash
curl -s http://localhost:3000/api/reports/[REPORT_ID] | jq '.report._decisionSupport.profit.breakEvenPrice'
```
**Expected**: { "min": number, "mid": number, "max": number }
**Status**: [ ] PASS [ ] FAIL

#### Test 7: Target Margins Count
```bash
curl -s http://localhost:3000/api/reports/[REPORT_ID] | jq '.report._decisionSupport.profit.targetMarginPrices | length'
```
**Expected**: 3 (for 30%, 40%, 50%)
**Status**: [ ] PASS [ ] FAIL

#### Test 8: NexSupply Value Present
```bash
curl -s http://localhost:3000/api/reports/[REPORT_ID] | jq '.report._decisionSupport.nexsupplyValue | keys'
```
**Expected**: ["blockers", "whatWeDo", "expectedTimelineText", "ctaPrimaryText", "ctaSecondaryText"]
**Status**: [ ] PASS [ ] FAIL

### Frontend Component Tests

#### Test 9: HsDutyCard Renders
- [ ] Load report in browser
- [ ] Scroll to decision support section
- [ ] Verify HsDutyCard visible
- [ ] Check HS code candidates displayed (at least 2)
- [ ] Verify confidence % shown for each
- [ ] Check "Draft" or "Confirmed" status indicator
- [ ] Verify evidence snippets visible on hover

**Status**: [ ] PASS [ ] FAIL

#### Test 10: QuantityPlannerCard Renders
- [ ] Load report in browser
- [ ] Scroll to quantity planner section
- [ ] Verify 100, 300, 1000 qty options visible
- [ ] Check total landed cost shown for each (min/mid/max format)
- [ ] If shelf price provided: verify total profit shown
- [ ] Check color coding (profit shown in green/red)
- [ ] Verify footer text explains the ranges

**Status**: [ ] PASS [ ] FAIL

#### Test 11: ProfitScenariosCard Renders
- [ ] Load report in browser
- [ ] Scroll to profit section
- [ ] Verify break-even price visible (always)
- [ ] Check 30%, 40%, 50% margin options shown
- [ ] Verify required shelf price for each margin calculated
- [ ] If NO shelf price: check CTA message to add it
- [ ] If shelf price provided: verify profit per unit and margin % shown
- [ ] Check profit colored red if negative

**Status**: [ ] PASS [ ] FAIL

#### Test 12: NextStepsCard Enhanced
- [ ] Load report in browser
- [ ] Scroll to Next Steps section
- [ ] Verify supplier candidates list still present (or "No leads yet" message)
- [ ] Check NEW "Current blockers" section visible
- [ ] Verify blocker items listed (at least 1)
- [ ] Check NEW "What NexSupply does" section visible
- [ ] Verify action items listed (4 expected)
- [ ] Check "Expected timeline" text shown
- [ ] Verify action buttons still present (RFQ, Start verification, Search)

**Status**: [ ] PASS [ ] FAIL

#### Test 13: OverviewModern Layout
- [ ] Load report in browser
- [ ] Verify Row 1: Assumptions, Landed Cost, Profit Check (3-col)
- [ ] Verify Row 2: What We Know, Next Steps (2-col)
- [ ] Verify Row 3: HS Code & Duty (1-col, full width)
- [ ] Verify Row 4: Quantity Planner, Profit Scenarios (2-col)
- [ ] Check all cards load without errors
- [ ] Verify responsive layout on mobile (stacks to 1 col)
- [ ] Check no cards overlap or hide each other

**Status**: [ ] PASS [ ] FAIL

### Edge Case Tests

#### Test 14: Report with NO HS Codes
- [ ] Load report where analysis has no HS codes
- [ ] Navigate to decision support section
- [ ] Verify fallback HS candidates generated
- [ ] Check source marked as "FALLBACK"
- [ ] Verify confidence is low (20-50%)
- [ ] Check rationale mentions fallback

**Test Data**: Create product with no HS data in analysis
**Status**: [ ] PASS [ ] FAIL

#### Test 15: Report with NO Shelf Price
- [ ] Load report without shelf_price field set
- [ ] Check ProfitScenariosCard renders
- [ ] Verify break-even price shown
- [ ] Verify target margins shown
- [ ] Verify NO profit per unit calculation
- [ ] Verify NO margin % calculation
- [ ] Check CTA message to add shelf price

**Test Data**: Use any report without shelf price
**Status**: [ ] PASS [ ] FAIL

#### Test 16: Report with OCR Failure
- [ ] Load report where label OCR failed
- [ ] Scroll to decision support section
- [ ] Verify ALL cards still render (no blocking)
- [ ] Check HsDutyCard shows fallback candidates
- [ ] Verify cost calculations still present
- [ ] Verify quantity planner works
- [ ] Check profit scenarios visible

**Test Data**: Report with OCR failure indicated
**Status**: [ ] PASS [ ] FAIL

#### Test 17: Report with Zero Suppliers
- [ ] Load report with no supplier matches
- [ ] Scroll to NextStepsCard
- [ ] Verify "No leads yet" message shown
- [ ] Check action buttons still present
- [ ] Verify blockers include "No verified suppliers found"
- [ ] Check whatWeDo still populated

**Test Data**: New product with no supplier data
**Status**: [ ] PASS [ ] FAIL

#### Test 18: Very Small Numbers
- [ ] Load report with landed cost < $1
- [ ] Check calculations don't have rounding errors
- [ ] Verify profit calculations are accurate
- [ ] Check margin % calculations correct

**Test Data**: Extremely cheap product (e.g., 5 cent item)
**Status**: [ ] PASS [ ] FAIL

#### Test 19: Very Large Numbers
- [ ] Load report with landed cost > $1000
- [ ] Check calculations don't overflow
- [ ] Verify display formatting is readable
- [ ] Check profit calculations accurate

**Test Data**: Expensive product (e.g., machinery)
**Status**: [ ] PASS [ ] FAIL

### Numerical Accuracy Tests

#### Test 20: Cost Calculation Accuracy
Given:
- Factory price: $5.00 (standard), $6.00 (conservative)
- Shipping: $2.00, $3.00
- Duty: $1.00, $1.50
- Fees: $1.00, $1.50

Expected:
- Min: $5 + $2 + $1 + $1 = $9.00
- Max: $6 + $3 + $1.5 + $1.5 = $12.00
- Mid: ($9 + $12) / 2 = $10.50

```bash
curl -s http://localhost:3000/api/reports/[TEST_REPORT] | \
  jq '.report._decisionSupport.cost.landedPerUnit'
```

**Expected**: { "min": 9, "mid": 10.5, "max": 12 }
**Actual**: ___________
**Status**: [ ] PASS [ ] FAIL

#### Test 21: Quantity Calculation Accuracy
Given: landedPerUnit.mid = $10.50

For qty 100:
- Expected: $10.50 * 100 = $1050

For qty 300:
- Expected: $10.50 * 300 = $3150

For qty 1000:
- Expected: $10.50 * 1000 = $10500

```bash
curl -s http://localhost:3000/api/reports/[TEST_REPORT] | \
  jq '.report._decisionSupport.quantityPlanner.options[].totalLanded.mid'
```

**Expected**: [1050, 3150, 10500]
**Actual**: ___________
**Status**: [ ] PASS [ ] FAIL

#### Test 22: Profit Calculation Accuracy
Given: 
- Shelf price: $20.00
- Landed cost: $10.50 (mid)

Expected profit:
- Per unit: $20 - $10.50 = $9.50

For qty 100:
- Total: $9.50 * 100 = $950

```bash
curl -s http://localhost:3000/api/reports/[TEST_REPORT_WITH_PRICE] | \
  jq '.report._decisionSupport | {profitPerUnit: .profit.profitPerUnit.mid, totalProfit100: .quantityPlanner.options[0].totalProfit.mid}'
```

**Expected**: { "profitPerUnit": 9.5, "totalProfit100": 950 }
**Actual**: ___________
**Status**: [ ] PASS [ ] FAIL

#### Test 23: Margin Calculation Accuracy
Given:
- Shelf price: $20.00
- For 40% margin: required = $10.50 / (1 - 0.40) = $17.50

```bash
curl -s http://localhost:3000/api/reports/[TEST_REPORT_WITH_PRICE] | \
  jq '.report._decisionSupport.profit.targetMarginPrices[] | select(.marginPercent == 40) | .requiredShelfPrice.mid'
```

**Expected**: 17.5
**Actual**: ___________
**Status**: [ ] PASS [ ] FAIL

### Performance Tests

#### Test 24: API Response Time
```bash
time curl -s http://localhost:3000/api/reports/[REPORT_ID] > /dev/null
```

**Expected**: < 200ms
**Actual**: ___________ms
**Status**: [ ] PASS [ ] FAIL

#### Test 25: Card Rendering Time
- Open DevTools Performance tab
- Load report page
- Measure "Decision Support Cards" component render time

**Expected**: < 200ms
**Actual**: ___________ms
**Status**: [ ] PASS [ ] FAIL

### Browser Compatibility

#### Test 26: Chrome/Chromium
- [ ] Load report
- [ ] Verify all cards render
- [ ] Check hover states work
- [ ] Test responsive layout
**Status**: [ ] PASS [ ] FAIL

#### Test 27: Firefox
- [ ] Load report
- [ ] Verify all cards render
- [ ] Check hover states work
- [ ] Test responsive layout
**Status**: [ ] PASS [ ] FAIL

#### Test 28: Safari
- [ ] Load report
- [ ] Verify all cards render
- [ ] Check hover states work
- [ ] Test responsive layout
**Status**: [ ] PASS [ ] FAIL

#### Test 29: Mobile (iPhone/Android)
- [ ] Load report on mobile device
- [ ] Verify cards stack vertically
- [ ] Check text is readable
- [ ] Verify touch interactions work
**Status**: [ ] PASS [ ] FAIL

### Data Persistence Tests

#### Test 30: Old Reports Compatibility
- [ ] Load report created BEFORE decision support was added
- [ ] Verify _decisionSupport is computed on-the-fly
- [ ] Check all cards render correctly
- [ ] Verify fallback values used appropriately

**Test Data**: Any old report
**Status**: [ ] PASS [ ] FAIL

#### Test 31: Backward Compatibility
- [ ] Verify old API clients still work (without _decisionSupport)
- [ ] Check existing fields unchanged
- [ ] Verify no breaking changes to response structure

**Test**: Old code that doesn't know about _decisionSupport
**Status**: [ ] PASS [ ] FAIL

---

## Summary

**Total Tests**: 31
**Passed**: _____ / 31
**Failed**: _____ / 31
**Blocked**: _____ / 31

**Overall Status**: [ ] READY FOR PRODUCTION [ ] NEEDS FIXES [ ] BLOCKED

**Issues Found**:
```
1. 
2. 
3. 
```

**Sign-off**:
- QA Lead: _________________ Date: _________
- Dev Lead: ________________ Date: _________
- Product: _________________ Date: _________

---

## Notes
_Use this section for additional observations, quirks, or improvements noted during testing_
