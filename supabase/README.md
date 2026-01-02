# NexSupply Database Setup

## 단일 진실 공급원 (Single Source of Truth)

이 프로젝트는 **schema.sql 하나**를 단일 기준으로 사용합니다.

## 🚀 빠른 설정 (Fresh Start)

### 1. Supabase 프로젝트 준비
```bash
# Supabase Dashboard → Settings → Database → Reset Database (선택사항)
# 또는 새 프로젝트 생성
```

### 2. Schema 적용
```sql
-- Supabase Dashboard → SQL Editor에서 실행
-- 파일: supabase/schema.sql 전체 복사해서 실행
```

### 2-1. Storage 버킷 생성 (Cloud)
- Supabase Dashboard → Storage → Create bucket → 이름 `uploads`
- schema.sql에서는 `storage.create_bucket`을 사용하지 않습니다. 클라우드에서는 UI에서 한 번만 생성하세요.

### 3. 환경변수 설정
```env
# .env.local 파일에 추가
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 관리자 패널용
```

### 4. 첫 관리자 계정 생성
```sql
-- 회원가입 후, SQL Editor에서 실행
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

## 📊 데이터베이스 구조

### 사용자 여정별 테이블

```
1. 제품 분석 (Intelligence Pipeline)
   ├─ product_analyses      # Gemini AI 분석 결과
   ├─ supplier_products     # 공급사 제품 데이터
   └─ product_supplier_matches  # 매칭 스코어

2. 사용자 리포트 (User Journey)
   ├─ profiles              # 사용자 프로필 (role: user/admin)
   ├─ reports               # 분석 리포트 (공유 가능)
   ├─ leads                 # 소싱 후보 (리포트에서 생성)
   ├─ verifications         # 샘플/검수/감사 요청
   ├─ orders                # 주문 및 배송 추적
   ├─ messages              # 사용자-관리자 메시지
   └─ files                 # 첨부파일
```

### 테이블 관계도
```
auth.users
    └─ profiles (id, role)
        ├─ reports (user_id)
        │   ├─ leads (report_id)
        │   ├─ verifications (report_id, user_id)
        │   └─ orders (report_id, user_id)
        ├─ messages (user_id)
        └─ files (user_id)
```

## 🔒 Row Level Security (RLS)

모든 테이블에 RLS 활성화됨:

- **Public**: `reports` 읽기 가능 (공유 링크용)
- **User**: 자신의 데이터만 조회/수정
- **Admin**: 모든 데이터 조회/수정 (service_role_key 사용)

## 🛠️ 마이그레이션 관리

### 구조
```
supabase/
├── schema.sql                 # ✅ 단일 진실 공급원
├── seed_data.sql              # 선택사항: 샘플 데이터
├── migrations/                # 앞으로 추가될 변경사항만
│   └── (비어있음)
└── migrations_archive/        # 과거 migration 파일들 (참고용)
```

### 새 변경사항 추가 방법
```bash
# 1. schema.sql을 직접 수정
# 2. 변경분만 별도 migration 파일로 저장
# 3. 파일명: supabase/migrations/YYYYMMDD_description.sql
```

예시:
```sql
-- supabase/migrations/20251230_add_order_notes.sql
ALTER TABLE orders ADD COLUMN notes text;
```

## 🎯 사용자 여정 플로우

### 비로그인 → 로그인 → 주문 완료
```
1. Public (/analyze)
   └─ 제품 사진 업로드 → 즉시 분석
   └─ 저장하려면 로그인 유도

2. Login (/signin)
   └─ 이메일 매직 링크 or Google OAuth

3. Dashboard (/app)
   └─ Start New Estimate
   └─ Reports 리스트 (상태별 필터)

4. Report Detail (/reports/[id])
   ├─ Cost: 원가 분석
   ├─ Compliance: HS Code, 관세, 규제
   ├─ Evidence: 이미지 증거, 바코드, 패키징
   └─ Leads: AI가 찾은 공급사 후보

5. Verification (/verifications)
   └─ Sample / Inspection / Audit 요청
   └─ Admin이 케이스 처리

6. Order (/orders)
   └─ 견적 확정 → 발주
   └─ 상태: draft → in_production → shipped → delivered

7. Admin Panel (/admin)
   ├─ Dashboard: 통계
   ├─ Users: 계정 관리
   ├─ Reports: 모든 리포트
   ├─ Verifications: 검증 큐
   ├─ Orders: 주문 추적
   ├─ Inbox: 고객 문의
   └─ Leads: 소싱 리드 관리
```

## 🔧 트러블슈팅

### 에러: "relation does not exist"
```sql
-- schema.sql을 아직 적용하지 않았거나 일부만 적용됨
-- 해결: Supabase SQL Editor에서 schema.sql 전체 재실행
```

### 에러: "column does not exist"
```sql
-- 기존 테이블과 schema가 불일치
-- 해결 1: DB Reset 후 schema.sql 적용
-- 해결 2: 특정 테이블만 DROP 후 재생성
DROP TABLE IF EXISTS verifications CASCADE;
-- 그 다음 schema.sql의 해당 테이블 부분만 재실행
```

### Admin 패널 접근 불가
```sql
-- 1. service_role_key가 .env.local에 있는지 확인
-- 2. 계정에 admin 권한이 있는지 확인
SELECT * FROM profiles WHERE email = 'your@email.com';

-- admin 권한 부여
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### RLS 때문에 데이터 안 보임
```typescript
// 일반 사용자는 createClient() 사용
import { createClient } from '@/lib/supabase/server'

// Admin 패널은 getSupabaseAdmin() 사용 (RLS 우회)
import { getSupabaseAdmin } from '@/lib/supabase/admin'
```

## 📝 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] schema.sql 적용 (SQL Editor에서 실행)
- [ ] .env.local에 3개 키 설정 (URL, ANON, SERVICE_ROLE)
- [ ] 회원가입 테스트
- [ ] 첫 유저를 admin으로 승격
- [ ] /app 접근 확인 (로그인 상태)
- [ ] /admin 접근 확인 (admin 유저)
- [ ] 제품 분석 테스트 (/analyze)

## 🎓 참고사항

- **schema.sql = 유일한 기준점**: 다른 SQL 파일은 무시
- **migrations_archive/**: 과거 파일들 (읽기 전용, 참고용)
- **seed_data.sql**: 샘플 데이터 (선택사항)
- **TypeScript 타입**: `src/types/database.ts`가 schema.sql과 동기화됨

---

**마지막 업데이트**: 2025-12-29  
**스키마 버전**: 1.0 (Consolidated)
