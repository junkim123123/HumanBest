# Accuracy Booster Design - 선택적 입력 구조

## 개요

제품 분석 정확도를 높이기 위한 선택적 입력(바코드, 뒤 라벨) 구조 설계입니다.

## 핵심 원칙

1. **기본 플로우는 유지**: 제품 정면 사진 1장으로 80점 경험 제공
2. **선택적 부스터**: 바코드/라벨은 선택 사항으로 제공
3. **카테고리 기반 권장**: 카테고리에 따라 라벨 요청 강도 조절

## 카테고리별 라벨 요청 규칙

### 강력 권장 (Strong Recommendation)

#### Food
- **라벨**: 필수 권장
  - 성분, 알러지, 순중량, 원산지 추출
  - FDA 라벨링 리스크와 HS 후보 정확도 상승
- **바코드**: 권장
  - 리테일 패키지 기반 규격 추정

#### Beauty
- **라벨**: 필수 권장
  - 성분이 규제와 통관 리스크를 바로 결정
  - 알러지, 경고문구 추출
- **바코드**: 권장
  - 브랜드 제품 식별

#### Electronics (배터리 포함)
- **라벨**: 필수 권장
  - 배터리 타입, 인증 문구, 전기 관련 분기
  - 리스크 체크리스트 정확도 상승
- **바코드**: 권장

### 권장 (Recommended)

#### Toy
- **바코드**: 권장 (IP 강한 브랜드 상품)
- **라벨**: 선택적

#### Apparel
- **바코드**: 권장
- **라벨**: 선택적

### 선택적 (Optional)

#### Home, Furniture, Packaging, Industrial Parts
- **바코드**: 선택적
- **라벨**: 큰 의미 없음 (단순 플라스틱 잡화, 벌크 원자재)

## 데이터 구조

### ImageAnalysisResult 확장

```typescript
export interface ImageAnalysisResult {
  // ... 기존 필드
  evidenceLevel?: "image_only" | "image_and_label" | "image_and_label_and_barcode";
  barcode?: string | null;
  labelData?: {
    ingredients?: string[];
    allergens?: string[];
    netWeight?: string;
    origin?: string;
    manufacturer?: string;
    warnings?: string[];
    batteryType?: string;
    certifications?: string[];
  } | null;
}
```

### CategoryProfile 확장

```typescript
export type CategoryProfile = {
  // ... 기존 필드
  labelRequest?: {
    barcodeRecommended: boolean;
    labelRecommended: boolean;
    labelRequiredFields?: string[];
  };
};
```

## UI/UX 문구

### 선택 사항 안내
- "더 정확하게 만들기 (선택 사항)"
- "바코드나 뒤 라벨이 있으면 정확도가 올라가요"
- "없으면 그냥 계속 진행하세요"

### 근거 수준 표시
리포트에 표시:
- **근거 수준**: 사진 기반
- **근거 수준**: 사진과 라벨 기반
- **근거 수준**: 사진과 라벨과 바코드 기반

## 바코드 처리

### 지원 형식
- UPC (미국)
- EAN (유럽)
- QR 코드
- 내부 코드

### 처리 방식
- 스캔 실패 시 텍스트 직접 입력 가능
- 바코드만으로는 제품 특정 안 될 수 있으니 항상 사진 기반 추정과 함께 사용
- 동일 제품 재분석 시 캐시 키로 활용

## 라벨 처리

### 외국어 라벨
- Gemini 언어 감지
- 필요한 핵심 필드만 추출 (번역 아님)
- 필드 추출 목표임을 UI에 명확히 표시

### 추출 필드
- 순중량 (netWeight)
- 원재료 (ingredients)
- 알러지 (allergens)
- 원산지 (origin)
- 제조사 (manufacturer)
- 주소 (address)
- 경고문구 (warnings)

## 구현 단계

### Phase 1: 타입 정의 (완료)
- ✅ ImageAnalysisResult 확장
- ✅ CategoryProfile에 labelRequest 추가
- ✅ 카테고리별 labelRequest 설정

### Phase 2: API 확장
- [ ] `/api/analyze`에 barcode, labelImage 파라미터 추가
- [ ] Gemini로 라벨 분석 로직 추가
- [ ] 바코드 파싱 로직 추가

### Phase 3: UI 구현
- [ ] 선택적 입력 섹션 추가
- [ ] 바코드 스캔/입력 UI
- [ ] 라벨 이미지 업로드 UI
- [ ] 근거 수준 표시

### Phase 4: 분석 로직 통합
- [ ] 라벨 데이터를 HS 코드 추정에 반영
- [ ] 라벨 데이터를 리스크 체크리스트에 반영
- [ ] 바코드를 캐시 키로 활용

## 운영 규칙

1. **기본은 절대 강제하지 않기**: 사진만으로도 진행 가능
2. **카테고리 기반 권장**: 식품, 코스메틱, 배터리 제품만 뒤 라벨 강하게 권장
3. **IP 강한 브랜드**: 바코드 우선 권장
4. **입력 없으면**: LLM baseline으로 진행, 근거 수준 명확히 표시














