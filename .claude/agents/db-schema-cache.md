# DB 스키마 캐시

> 이 파일은 supabase-db 에이전트가 자동으로 관리합니다.
> 스키마 에러 발생 시 에이전트가 DB에서 최신 정보를 조회하여 업데이트합니다.
> 마지막 업데이트: 2026-01-16

---

## passage

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | uuid | NO | **PK** |
| `code` | text | NO | 지문 코드 (K0125 등) |
| `title` | text | YES | 지문 제목 |
| `content` | text | YES | 지문 본문 |
| `academy_id` | uuid | YES | FK |
| `created_at` | timestamptz | NO | |
| `updated_at` | timestamptz | NO | |

---

## passage_quiz_ox

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `quiz_id` | uuid | NO | **PK** (⚠️ id 아님!) |
| `passage_id` | uuid | NO | FK → passage.id |
| `information_summary` | text | NO | |
| `information_importance` | text | NO | |
| `information_category` | text | NO | |
| `information_quality_score` | integer | NO | |
| `quiz_order` | integer | NO | 문제 순서 (0부터) |
| `statement` | text | NO | 문제 내용 |
| `answer` | text | NO | 정답 (O/X) |
| `evidence` | text | NO | |
| `reasoning` | text | NO | |
| `ox_type` | USER-DEFINED | NO | 문제 유형 enum |
| `difficulty_level` | integer | NO | 난이도 |
| `created_at` | timestamptz | NO | |
| `updated_at` | timestamptz | NO | |
| `is_common_knowledge` | boolean | YES | |
| `review_reason` | text | YES | |
| `reviewed_at` | timestamptz | YES | |

---

## student

> 스키마 정보 없음 - 첫 조회 시 자동 업데이트 예정

---

## test_session

> 스키마 정보 없음 - 첫 조회 시 자동 업데이트 예정

---

## check_in_board

> 스키마 정보 없음 - 첫 조회 시 자동 업데이트 예정

---

## passage_quiz_choice

> 스키마 정보 없음 - 첫 조회 시 자동 업데이트 예정
