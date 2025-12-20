# Intelligence Pipeline - Supabase Schema Requirements

이 문서는 `lib/intelligence-pipeline.ts`가 작동하기 위해 필요한 Supabase 테이블 스키마를 정의합니다.

## Required Tables

### 1. `product_analyses`

이미지 분석 결과를 캐싱하는 테이블입니다.

```sql
CREATE TABLE product_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  product_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, image_url)
);

CREATE INDEX idx_product_analyses_product_id ON product_analyses(product_id);
CREATE INDEX idx_product_analyses_image_url ON product_analyses(image_url);
```

### 2. `product_supplier_matches`

공급업체 매칭 결과를 캐싱하는 테이블입니다.

```sql
CREATE TABLE product_supplier_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  supplier_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  moq INTEGER NOT NULL DEFAULT 1,
  lead_time INTEGER NOT NULL DEFAULT 0,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  import_key_id TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, supplier_id)
);

CREATE INDEX idx_product_supplier_matches_product_id ON product_supplier_matches(product_id);
CREATE INDEX idx_product_supplier_matches_match_score ON product_supplier_matches(match_score DESC);
```

### 3. `supplier_products`

공급업체 제품 데이터를 저장하는 테이블입니다. (ImportKey 또는 다른 소스에서 동기화)

```sql
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  moq INTEGER NOT NULL DEFAULT 1,
  lead_time INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  import_key_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_products_product_name ON supplier_products USING gin(to_tsvector('english', product_name));
CREATE INDEX idx_supplier_products_category ON supplier_products(category);
CREATE INDEX idx_supplier_products_supplier_id ON supplier_products(supplier_id);
```

## RLS (Row Level Security) Policies

필요에 따라 RLS 정책을 설정하세요:

```sql
-- 예시: 모든 사용자가 읽기 가능, 소유자만 쓰기 가능
ALTER TABLE product_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_supplier_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (예시)
CREATE POLICY "Allow read access" ON product_analyses FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON product_supplier_matches FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON supplier_products FOR SELECT USING (true);
```

