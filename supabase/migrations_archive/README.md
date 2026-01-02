# Archived Migrations

이 폴더의 파일들은 과거 migration 기록입니다.

**현재 사용 중인 스키마**: `../schema.sql`

## ⚠️ 중요

- 이 폴더의 파일들은 **적용하지 마세요**
- 참고용으로만 보관됩니다
- 새 프로젝트는 `schema.sql` 하나만 적용하면 됩니다

## 📜 히스토리

이 파일들은 프로토타입 개발 과정에서 생성된 것들입니다:

- `schema_admin.sql` - 관리자 패널 초기 스키마 (지금은 schema.sql에 통합됨)
- `migration_*.sql` - 증분 변경사항들 (지금은 schema.sql에 모두 반영됨)
- `add_*.sql` - 테이블/기능 추가 (지금은 schema.sql에 모두 반영됨)

## 🚀 현재 프로세스

```
1. 새 DB: schema.sql 적용
2. 변경사항: migrations/YYYYMMDD_description.sql 로 추가
3. 이 폴더: 건드리지 않음
```
