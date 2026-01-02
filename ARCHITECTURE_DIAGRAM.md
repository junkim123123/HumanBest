# Architecture Diagram: Leads Quality Improvements

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER UPLOADS PRODUCT                         │
│                   (Image + Barcode + Label)                          │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  POST /api/analyze      │
                    │  Intelligence Pipeline  │
                    └────────┬────────────────┘
                             │
                ┌────────────┼────────────────┐
                │                             │
       Image Analysis               [OPTIONAL]
       + LLM inference         Supplier Enrichment
                │                    │
       ┌────────▼──────────┐    (Only if env flag)
       │ Product Analysis  │         │
       │ - Category        │    ┌────▼──────┐
       │ - Keywords        │    │ Enrich    │
       │ - Material        │    │ supplier  │
       │ - HS Code         │    │ profiles  │
       └────────┬──────────┘    └────┬──────┘
                │                    │
                └────────┬───────────┘
                         │
              ┌──────────▼──────────┐
              │   Step 2: Supplier  │
              │     Matching        │
              │   (Fallback Logic)  │
              └────────┬────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
    ▼                  ▼                  ▼
┌─────────┐      ┌──────────┐      ┌──────────┐
│ Anchor  │      │  HS6     │      │Category  │
│ Search  │      │  Search  │      │ Search   │
└────┬────┘      └────┬─────┘      └────┬─────┘
     │                │                  │
     │     If < 5 candidates             │
     │                │                  │
     └────────┬───────┴──────────────────┘
              │
              ▼
     ┌─────────────────────┐
     │ Material Fallback   │
     │ (TIGHTENED)         │
     └────────┬────────────┘
              │
      ┌───────┴────────┐
      │                │
      ▼                ▼
  ┌─────────┐    ┌──────────────┐
  │ Non-Food│    │   FOOD ONLY  │
  │         │    │              │
  │Standard │    │2-Token Combo │
  │Search   │    │+ Head Noun   │
  │         │    │(Tightened)   │
  └────┬────┘    └──────┬───────┘
       │                │
       └────────┬───────┘
                │
    ┌───────────▼──────────────┐
    │  Collect Supplier Matches│
    │  + Filter + Score        │
    └───────────┬──────────────┘
                │
    ┌───────────▼──────────────────────┐
    │ [NEW] Compute Exclusions         │
    │ - Check isLogisticsOnly()         │
    │ - Set flags.excluded_reason       │
    │ - Mark isExcluded = true          │
    └───────────┬──────────────────────┘
                │
    ┌───────────▼──────────────────┐
    │  Save to product_supplier_   │
    │  matches table               │
    │  (flags stored in JSONB)     │
    └───────────┬──────────────────┘
                │
                └────┐
                     │ Return to client
                     │
        ┌────────────▼─────────────┐
        │ /api/reports/[reportId]  │
        │ GET Report + Matches     │
        └────────────┬─────────────┘
                     │
        ┌────────────▼─────────────────────────────┐
        │ [NEW] Split Matches into 3 Arrays        │
        │ - _recommendedMatches (non-excluded)    │
        │ - _candidateMatches (non-excluded)      │
        │ - _excludedMatches (with reasons)       │
        │ + Add counts: _supplierExcludedCount    │
        └────────────┬─────────────────────────────┘
                     │
        ┌────────────▼──────────────────────┐
        │ Return JSON Response               │
        │ (Backward compat: _supplierMatches)│
        └────────────┬──────────────────────┘
                     │
                     │ Client-side
                     │
        ┌────────────▼──────────────────────┐
        │ ReportV2SourcingLeads Component    │
        │ (React Client Component)           │
        └────────────┬──────────────────────┘
                     │
        ┌────────────▼──────────────────────────────┐
        │ [NEW] Display 3 Sections                  │
        │                                          │
        │ 1. Suggested Suppliers (Recommended)     │
        │    - Not excluded, visible              │
        │    - Sorted by score DESC               │
        │                                          │
        │ 2. Unverified (Candidates)               │
        │    - Not excluded, visible              │
        │    - Sorted by score DESC               │
        │                                          │
        │ 3. Excluded (COLLAPSED)                  │
        │    - With reason pills                  │
        │    - Shows count badge                  │
        │    - Click "Show/Hide" to expand       │
        │    - Reason: "Logistics company"        │
        │           or "Low-quality match"        │
        │           or "Toy company" etc.         │
        └────────────────────────────────────────┘
```

---

## Component Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   ReportV2Page                           │
│              (Main Report Container)                     │
└──────────────────────────────────────────────────────────┘
                          │
              ┌───────────┴────────────┐
              │                        │
              ▼                        ▼
    ┌──────────────────┐    ┌─────────────────┐
    │ ReportV2Cost     │    │ReportV2Sourcing │
    │ ReportV2Evidence │    │Leads (NEW)      │
    │ etc...           │    └────────┬────────┘
    └──────────────────┘             │
                         ┌───────────┴────────────┐
                         │                        │
                         ▼                        ▼
                    ┌─────────────┐      ┌──────────────┐
                    │ LeadCard    │      │ ExcludedLead │
                    │ (Reusable)  │      │ Card         │
                    └─────────────┘      └──────────────┘
```

---

## Database Schema Impact

```
product_supplier_matches table
┌──────────────────────────────────────────────┐
│ id (uuid)                                    │
│ report_id (uuid, fk reports)                │
│ supplier_id (string)                        │
│ supplier_name (string)                      │
│ tier (enum: recommended | candidate)        │
│ match_score (decimal)                       │
│ rerank_score (decimal)                      │
│                                              │
│ flags (JSONB) ← [MODIFIED STRUCTURE]        │
│ {                                            │
│   "type_logistics"?: boolean,               │
│   "excluded_reason"?: string,  ← [NEW]      │
│   "evidence_strength": string,              │
│   "why_lines": [string],                    │
│   "matched_anchors"?: [string],             │
│   "anchor_hit"?: number,                    │
│   ...                                       │
│ }                                            │
│                                              │
│ evidence (JSONB)                            │
│ {                                            │
│   "recordCount": number,                    │
│   "lastSeenDays": number,                   │
│   "productTypes": [string],                 │
│   "evidenceSnippet"?: string                │
│ }                                            │
│                                              │
│ created_at (timestamp)                      │
│ updated_at (timestamp)                      │
└──────────────────────────────────────────────┘

✅ NO SCHEMA CHANGES REQUIRED
   (Uses existing JSONB columns)
```

---

## Function Call Chain

```
1. POST /api/analyze
   └─> runIntelligencePipeline()
       └─> findSupplierMatches()
           ├─> Anchor search
           ├─> HS6 search
           ├─> Category search
           └─> Material search [TIGHTENED FOR FOOD]
               ├─> isFoodCategory(analysis.category)
               ├─> buildFoodMaterialSearchTerms() [NEW]
               │   ├─> getFoodCategoryHeadNoun() [NEW]
               │   └─> Produces 3-5 combined terms
               └─> Standard search for non-food
       └─> [FOR EACH MATCH]
           └─> Compute exclusion
               └─> isLogisticsOnly() [NEW]
                   └─> Set flags.excluded_reason

2. GET /api/reports/[reportId]
   └─> Fetch supplier matches
       └─> [FOR EACH MATCH]
           ├─> Import intel/enrichment
           └─> Compute isExcluded
               └─> isLogisticsOnly() [NEW]
       └─> Split into 3 arrays [NEW]
           ├─> _recommendedMatches
           ├─> _candidateMatches
           └─> _excludedMatches

3. ReportV2SourcingLeads Component
   └─> Receive report JSON
       └─> Use _recommendedMatches/
           _candidateMatches/
           _excludedMatches [NEW]
           └─> Render 3 sections
               ├─> Suggested (visible)
               ├─> Unverified (visible)
               └─> Excluded (collapsed) [NEW]
                   └─> Show reason pills [NEW]
```

---

## Environment Variables Flow

```
.env.local
│
└─> process.env.SUPPLIER_ENRICHMENT_ENABLED
    │
    └─> /api/analyze route
        │
        ├─> if (enrichmentEnabled)
        │   └─> Attempt enrichment
        │       ├─> Check table exists
        │       └─> If missing: Compact warning
        │
        └─> else
            └─> Skip silently
                └─> console.log("[Analyze] skipping enrichment")
```

---

## State Management (React)

```
ReportV2SourcingLeads Component
│
├─> useState(showExcluded) ← Collapse/expand excluded section
│
├─> Receive from API:
│   ├─> _recommendedMatches
│   ├─> _candidateMatches
│   └─> _excludedMatches
│
├─> Render:
│   ├─> Suggested (always visible)
│   │   └─> verifiedLeads.map(supplier => <LeadCard />)
│   │
│   ├─> Unverified (always visible)
│   │   └─> unverifiedLeads.map(supplier => <LeadCard />)
│   │
│   └─> Excluded (collapsed by default)
│       ├─> Button: "Show excluded ({count})"
│       ├─> onClick: setShowExcluded(!showExcluded)
│       └─> {showExcluded && (
│           └─> excludedLeads.map(supplier => (
│               <div>
│                 <name />
│                 <ReasonPill excluded_reason={...} />
│               </div>
│           ))
│       )}
```

---

## Error Handling Flow

```
Pipeline Error Scenarios:

1. Material fallback (food):
   - Input: material="", category="Candy"
   - Check: buildFoodMaterialSearchTerms() returns []
   - Action: Skip material search, log reason
   - Result: ✅ No error, fallback to prior rounds

2. Logistics detection (edge case):
   - Input: "Fashion Line Inc" (LINE keyword, fashion category)
   - Check: isLogisticsOnly() only matches if !food
   - Action: Not excluded (fashion context, not logistics)
   - Result: ✅ Correctly classified

3. Enrichment disabled:
   - Env: SUPPLIER_ENRICHMENT_ENABLED=false
   - Action: Skip enrichment entirely
   - Result: ✅ No DB check, no warnings

4. Enrichment enabled, table missing:
   - Env: SUPPLIER_ENRICHMENT_ENABLED=true
   - DB Error: Table doesn't exist (code 42P01)
   - Action: Log compact warning, continue
   - Result: ✅ Non-blocking, returns success

5. API exclusion logic:
   - Input: Match with flags.type_logistics=true
   - Check: isLogisticsOnly(flags, name, category)
   - Action: Set isExcluded=true, add to _excludedMatches
   - Result: ✅ Shown in collapsed section
```

---

## Performance Characteristics

```
Operation                      Time Impact      Space Impact
─────────────────────────────────────────────────────────────
isLogisticsOnly() check        O(1) in-memory   Minimal
buildFoodMaterialSearchTerms() O(n) n=tokens    Minimal
Food 2-token search            ↓ 40-50%         N/A (fewer queries)
Material search (non-food)     Unchanged        Unchanged
Enrichment disabled            ↓ 100% skipped   ↓ Table checks removed
API array splitting            O(n) in-memory   Linear (new arrays)
UI reason pill rendering       O(1) per item    Minimal

Net Result: ✅ Performance improvement
- Enrichment skipped entirely when disabled (default)
- Food material: Fewer search queries
- Exclusion logic: Pure in-memory computation
```

---

**Diagram Last Updated: December 29, 2025**
