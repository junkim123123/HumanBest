# 개발 진행 상황 및 개선사항 요약

> **최종 업데이트**: 2025-01-XX  
> **목적**: 지금까지 완료된 주요 개선사항과 현재 상태를 한눈에 파악하고, 다음 작업 지시를 커서에게 바로 전달하기 위한 문서

---

## 1) 지금까지 완료된 주요 개선사항 요약

### A. 신뢰도·증거 강화

#### SupplierCard Evidence 섹션 강화
- ✅ **Similarity score, Records count, Recency** 3개 핵심 숫자 항상 표시
- ✅ **Common items** (top 3 product types) 표시
- ✅ **Match explanation** (매칭 이유) 표시
- ✅ Evidence 없을 때: "선적 기록이 적습니다. 검증이 필요합니다." 메시지로 명확히 안내
- ✅ **Evidence snippet** 추가: shipping record text에서 120자 이내 스니펫 추출 및 표시
  - "Source: shipping record text" 라벨 포함

#### AI 정리 요약
- ✅ **AI 정리 요약** 섹션 추가
- ✅ "Source: shipping record text" 표기로 원문 기반임을 명확히 표시
- ✅ AI가 사실을 만들어내지 않도록 제한 (가격, MOQ, 리드타임 생성 금지)

#### Market Estimate 개선
- ✅ **Evidence source** 구분: "Internal records" vs "Directional estimate"
- ✅ **Similar records count** 숫자 표시
- ✅ **Confidence tier** 색상 표시 (high=green, medium=yellow, low=amber)
- ✅ **Typical price** 추가 (min+max 평균)
- ✅ LLM baseline일 때 경고 메시지 강화
  - "내부 데이터에서 유사 기록을 찾지 못했습니다"
  - "이 추정치는 LLM 시장 지식을 기반으로 합니다"

### B. UI·카드 전반 확장

#### 새 카드 3종 추가
1. ✅ **CostDriverCard**: 가격 결정 요인
   - 포장과 프린팅
   - 소재와 부품 수
   - 인증과 통관 리스크
   - 카테고리별 맞춤 드라이버 (Confectionery, Toys 등)

2. ✅ **AskListCard**: 견적 요청 체크리스트
   - 기본 10개 항목 + 카테고리별 추가 항목
   - 전체 복사 기능
   - 바로 공급업체에 보낼 수 있는 형식

3. ✅ **VerificationCard**: 24시간 내 검증 서비스 안내
   - 검증 항목 6개 명시
   - 검증 완료 후 받게 되는 결과물 표시

#### Dashboard 통합
- ✅ 모든 새 카드가 dashboard에 통합됨
- ✅ 카테고리별 맞춤 Ask list 및 Cost driver 적용
- ✅ Recommended/Candidate 구분 명확화
- ✅ Evidence 기반 신뢰 표시와 다음 액션이 화면에서 명확히 보이도록 조정

### C. 추천 조건 강화

#### Recommended 조건 (엄격한 기준)
- ✅ **Perfect match**: `!isInferred && matchScore >= 50`
- ✅ **Evidence**: `recordCount >= 3`
- ✅ **SupplierType**: `factory` 또는 `trading`
- ✅ **Logistics 제외**: `supplierType !== "logistics"`

#### Supplier Type 분류 강화
- ✅ **룰 기반 1차 분류** (`classifySupplierTypeByRules`)
  - Logistics 키워드 우선 체크 (shipping, cargo, freight, forwarder 등)
  - Factory 키워드 체크 (factory, manufacturing, industrial 등)
  - Trading 키워드 체크 (trading, import, export 등)
- ✅ **AI는 2차 정리만**: 룰 기반 결과를 baseline으로 사용
- ✅ **Logistics는 AI가 변경 불가**: 룰에서 logistics로 판정되면 강제 유지
- ✅ Recommended에서 logistics 완전 제외, Candidate로만 표시

### D. DB / 파이프라인 안정화 및 로깅

#### ON CONFLICT 에러 해결
- ✅ 마이그레이션 확인: `migration_fix_supplier_matches_cache.sql` 존재
- ✅ 에러 핸들링 개선: 42P10 에러 감지 및 명확한 로그 메시지
- ✅ 성공 로그 추가: 캐시 성공 시 로그 출력

#### SupplierEvidence 확장
- ✅ `lastSeenDays` 필드 추가 (일 단위 계산)
- ✅ `productTypes` 빈도 기반 상위 3개로 정렬
- ✅ `evidenceSnippet` 필드 추가 (120자 이내 shipping record 스니펫)
- ✅ 항상 evidence 반환 (빈 값도 포함)

#### 필터링 로직 개선
- ✅ **정규화 우선**: `extractCompanyName` 함수로 회사명 추출 먼저 수행
- ✅ **필터 규칙 분리**: 
  - `shouldRemoveName`: 진짜 삭제만 (완전 빈값, 기호만, 플레이스홀더만)
  - `isLowQualityName`: 낮은 품질은 candidate로 강등
- ✅ **물류사 강등**: 제거하지 않고 candidate로 보냄
- ✅ **badName 샘플 출력**: 제거된 원문 10개를 콘솔에 출력
- ✅ **Removal reasons 집계**: 사유별 카운트 로그 출력

#### 파이프라인 안정화
- ✅ ReferenceError 해결: `isBadName` → `shouldRemoveName` 교체
- ✅ 모든 호출부 수정 완료
- ✅ backward-compat 함수 추가

### E. 사용자 안내·기능 개선

#### Placeholder 처리
- ✅ 가격/MOQ/Lead time 없을 때 표시 문구 정리
  - `unitPrice <= 0 || unitPrice === 1` → "Quote needed"
  - `moq <= 1` → "Unknown"
  - `leadTime <= 0` → "Unknown"

#### Market Estimate 근거 표시
- ✅ Evidence source, Similar records count, Confidence tier 표시
- ✅ LLM baseline일 때 경고 메시지 강화

#### 추가 카드 및 기능
- ✅ TimelineCard, BreakEvenCard, RiskTrafficLight 추가
- ✅ Quote Modal, 각 Supplier 카드 "Get quote in 24 hours" 버튼
- ✅ 견적 요청 체크리스트, 24시간 검증 안내

#### LLM Baseline 입력 요청 플로우
- ✅ **FollowUpInputCard** 컴포넌트 생성
  - 바코드/UPC 입력
  - 뒷면 라벨 사진 업로드
  - 재질과 치수 입력
- ✅ LLM baseline일 때 자동 표시
  - `evidenceSource === "llm_baseline"` 또는 `similarRecordsCount === 0`일 때 표시
- ✅ "비슷한 내부 기록이 없어서 라벨과 바코드가 있으면 정확도가 크게 오릅니다" 설명 포함

---

## 2) 지금 화면에서 바로 보이는 변화 핵심 포인트

1. **Evidence 중심 설계**
   - 누가 봐도 어느 정도 검증된 공급처인지 파악 가능
   - Similarity, Records, Recency 3개 숫자로 신뢰도 즉시 판단

2. **시장 추정치와 실제 검증치 구분**
   - 고객이 추정인지 확정인지 혼동 없음
   - LLM baseline일 때 명확한 경고와 설명

3. **다음 행동의 명확한 단계 제공**
   - Ask list 복사 → 바로 공급업체에 전송
   - 24시간 검증 신청 → 검증 항목 명시
   - 견적 요청 → 필수 입력 5개

4. **Risk, Cost driver, IP, 인증 등 현실 리스크 표시**
   - 카테고리별 맞춤 리스크 체크리스트
   - 가격 결정 요인 명시
   - 설득력 상승

5. **내부 기록이 없을 때에도 투명성 확보**
   - LLM 기반 추정 → 근거, 자신감 수준 표시
   - 추가 입력 요청으로 정확도 향상 가능

---

## 3) 남은 작업 또는 다음 단계 제안

### 즉시 개선 가능
- [ ] FollowUpInputCard 데이터를 `/api/quote` 엔드포인트로 저장하는 로직 구현
- [ ] analysisId를 SupplierList에서 전달받아 FollowUpInputCard에 전달
- [ ] 카테고리별 Ask list, Cost driver 세부화 추가

### 중기 개선
- [ ] Supplier Type 분류 정확도 더 높이기 (AI 프롬프트 개선)
- [ ] 내부 데이터 누적 시 Confidence tier 자동 상승 로직
- [ ] 고객 피드백이나 실제 견적 요청 사례를 통해 문구·표기 미세조정

### 장기 개선
- [ ] 뷰 흐름상, UI 요소 간 시선 이동과 클릭 유도 테스트
- [ ] A/B 테스트를 통한 전환율 최적화
- [ ] 성능 최적화 (40초 케이스 → 20초 이하 목표)

---

## 4) 커서에게 줄 수 있는 한 줄 지시문 예시

### 1. 증거·신뢰 표기 강화 관련
```
SupplierCard에서 Evidence 섹션을 더 강조하고, Similarity score, Records count, Recency, Common items, Match explanation, Evidence snippet을 항상 표시하도록 유지. Evidence 없을 때는 '검증 필요' 메시지로 표시.
```

### 2. Market Estimate 및 Confidence
```
Market Estimate에는 evidence source, similar records count, confidence tier 색, typical price, last updated, 우측에 경고나 설명 배지 등 표시. LLM baseline일 경우 경고 문구 강하게 표시하고 FollowUpInputCard를 자동으로 보여줌.
```

### 3. 추천 조건
```
Recommended는 score ≥ 50, !isInferred, recordCount ≥ 3, SupplierType factory or trading, logistics 제외 조건 계속 적용. 나머지는 Candidate로 분류하고 기본 접힘 상태로 유지.
```

### 4. UI/새 카드 통합
```
CostDriverCard, AskListCard, VerificationCard, FollowUpInputCard가 Dashboard에 적절히 보여지도록 유지. 고객 행동 유도 문구, 복사 버튼, 24시간 검증 안내 유지.
```

### 5. 로깅·안정화
```
pipeline 단계별 로그, badName 또는 shouldRemoveName 제거샘플 로그, Removal reasons 집계, ReferenceError나 DB 오류 복구 확인용 코드 남기기. 캐시 성공/실패 로그도 명확히 표시.
```

### 6. Supplier Type 분류
```
룰 기반 1차 분류를 먼저 수행하고, AI는 2차 정리만 하도록 유지. Logistics는 룰에서 판정되면 AI가 변경할 수 없도록 강제. Recommended에서 logistics 완전 제외.
```

### 7. Evidence 수집
```
collectSupplierEvidence에서 recordCount, lastShipmentDate, lastSeenDays, productTypes (top 3), evidenceSnippet (120자 이내)를 항상 수집하도록 유지. 빈 값도 반환하여 UI에서 표시 가능하도록 함.
```

---

## 5) 참고로 덧붙일 작은 패턴 지침

- **HS 코드나 관세 정보 언급 시**, 가능한 근거 표기를 간단히 덧붙이면 신뢰도가 더 올라갑니다.
  - 예: "플라스틱 장식품 관련 HTS 3926.40.00이 존재하고, 관세율 정보가 공개된 서비스에서 확인되는 등"
  - 이 정도 수준의 짧은 언급은 고객 설명이나 리스크 체크리스트에 활용 가능

- **숫자는 항상 근거와 함께 표시**
  - "12건의 선적 기록" (X)
  - "12건의 선적 기록, 최근 3개월 내 2건 확인됨" (O)

- **추정치는 항상 "estimate" 또는 "baseline" 표기**
  - LLM baseline일 때는 더 강하게 경고
  - Internal records일 때도 "추정치"임을 명시

---

## 6) 주요 파일 위치

### 핵심 파일
- `src/lib/intelligence-pipeline.ts`: 메인 파이프라인 로직
- `src/components/dashboard/SupplierList.tsx`: Supplier 표시 및 분류
- `src/components/dashboard/MarketEstimateCard.tsx`: Market Estimate 표시
- `src/components/dashboard/FollowUpInputCard.tsx`: LLM baseline 입력 요청
- `src/components/dashboard/CostDriverCard.tsx`: 가격 결정 요인
- `src/components/dashboard/AskListCard.tsx`: 견적 요청 체크리스트
- `src/components/dashboard/VerificationCard.tsx`: 24시간 검증 안내

### 마이그레이션
- `supabase/migration_fix_supplier_matches_cache.sql`: ON CONFLICT 에러 해결

---

## 7) 테스트 체크리스트

### 필수 확인 사항
- [ ] Recommended에 logistics가 0개인지 확인
- [ ] Evidence 섹션이 모든 SupplierCard에 표시되는지 확인
- [ ] LLM baseline일 때 FollowUpInputCard가 표시되는지 확인
- [ ] Market Estimate에 confidence tier 색상이 올바르게 표시되는지 확인
- [ ] badName 샘플이 로그에 출력되는지 확인
- [ ] 캐시 업서트가 42P10 에러 없이 성공하는지 확인

### UI/UX 확인 사항
- [ ] Ask list 복사 기능이 작동하는지 확인
- [ ] Candidate 섹션이 기본 접힘 상태인지 확인
- [ ] Evidence snippet이 120자 이내로 표시되는지 확인
- [ ] 모든 카드가 적절한 순서로 표시되는지 확인

---

**이 문서는 지속적으로 업데이트됩니다. 주요 변경사항이 있을 때마다 반영하세요.**

