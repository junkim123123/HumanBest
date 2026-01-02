# Category Profile System - Integration Plan

## 개요

카테고리 프로필 기반 시스템을 파이프라인에 통합하는 방법입니다.

## 파일 구조

- `src/lib/category-profiles.ts`: 프로필 타입, 기본 프로필, 유틸 함수
- `src/lib/intelligence-pipeline.ts`: 파이프라인 메인 로직 (통합 대상)

## 통합 체크리스트

### 1. Import 추가

`intelligence-pipeline.ts` 상단에 추가:

```ts
import {
  determineCategoryKey,
  getCategoryProfile,
  allowHs2FromAnalysis,
  extractBrandPhrases,
  rerankWithProfile,
  countAnchorHits,
} from "./category-profiles";
```

### 2. findSupplierMatches 함수 수정

**위치**: `findSupplierMatches` 함수 시작 부분 (약 1107줄)

**추가할 코드**:

```ts
async function findSupplierMatches(
  analysis: ImageAnalysisResult,
  productId?: string,
  analysisId?: string
): Promise<{ matches: SupplierMatch[]; cached: boolean }> {
  console.log("[Pipeline Step 2] Starting supplier matching...");
  const supabase = await createClient();

  // ============================================================================
  // Category Profile Setup
  // ============================================================================
  const categoryKey = determineCategoryKey(analysis);
  const profile = getCategoryProfile(categoryKey);
  console.log(`[Pipeline Step 2] Category: ${categoryKey}, Profile version: ${profile.version}`);

  // Extract brand phrases for anchor matching
  const brandPhrases = extractBrandPhrases(analysis);
  console.log(`[Pipeline Step 2] Brand phrases: ${brandPhrases.join(", ")}`);

  // ... 기존 코드 계속
```

### 3. 후보 수집 단계 - Limit 증가

**위치 1**: OR query 검색 (약 1277줄)

**변경**:
```ts
// 기존: .limit(200)
// 변경:
.limit(profile.limits.maxCandidatesBeforeRerank) // 200
```

**위치 2**: Fallback anchor keywords 검색 (약 1513줄)

**변경**:
```ts
// 기존: .limit(200)
// 변경:
.limit(profile.limits.maxCandidatesBeforeRerank)
```

### 4. 앵커 키워드 강화

**위치**: `buildAnchorTerms` 함수 사용 전 (약 1505줄)

**추가할 코드**:

```ts
// Step 1: Search by anchor keywords (product name, keywords) - most reliable
const anchorTerms = buildAnchorTerms(analysis);

// Enhance with brand phrases (higher priority)
const enhancedAnchorTerms = [
  ...brandPhrases.map((p) => p.toLowerCase()),
  ...anchorTerms,
].filter((t, i, arr) => arr.indexOf(t) === i); // Remove duplicates

if (enhancedAnchorTerms.length > 0) {
  console.log(
    `[Pipeline Step 2 Fallback] Searching by anchor keywords: ${enhancedAnchorTerms.join(", ")}`
  );

  const orFilter = enhancedAnchorTerms.map((t) => `product_name.ilike.%${t}%`).join(",");
  // ... 기존 코드
}
```

### 5. finalMatches 생성 직전 - rerankWithProfile 적용

**위치**: `findSupplierMatches` 함수 끝부분, `finalMatches` 생성 직전 (약 1780줄 근처)

**추가할 코드**:

```ts
  // ============================================================================
  // Step 2.6: Category Profile Reranking
  // ============================================================================
  console.log("[Pipeline Step 2.6] Applying category profile reranking...");
  
  // Get runtime allowHs2 from market estimate (if available) or analysis
  // This will be passed from inferMarketEstimateWithGemini result later
  const runtimeAllowHs2: string[] = []; // Will be populated from marketEstimate
  
  // Rerank all matches with profile
  const rerankedMatches = enrichedMatches.map((match) => {
    const productText = `${match.productName} ${match.evidence?.productTypes?.join(" ") || ""}`;
    const anchorHits = countAnchorHits(
      `${match.supplierName} ${productText}`,
      brandPhrases,
      buildAnchorTerms(analysis)
    );
    
    const { score, flags } = rerankWithProfile({
      baseScore: match.matchScore,
      supplierName: match.supplierName,
      productText,
      supplierHs: null, // Will need to get from original product data
      isLogistics: match.supplierType === "logistics",
      isGenericManifest: isGenericManifestText(match.productName),
      anchorHits,
      profile,
      runtimeAllowHs2,
    });
    
    return {
      ...match,
      matchScore: score,
      // Store flags for debugging (not exposed to UI)
      _rerankFlags: flags,
    };
  });
  
  // Sort by new score and apply final limit
  const finalMatches = rerankedMatches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, profile.limits.maxFinal);
  
  console.log(
    `[Pipeline Step 2.6] Reranked ${enrichedMatches.length} matches to ${finalMatches.length} final candidates`
  );
```

### 6. Market Estimate에서 runtimeAllowHs2 전달

**위치**: `runIntelligencePipeline` 함수 (약 2600줄 근처)

**수정**:

```ts
// Step 2.5: Market Estimate Fallback (if no priced recommended matches found)
let marketEstimate: MarketEstimate | undefined;
if (pricedRecommended.length === 0) {
  console.log("[Pipeline] No priced recommended matches found. Generating market estimate...");
  marketEstimate = await inferMarketEstimateWithGemini(analysis);
}

// If we have market estimate, extract runtimeAllowHs2 for reranking
const runtimeAllowHs2 = marketEstimate
  ? allowHs2FromAnalysis({
      analysisHs: analysis.hsCode,
      hsCandidates: marketEstimate.hsCodeCandidates,
    })
  : allowHs2FromAnalysis({
      analysisHs: analysis.hsCode,
      hsCandidates: [],
    });
```

**그리고 findSupplierMatches 호출 시 전달**:

```ts
// Step 2: Supplier Matching (with caching)
const { matches: supplierMatches, cached: matchesCached } =
  await findSupplierMatches(analysis, params.productId, analysisId, runtimeAllowHs2);
```

**findSupplierMatches 시그니처 변경**:

```ts
async function findSupplierMatches(
  analysis: ImageAnalysisResult,
  productId?: string,
  analysisId?: string,
  runtimeAllowHs2?: string[] // 추가
): Promise<{ matches: SupplierMatch[]; cached: boolean }> {
```

### 7. Supplier HS Code 저장

**위치**: 후보 수집 단계에서 SupplierMatch 생성 시

**수정**: `allProducts`에서 수집할 때 `hs_code`도 함께 저장하고, rerankWithProfile 호출 시 전달

```ts
// rerankWithProfile 호출 시
const originalProduct = allProducts.get(`${match.supplierId}_${match.productName}`);
const supplierHs = originalProduct?.hs_code as string | null | undefined;

const { score, flags } = rerankWithProfile({
  // ...
  supplierHs, // 추가
  // ...
});
```

## 적용 순서

1. ✅ 타입 정의 및 기본 프로필 생성 (완료)
2. ✅ 유틸 함수 생성 (완료)
3. ⏳ Import 추가
4. ⏳ findSupplierMatches에 categoryKey 결정 추가
5. ⏳ Limit 증가
6. ⏳ 브랜드 구문 추출 및 앵커 강화
7. ⏳ finalMatches 직전 rerankWithProfile 적용
8. ⏳ runtimeAllowHs2 전달 구조 추가

## 테스트 포인트

- LINE FRIENDS 케이스: 브랜드 구문 매칭 확인
- Jelly Candies 케이스: Food 프로필 hardMismatch 적용 확인
- HS2 게이트: allowHs2/denyHs2 적용 확인
- 점수 변화: rerank 전후 점수 비교 로그

## 다음 단계

1. 프로필 생성 잡 구현 (DB에서 자동 생성)
2. 프로필 DB 저장 및 캐싱
3. 피드백 루프 (irrelevant 후보 → 프로필 업데이트)














