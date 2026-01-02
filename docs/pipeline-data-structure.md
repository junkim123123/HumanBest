# Pipeline Data Structure Documentation

## 1. marketEstimate 원본 JSON Shape

```typescript
interface MarketEstimate {
  hsCodeCandidates: Array<{
    code: string;           // e.g., "9503.00.00"
    confidence: number;     // 0-1
    reason: string;        // "Most likely HS code based on product characteristics"
  }>;
  fobPriceRange: {
    min: number;           // e.g., 0.50
    max: number;           // e.g., 5.00
    currency: string;      // "USD"
    unit: string;          // "per unit" | "per set" | "per piece"
  };
  // Also supports priceRange (fallback)
  priceRange?: {
    min: number;
    max: number;
    currency: string;
    unit: string;
  };
  moqRange: {
    min: number;
    max: number;
    typical: number;
  };
  leadTimeRange: {
    min: number;    // days
    max: number;    // days
    typical: number; // days
  };
  primaryProductionCountries: string[];
  riskChecklist: string[];
  notes: string;
  evidenceSource: "internal_records" | "llm_baseline";
  similarRecordsCount?: number;
  confidenceTier?: "low" | "medium" | "high";
  observedSuppliers?: Array<{
    exporterName: string;
    recordCount: number;
    lastSeenDays: number | null;
    evidenceSnippet?: string | null;
  }>;
  recentImporters?: Array<{
    importerName: string;
    shipmentCount: number;
    lastSeenDays: number;
    topOrigins?: string[];
    topPorts?: string[];
    evidenceSnippet?: string | null;
  }>;
}
```

## 2. similarRecords 샘플 구조

similarRecords는 `supplier_products` 테이블에서 조회됩니다:

```typescript
// From supplier_products table
interface SimilarRecord {
  id: string;
  supplier_id: string;
  supplier_name: string;
  product_name: string;
  product_description?: string;
  unit_price: number;
  moq: number;
  lead_time: number;
  category: string;
  hs_code?: string;
  currency: string;
  created_at: string;
  updated_at: string;
}
```

조회 방식:
- Category 기반: `category = analysis.category`
- Keyword 기반: `product_name ILIKE '%keyword%'`

## 3. supplierMatches가 0이 되는 이유 (removal reasons)

removal reasons는 `findSupplierMatches` 함수에서 수집됩니다:

```typescript
interface RemovalReasons {
  tooShort: number;        // product_name.length < 4
  various: number;         // "various" in product_name
  assorted: number;        // "assorted" in product_name
  mixed: number;           // "mixed" in product_name
  random: number;          // "random" in product_name
  banned: number;          // isBannedCandidate()
  badName: number;         // shouldRemoveName() - empty, symbols only, placeholder words
  logistics: number;       // isLikelyLogistics() - logistics keywords
  toyMismatch: number;     // Category mismatch for toys
  foodMismatch: number;    // Category mismatch for food
}
```

현재는 콘솔 로그에만 출력되고 있습니다:
```typescript
console.log(
  `[Pipeline Step 2] Removal reasons:`,
  Object.entries(removalReasons)
    .filter(([_, count]) => count > 0)
    .map(([reason, count]) => `${reason}: ${count}`)
    .join(", ") || "none"
);
```

## 4. reports 조회 RLS 정책

현재 RLS 정책:
- ✅ 익명 조회 허용: `USING (true)` - 모든 사용자가 리포트를 조회할 수 있음
- ✅ 인증된 사용자만 쓰기: `USING (auth.role() = 'authenticated')`

```sql
CREATE POLICY "Allow anonymous read access" ON reports
  FOR SELECT
  USING (true);
```

