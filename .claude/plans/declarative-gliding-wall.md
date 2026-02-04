# 학생 레벨 체계 분리: handwriting_level 추가

## 개요
`sentence_level` → 문장클리닉 전용 유지, `handwriting_level` → 내손내줄 전용 신규 추가

---

## Phase 0: DB 마이그레이션 (supabase-db 에이전트 위임)

```sql
ALTER TABLE student ADD COLUMN handwriting_level grade_level_type DEFAULT 'Lv3_Mid1';
UPDATE student SET handwriting_level = sentence_level WHERE sentence_level IS NOT NULL;
COMMENT ON COLUMN student.handwriting_level IS '내손내줄 학습 레벨';
COMMENT ON COLUMN student.sentence_level IS '문장클리닉 학습 레벨';
```

## Phase 1: constants.ts 상수 추가

**파일**: `src/config/constants.ts`
- `HANDWRITING_LEVEL_OPTIONS = SENTENCE_LEVEL_OPTIONS` (동일 ENUM 재사용)
- `HANDWRITING_LEVEL_LABELS = SENTENCE_LEVEL_LABELS`
- `type HandwritingLevel = SentenceLevel`

## Phase 2: 학생 관리 UI 수정

**파일**: `src/app/admin/students/page.tsx`
- 타입 3곳: `Student`, `NewStudentForm`, `EditStudentForm`에 `handwriting_level` 추가
- 기본값 4곳: 초기값, 수정 모달 열기, 추가 성공 후 초기화
- API body 1곳: `handleUpdateStudent`
- 테이블: 헤더 + 셀 추가 (내손내줄레벨 Badge)
- 폼 드롭다운 2곳: 추가/수정 다이얼로그에 내손내줄레벨 Select 추가
- 기존 "문장학습레벨" 라벨 → "문장클리닉레벨"로 변경

## Phase 3: API Route 수정

- `src/app/api/admin/students/route.ts` (POST): `handwriting_level` 필드 추가
- `src/app/api/admin/students/[id]/route.ts` (PUT): `handwriting_level` 업데이트 추가

## Phase 4: 통계 API 수정

- `src/app/api/admin/statistics/student-learning/route.ts`: select에 `handwriting_level` 추가
- `src/app/admin/statistics/student-learning/page.tsx`: 타입 + UI 표시

## 수정 불필요

- `src/app/admin/handwriting/live/` — sentence_level 직접 참조 없음 (모니터링만)
- StudentApp — 별도 프로젝트, 이 플랜 범위 밖

## 검증

1. DB 마이그레이션 후 `SELECT id, sentence_level, handwriting_level FROM student LIMIT 5`로 데이터 복사 확인
2. `npm run build`로 빌드 성공 확인
3. 어드민 > 학생관리에서 드롭다운 2개 표시 확인, 각각 독립 저장 확인
