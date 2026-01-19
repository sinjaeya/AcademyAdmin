# DB 스키마 캐시

> 이 파일은 supabase-db 에이전트가 자동으로 관리합니다.
> 스키마 에러 발생 시 에이전트가 DB에서 최신 정보를 조회하여 업데이트합니다.
> 마지막 업데이트: 2026-01-18

---

## student (학생 정보)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | bigint | NO | **PK** |
| `created_at` | timestamptz | NO | |
| `name` | varchar | YES | 학생 이름 |
| `phone_number` | varchar | YES | 핸드폰 번호 |
| `school` | text | YES | 학교명 |
| `grade` | text | YES | 학년 (초1~고3) |
| `parent_phone` | varchar | YES | 학부모 연락처 |
| `birth_date` | date | YES | 생년월일 |
| `phone_middle_4` | varchar | YES | 핸드폰 중간 4자리 |
| `currentAcademy` | text | YES | (deprecated) |
| `status` | text | YES | 재원 상태 (재원/휴원/해지) |
| `email` | text | YES | 이메일 |
| `auth_user_id` | uuid | YES | FK → auth.users |
| `is_app_registered` | boolean | YES | 앱 등록 여부 |
| `password` | text | YES | 임시 비밀번호 |
| `parent_type` | USER-DEFINED | NO | 보호자 유형 enum |
| `study_time` | text | YES | 학습 시간 (기본 60분) |
| `rubric_grade_level` | USER-DEFINED | YES | 루브릭 학년 레벨 enum |
| `rubric_difficulty_level` | USER-DEFINED | YES | 루브릭 난이도 레벨 enum |
| `academy_id` | uuid | YES | FK → academy.id |
| `sentence_level` | USER-DEFINED | YES | 문장학습레벨 enum |
| `handwriting_preferences` | jsonb | YES | 필기 환경설정 |
| `level_test_completed` | boolean | YES | 레벨테스트 완료 여부 |
| `level_test_completed_at` | timestamptz | YES | 레벨테스트 완료 시각 |
| `level_test_session_id` | uuid | YES | FK → level_test_session.id |

---

## academy (학원 정보)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | uuid | NO | **PK** |
| `name` | text | NO | 학원명 |
| `address` | text | YES | 주소 |
| `phone` | text | YES | 연락처 |
| `email` | text | YES | 이메일 |
| `website` | text | YES | 웹사이트 |
| `description` | text | YES | 설명 |
| `logo_url` | text | YES | 로고 URL |
| `settings` | jsonb | YES | 학원 설정 |
| `is_active` | boolean | YES | 활성화 여부 |
| `created_at` | timestamptz | YES | |
| `updated_at` | timestamptz | YES | |
| `solapi_api_key` | text | YES | Solapi API 키 |
| `solapi_api_secret` | text | YES | Solapi API 시크릿 |
| `solapi_pf_id` | text | YES | Solapi 플러스친구 ID |
| `solapi_from_number` | text | YES | Solapi 발신번호 |
| `solapi_template_checkin` | text | YES | 체크인 템플릿 |
| `solapi_template_checkout` | text | YES | 체크아웃 템플릿 |
| `solapi_template_checkout2` | text | YES | 체크아웃 템플릿2 |

---

## payment (학원비 수납)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | uuid | NO | **PK** |
| `student_id` | bigint | NO | FK → student.id |
| `payer_name` | text | YES | 납부자 이름 |
| `amount` | integer | NO | 수납 금액 |
| `payment_date` | timestamptz | YES | 수납 날짜 |
| `payment_method` | USER-DEFINED | NO | 결제 방법 enum |
| `cash_receipt_issued` | boolean | YES | 현금영수증 발행 여부 |
| `academy_id` | uuid | YES | FK → academy.id |
| `created_at` | timestamptz | YES | |
| `updated_at` | timestamptz | YES | |
| `study_month` | USER-DEFINED | NO | 수강 월 enum |

---

## test_session (학습 세션)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | bigint | NO | **PK** |
| `student_id` | integer | NO | FK → student.id |
| `test_type` | varchar(20) | NO | 학습 유형 (word_pang, sentence_clinic, passage_quiz, handwriting) |
| `total_items` | integer | NO | 총 문항 수 |
| `started_at` | timestamptz | NO | 시작 시각 (기본: now()) |
| `completed_at` | timestamptz | YES | 완료 시각 |
| `correct_count` | integer | YES | 정답 수 (기본: 0) |
| `accuracy_rate` | numeric | YES | 정답률 |
| `metadata` | jsonb | YES | 메타데이터 (keyword, passage_id, is_review 등) |
| `created_at` | timestamptz | NO | 기본: now() |
| `updated_at` | timestamptz | NO | 기본: now() |
| `duration_seconds` | integer | YES | 소요 시간 (초) |

---

## test_result (학습 결과 상세)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | bigint | NO | **PK** |
| `session_id` | bigint | NO | FK → test_session.id |
| `student_id` | integer | NO | FK → student.id |
| `test_type` | varchar | NO | 학습 유형 (word_pang, passage_quiz, handwriting, sc_cloze, sc_keyword) |
| `item_id` | integer | YES | 문항 ID (레거시) |
| `item_uuid` | uuid | YES | 문항 UUID (passage_id 등) |
| `is_correct` | boolean | NO | 정답 여부 |
| `selected_answer` | integer | YES | 선택한 답 |
| `correct_answer` | integer | NO | 정답 |
| `answered_at` | timestamptz | NO | 답변 시각 (기본: now()) |
| `created_at` | timestamptz | NO | 기본: now() |

---

## handwriting_progress (내손내줄 진행 상황)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | uuid | NO | **PK** |
| `student_id` | bigint | NO | FK → student.id |
| `passage_id` | uuid | NO | FK → passage.id |
| `passage_code` | text | YES | 지문 코드 |
| `canvas_data` | jsonb | YES | Fabric.js 캔버스 데이터 |
| `answers` | jsonb | YES | 학습 답안 |
| `started_at` | timestamptz | YES | 시작 시각 |
| `updated_at` | timestamptz | YES | 최종 업데이트 시각 |
| `is_watched` | boolean | YES | 모니터링 중 여부 |
| `watcher_heartbeat` | timestamptz | YES | 관리자 하트비트 |

---

## check_in_board (출결 체크)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | bigint | NO | **PK** |
| `created_at` | timestamptz | NO | |
| `student_Id` | bigint | YES | FK → student.id (주의: 대소문자) |
| `check_in_time` | timestamptz | YES | 체크인 시각 |
| `check_out_time` | timestamptz | YES | 체크아웃 시각 |
| `duration` | time | YES | 학습 시간 |
| `check_in_status` | USER-DEFINED | YES | 체크인 상태 enum |
| `student_name` | varchar | YES | 학생 이름 |
| `current_academy` | text | YES | 학원명 |
| `academy_id` | uuid | YES | FK → academy.id |

---

## settings (시스템 변수)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | bigint | NO | **PK** |
| `name` | text | YES | 변수명 |
| `value` | text | YES | 변수값 |
| `created_at` | timestamptz | NO | |

---

## admin_users (관리자/강사 사용자)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | uuid | NO | **PK** |
| `email` | varchar(255) | NO | 이메일 |
| `password_hash` | text | NO | 암호화된 비밀번호 |
| `name` | text | NO | 이름 |
| `role_id` | text | YES | FK → roles.id |
| `academy_id` | uuid | YES | FK → academy.id |
| `academy_name` | text | YES | 학원명 |
| `is_active` | boolean | YES | 활성화 여부 |
| `created_at` | timestamptz | YES | |
| `updated_at` | timestamptz | YES | |

---

## roles (역할 정의)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | text | NO | **PK** (owner, admin, teacher 등) |
| `name` | text | NO | 역할명 |
| `description` | text | YES | 설명 |
| `level` | integer | NO | 권한 레벨 |
| `is_active` | boolean | YES | 활성화 여부 |
| `created_at` | timestamptz | YES | |

---

## permissions (권한 정의)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | text | NO | **PK** (category:action 형식) |
| `category` | text | NO | 카테고리 (students, payments 등) |
| `action` | text | NO | 액션 (read, create, update, delete) |
| `name` | text | NO | 권한명 |
| `description` | text | YES | 설명 |
| `display_order` | integer | YES | 표시 순서 |
| `created_at` | timestamptz | YES | |

---

## passage (지문)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `passage_id` | uuid | NO | **PK** |
| `batch_id` | uuid | YES | 배치 ID |
| `task_id` | uuid | YES | 작업 ID |
| `author_id` | uuid | YES | 작성자 ID |
| `rubric_grade_level` | USER-DEFINED | YES | 루브릭 학년 레벨 |
| `rubric_difficulty_level` | USER-DEFINED | YES | 루브릭 난이도 레벨 |
| `domain_id` | text | YES | 도메인 ID |
| `category_id` | text | YES | 카테고리 ID |
| `sub_id` | text | YES | 하위 ID |
| `keyword_id` | bigint | YES | 키워드 ID |
| `keyword_list` | ARRAY | YES | 키워드 리스트 |
| `content` | text | NO | 지문 본문 |
| `char_count` | integer | YES | 문자 수 |
| `paragraph_count` | integer | YES | 문단 수 |
| `prompt_text` | text | YES | 프롬프트 텍스트 |
| `prompt_template` | text | YES | 프롬프트 템플릿 |
| `model_name` | text | YES | 생성 모델명 |
| `qa_status` | USER-DEFINED | NO | QA 상태 |
| `qa_notes` | text | YES | QA 노트 |
| `metadata` | jsonb | YES | 메타데이터 |
| `created_at` | timestamptz | NO | |
| `updated_at` | timestamptz | NO | |
| `code_id` | char | NO | 지문 코드 (A0019 등) |

---

## passage_quiz_ox (OX 문제)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `quiz_id` | uuid | NO | **PK** (⚠️ id 아님!) |
| `passage_id` | uuid | NO | FK → passage.id |
| `information_summary` | text | NO | 정보 요약 |
| `information_importance` | text | NO | 정보 중요도 |
| `information_category` | text | NO | 정보 카테고리 |
| `information_quality_score` | integer | NO | 정보 품질 점수 |
| `quiz_order` | integer | NO | 문제 순서 (0부터) |
| `statement` | text | NO | 문제 내용 |
| `answer` | text | NO | 정답 (O/X) |
| `evidence` | text | NO | 근거 |
| `reasoning` | text | NO | 추론 |
| `ox_type` | USER-DEFINED | NO | 문제 유형 enum |
| `difficulty_level` | integer | NO | 난이도 |
| `created_at` | timestamptz | NO | |
| `updated_at` | timestamptz | NO | |
| `is_common_knowledge` | boolean | YES | 상식 여부 |
| `review_reason` | text | YES | 검토 사유 |
| `reviewed_at` | timestamptz | YES | 검토 시각 |

---

## passage_quiz_choice (객관식 문제)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | uuid | NO | **PK** |
| `passage_id` | uuid | YES | FK → passage.id |
| `quiz_order` | integer | NO | 문제 순서 |
| `question_type` | text | NO | 문제 유형 |
| `question` | text | NO | 문제 내용 |
| `choice_1` | text | NO | 선택지 1 |
| `choice_2` | text | NO | 선택지 2 |
| `choice_3` | text | NO | 선택지 3 |
| `choice_4` | text | NO | 선택지 4 |
| `choice_5` | text | NO | 선택지 5 |
| `answer` | integer | NO | 정답 번호 (1~5) |
| `explanation` | text | YES | 해설 |
| `difficulty_level` | integer | YES | 난이도 |
| `model_name` | text | YES | 생성 모델명 |
| `created_at` | timestamptz | YES | |
| `updated_at` | timestamptz | YES | |

---

## level_test_session (레벨테스트 세션)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | uuid | NO | **PK** |
| `student_id` | integer | NO | FK → student.id |
| `status` | varchar(20) | NO | 진행 상태 (in_progress 등) |
| `started_at` | timestamptz | NO | 시작 시각 |
| `completed_at` | timestamptz | YES | 완료 시각 |
| `elapsed_seconds` | integer | YES | 경과 시간 (초) |
| `initial_difficulty` | integer | NO | 초기 난이도 |
| `current_difficulty` | jsonb | YES | 현재 난이도 (영역별) |
| `progress` | jsonb | YES | 진행률 (영역별) |
| `results` | jsonb | YES | 결과 데이터 |
| `recommended_level` | varchar(20) | YES | 추천 레벨 |
| `created_at` | timestamptz | YES | |

---

## level_test_result (레벨테스트 결과)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | uuid | NO | **PK** |
| `session_id` | uuid | NO | FK → level_test_session.id |
| `student_id` | integer | NO | FK → student.id |
| `question_type` | varchar(20) | NO | 문제 유형 (vocab, reading 등) |
| `question_index` | integer | NO | 문제 번호 |
| `item_id` | bigint | YES | 문항 ID (bigint 타입) |
| `item_uuid` | uuid | YES | 문항 UUID |
| `difficulty` | integer | NO | 난이도 |
| `selected_answer` | integer | YES | 선택한 답 |
| `correct_answer` | integer | NO | 정답 |
| `is_correct` | boolean | NO | 정답 여부 |
| `time_spent_ms` | integer | YES | 소요 시간 (ms) |
| `sub_type` | varchar(50) | YES | 하위 유형 |
| `answered_at` | timestamptz | YES | 답변 시각 |
| `category_id` | text | YES | 카테고리 ID |
| `keywords` | ARRAY | YES | 키워드 배열 |

---

## korean_voca (국어 어휘)

| 컬럼 | 타입 | Nullable | 비고 |
|------|------|----------|------|
| `id` | bigint | NO | **PK** |
| `grade` | varchar(10) | NO | 학년 |
| `word` | varchar(100) | NO | 단어 |
| `standard_homograph_number` | bigint | NO | 표준 동음이의어 번호 |
| `part_of_speech` | varchar(50) | NO | 품사 |
| `word_origin_type` | varchar(50) | NO | 어원 유형 |
| `original_word` | varchar(100) | YES | 원어 |
| `meaning` | text | NO | 뜻 |
| `field` | varchar(100) | NO | 분야 |
| `created_at` | timestamptz | YES | |
| `updated_at` | timestamptz | YES | |
| `first_consonant` | text | YES | 초성 |
| `middle_grade` | smallint | YES | 중학 학년 |
