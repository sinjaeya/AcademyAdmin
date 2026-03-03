# 데이터 모델 레퍼런스

> 테이블 구조, 필드, ENUM 타입 확인 시 참조. DB 작업, 학생 관리, 폼 구현 시 트리거.

## 주요 테이블

| 테이블 | 설명 | 주요 FK |
|--------|------|---------|
| `student` | 학생 정보 | `academy_id` → `academy` |
| `academy` | 학원 정보 (type: full/lite) | - |
| `payment` | 수납 내역 | `student_id` → `student` |
| `settings` | 시스템 변수 (name, value) | - |
| `users` | 관리자/강사 | `academy_id` → `academy` |
| `test_session` | 학습 세션 | `student_id`, `academy_id` |
| `test_result` | 문제별 결과 | `session_id` → `test_session` |
| `role_permissions` | 역할별 권한 | - |
| `check_in_out` | 출입 기록 | `student_id` |
| `handwriting_progress` | 필기 진행 상태 | `student_id`, `session_id` |
| `level_test_session` | 레벨테스트 세션 | `student_id` → `student` |
| `level_test_result` | 레벨테스트 개별 답안 | `session_id` → `level_test_session` |

## student 테이블 주요 필드

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGINT | PK |
| `name` | VARCHAR | 학생 이름 |
| `phone_number` | VARCHAR | 핸드폰 번호 |
| `phone_middle_4` | VARCHAR | 핸드폰 중간 4자리 (자동 추출) |
| `school` | VARCHAR | 학교명 |
| `grade` | VARCHAR | 학년 (초1~고3) |
| `parent_phone` | VARCHAR | 학부모 연락처 |
| `parent_type` | ENUM | 보호자 유형 |
| `academy_id` | FK | 소속 학원 |
| `status` | VARCHAR | 재원 상태 |
| `sentence_level` | ENUM | 문장학습레벨 |
| `rubric_grade_level` | ENUM | 루브릭 학년 레벨 |
| `rubric_difficulty_level` | ENUM | 루브릭 난이도 레벨 |

## 주요 ENUM 타입

**sentence_level** (`grade_level_type`): `Lv1_Elem5` ~ `Lv9_CSAT` (라벨: Lv1 초5 ~ Lv9 수능)

**rubric_grade_level**: `middle`, `high` (중학교, 고등학교)

**rubric_difficulty_level**: `medium`, `advanced`, `highest`, `extreme`, `high_mock_1`, `high_mock_2`, `high_mock_3`, `csat` (중급 ~ 수능)

**parent_type**: `엄마`, `아빠`, `할아버지`, `할머니`, `기타`

**status** (재원 상태): `재원`, `휴원`, `해지`

**academy_type** (text + CHECK): `full` (전체 기능), `lite` (문해력 앱)

## level_test_session 주요 필드

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | PK |
| `student_id` | INT | FK → student.id |
| `status` | VARCHAR | in_progress / completed / abandoned |
| `results` | JSONB | 영역별 결과 (vocab, sentence, reading, suneung, overall) |
| `recommended_level` | VARCHAR(20) | 추천 레벨 (Lv3_Mid1 ~ Lv7_High2) |
| `elapsed_seconds` | INT | 총 소요 시간 |

### 추천 레벨 산출 방식 (2026-03 변경)

- **이전**: CAT 평균 난이도(avgDifficulty) 기반 — 상하급 모두 수렴하여 변별력 없음
- **현재**: 영역별 정답률 + Bayesian 문항수 보정 + 가중 평균
  - Bayesian 보정: `adjusted = (correct + 2.5) / (total + 5)` (소수 문항 과대평가 방지)
  - 가중치: vocab=1.0, sentence=1.5, reading=2.0, suneung=2.5
  - score = Σ(adjusted × weight) / Σ(weight)
  - 구간: `<0.63` → Lv3_Mid1, `<0.74` → Lv4_Mid2, `<0.84` → Lv5_Mid3, `<0.92` → Lv6_High1, `>=0.92` → Lv7_High2
- AcademyAdmin은 DB에서 `recommended_level` 읽기만 하므로 **코드 변경 없음, 자동 호환**

## 참고

- ENUM 옵션과 라벨 매핑: `src/config/constants.ts`
- 타입 정의: `src/types/index.ts`
- 레벨테스트 타입/유틸: `src/types/level-test.ts`
