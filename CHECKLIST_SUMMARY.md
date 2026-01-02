# 체크리스트 완료 요약

## ✅ 완료된 항목

### 1. runtime = "nodejs" 추가
- `src/app/api/analyze/route.ts`에 `export const runtime = "nodejs";` 추가
- Edge runtime 이슈 방지

### 2. 로그 메시지 개선
- "Found existing report, upsert success" 메시지 추가
- "Report saved successfully" 메시지 유지
- 서버 로그에서 저장 상태 명확히 확인 가능

### 3. 404 화면 생성
- `src/app/reports/[reportId]/not-found.tsx` 생성
- "리포트를 찾을 수 없습니다" 안내
- "새 분석 시작하기" 버튼으로 Analyze 페이지로 이동
- "홈으로 돌아가기" 버튼 추가

### 4. anchor keywords OR 키워드 제한
- `buildSearchTerms`에서 이미 상위 6개로 제한됨 (`.slice(0, 6)`)
- fallback anchor keywords도 상위 6개로 제한 추가
- statement timeout 방지

### 5. 검색 쿼리 limit 감소
- 초기 검색 limit을 50으로 감소 (기존: `maxCandidatesBeforeRerank`)
- fallback anchor keywords 검색도 50으로 제한
- timeout 방지 및 성능 개선

## ✅ 확인된 항목

### input_key UNIQUE 제약
- `schema.sql`: `input_key TEXT NOT NULL UNIQUE` 확인됨
- `migrations/add_reports_table.sql`: 동일한 제약 확인됨

### onConflict 설정
- `/api/analyze`에서 `onConflict: "input_key"` 사용 중
- 제약과 일치함

## ⚠️ 확인 필요

### 환경변수 설정
- `SUPABASE_SERVICE_ROLE_KEY` 환경변수 설정 확인 필요
- 로컬: `.env.local`에 추가 후 서버 재시작
- Vercel: Project Settings > Environment Variables에 추가 후 재배포

### supplier matches 캐시 unique index
- `migration_fix_supplier_matches_cache.sql` 적용 필요
- Supabase Dashboard > SQL Editor에서 실행

## 테스트 체크리스트

1. 분석 한 번 실행 후 서버 로그 확인:
   - ✅ "Report saved successfully" 또는 "Found existing report, upsert success" 메시지 확인
   - ✅ Supabase 콘솔에서 `reports` 테이블에 row 생성 확인

2. 같은 입력으로 2번 분석:
   - ✅ 같은 `reportId`로 라우팅되는지 확인
   - ✅ "Found existing report" 메시지 확인

3. 존재하지 않는 reportId 접근:
   - ✅ 404 화면 표시 확인
   - ✅ "새 분석 시작하기" 버튼 동작 확인

