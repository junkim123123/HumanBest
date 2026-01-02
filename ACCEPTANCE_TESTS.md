# Trust-Safe Gemini Acceptance Tests

## Critical Fixes ✅

### 1. Model Version Update
- [x] Replaced `gemini-1.5-flash` with `gemini-2.0-flash-exp` in all files
- [x] src/lib/gemini-helper.ts updated
- [x] src/utils/intelligence/image-analysis.ts updated
- [x] src/lib/label-extraction.ts updated

### 2. Null Safety
- [x] Added `extractBase64()` helper function
- [x] All `.split(",")[1]` calls replaced with safe helper
- [x] `inferUnitsPerCaseFromBox()` accepts null boxImageUrl
- [x] Returns default candidates when no image provided

### 3. Build Status
- [x] Project compiles successfully (0 errors)
- [x] Build time: ~6.8 seconds
- [x] All routes working

## API Acceptance Tests

### POST /api/analyze

**Test 1: No Label Image (Fallback to Defaults)**
```bash
# Upload product with no label photo
# Expected: Uses category defaults (25g, 12/24 case pack)
# Verify: weight_draft.source === "DEFAULT"
```

**Test 2: Label Image with OCR Failure**
```bash
# Upload product with blurry/unreadable label
# Expected: Gemini Vision extracts labelDraft
# Verify: label_extraction_source === "VISION"
# Verify: labelDraft has originCountry, netWeight, allergens, brand, productName
```

**Test 3: No Box Image (Default Case Pack)**
```bash
# Upload product without box photo
# Expected: Returns default case pack candidates [12, 24]
# Verify: case_pack_draft.candidates.length === 2
# Verify: case_pack_draft.source === "DEFAULT"
```

**Test 4: Box Image with Text**
```bash
# Upload product with clear box photo showing "12 units"
# Expected: Extracts case pack from image
# Verify: case_pack_draft.candidates[0].value === 12
# Verify: case_pack_draft.source === "VISION"
```

**Test 5: Null Data URL Handling**
```bash
# Simulate null or malformed data URL
# Expected: Catches error, returns Draft with null value
# Verify: No crash, error logged
```

### GET /api/reports/{reportId}

**Test 6: Draft Section Present**
```bash
curl http://localhost:3000/api/reports/{reportId} | jq '._draft'

# Expected output:
{
  "labelDraft": {...},
  "barcodeDraft": {...},
  "assumptionsDraft": {...},
  "customsCategoryDraft": {...},
  "hsDraft": [...],
  "complianceDraft": {...},
  "labelConfirmed": false,
  "complianceConfirmed": false,
  "complianceStatus": "Incomplete"
}
```

**Test 7: Compliance Status Logic**
```bash
# Test Case A: labelConfirmed = false
# Expected: complianceStatus === "Incomplete"

# Test Case B: labelConfirmed = true, complianceConfirmed = false
# Expected: complianceStatus === "Preliminary"

# Test Case C: labelConfirmed = true, complianceConfirmed = true
# Expected: complianceStatus === "Complete"
```

## UI Acceptance Tests

### NextStepsCard

**Test 8: 0 Recommended, 1+ Candidates**
```
Navigate to report with only candidate tier suppliers
Expected: Shows "Supplier candidates" section
Expected: Shows up to 3 supplier cards
Expected: Shows RFQ and verification actions
```

**Test 9: Only Logistics Matches**
```
Navigate to report with only logistics type suppliers
Expected: Shows "Other entities" section
Expected: Message: "Only logistics entities found..."
Expected: No headline supplier leads
Expected: Shows RFQ and verification actions
```

**Test 10: 0 Matches**
```
Navigate to report with 0 supplier matches
Expected: Shows "No leads yet"
Expected: Message: "Start verification to find matching factories"
Expected: Shows RFQ and verification actions
```

### AssumptionsCard

**Test 11: Draft Badges Visible**
```
Navigate to any report
Expected: AssumptionsCard shows:
  - Unit weight with Draft badge
  - Units per case with Draft badge
  - Confidence pills (e.g., "0.4")
  - Evidence tooltips on hover
```

**Test 12: Edit Assumptions Button**
```
Click "Edit assumptions" button
Expected: Opens EditAssumptionsModal
Expected: Form with unit weight and units per case fields
```

### OverviewModern

**Test 13: No Blocking Cards**
```
Navigate to any report
Expected: No yellow "Not ready needs details" card
Expected: No "Improve accuracy" blocking gate
Expected: AssumptionsCard renders in grid row 1
```

## Error Handling Tests

**Test 14: Gemini API Key Missing**
```bash
# Unset both API keys
unset GEMINI_API_KEY
unset GOOGLE_API_KEY
npm run dev

# Upload product
# Expected: Falls back to category defaults
# Expected: Logs error: "No API key configured"
# Expected: No crash
```

**Test 15: Gemini Vision Returns Invalid JSON**
```bash
# Mock Gemini to return non-JSON response
# Expected: Catches JSON.parse error
# Expected: Returns Draft with null values
# Expected: Logs error
```

**Test 16: Data URL Missing Comma**
```bash
# Pass data URL without comma separator (e.g., "data:image/jpegBASE64STRING")
# Expected: extractBase64() throws clear error
# Expected: Caught by try/catch
# Expected: Returns Draft with null value
```

**Test 17: Null Box Image**
```bash
# Call inferUnitsPerCaseFromBox(null, ...)
# Expected: Returns immediately with default candidates
# Expected: No Gemini API call made
# Expected: source === "DEFAULT"
```

## Supplier Matching Tests

**Test 18: Logistics Never Headline**
```
Create report matching only logistics suppliers
Expected: Logistics not in "Supplier candidates" section
Expected: Logistics in "Other entities" section
Expected: Muted styling
```

**Test 19: Trading Shows Draft Badge**
```
Create report matching Trading type supplier
Expected: Shows in "Supplier candidates"
Expected: Type badge: "Trading"
Expected: Draft badge visible
```

**Test 20: Evidence Line Required**
```
Check any supplier match card
Expected: Shows evidenceSnippet below supplier name
Expected: Text explains why it matched (max 72 chars)
```

## HS Display Tests

**Test 21: HS Shows When OCR Fails**
```
Upload product where OCR fails
Expected: customsCategoryDraft still shows in overview
Expected: Shows as plain language (e.g., "Food & Beverages")
Expected: Draft badge visible
```

**Test 22: HS Candidates Available**
```
Check report JSON: _draft.hsDraft
Expected: Array of HS code candidates
Expected: Each has: code, confidence, rationale, evidenceSnippet
Expected: Sorted by confidence (highest first)
```

## Compliance Tests

**Test 23: Initial Status = Incomplete**
```
Analyze new product
Check report: _draft.complianceStatus
Expected: "Incomplete"
```

**Test 24: Compliance Card Shows Preliminary**
```
Upload product with clear label
When labelConfirmed = true but complianceConfirmed = false
Expected: Shows "Preliminary. Confirm label details for compliance completeness."
```

## Performance Tests

**Test 25: Build Time**
```bash
npm run build
Expected: Completes in < 10 seconds
Expected: 0 TypeScript errors
Expected: 0 build warnings
```

**Test 26: API Response Time**
```bash
time curl http://localhost:3000/api/reports/{reportId}
Expected: < 2 seconds for cached report
Expected: < 10 seconds for fresh analysis
```

## Regression Tests

**Test 27: Existing Reports Still Load**
```
Open report created before this implementation
Expected: Loads without errors
Expected: Draft fields may be null (show "Not specified")
Expected: Compliance status defaults to "Incomplete"
```

**Test 28: Manual Input Still Works**
```
Use EditAssumptionsModal to manually enter weight/case pack
Expected: Updates database with source=MANUAL
Expected: Confidence set to 1.0
Expected: Draft badge removed
```

## Checklist Summary

- [ ] Model version updated (gemini-2.0-flash-exp)
- [ ] Null safety implemented (extractBase64)
- [ ] Case pack handles null (no crash)
- [ ] Compliance status computed correctly
- [ ] Suppliers always render (never empty)
- [ ] Draft badges visible in UI
- [ ] Evidence tooltips work
- [ ] No blocking cards
- [ ] HS shows when OCR fails
- [ ] Logistics never headline
- [ ] Build compiles (0 errors)

## Known Limitations

1. **Confirm Label Modal**: Not implemented yet. Users cannot confirm critical fields via UI.
2. **Supplier Type Badges**: Basic filtering done, but type badges not visible on cards yet.
3. **Compliance Card**: No dedicated compliance status card in UI yet.

## Next Sprint Items

1. Create ConfirmLabelModal component
2. Add supplier type badges to NextStepsCard
3. Create ComplianceCard showing status
4. Add database migration script for new columns
5. Monitor Gemini API usage and costs in production
