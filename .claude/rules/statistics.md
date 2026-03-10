---
paths:
  - "src/app/**/statistics*"
  - "src/app/**/kakao-report*"
  - "src/app/**/study-reports*"
  - "src/components/admin/LearningTable*"
  - "src/components/admin/LearningDetail*"
  - "src/app/**/learning/korean2*"
---

# 통계/리포트 규칙

## test_type 값 목록

### test_session 테이블
- `word_pang` — 단어팡
- `passage_quiz` — 보물찾기
- `handwriting` — 내손내줄
- `sentence_clinic_v2` — 문장클리닉 v2

### test_result 테이블 (sentence_clinic_v2 세분화)
- `sc_v2_cloze` — 빈칸
- `sc_v2_comprehension` — 이해
- `sc_v2_inference` — 추론
- `sc_v2_relation` — 관계

> **주의**: `sentence_clinic` (v1)은 레거시 — 새 코드에서 절대 사용 금지, `sentence_clinic_v2` 사용

## 정답률 계산 방식

| 모듈 | 계산식 |
|------|--------|
| word_pang | `accuracy_rate` 평균 (세션별) |
| passage_quiz | `accuracy_rate` 평균 (세션별) |
| sentence_clinic_v2 | `correct_count / total_items` (total_items=4 고정) |
| handwriting | `correct_count / total_items` |

## 알려진 버그 (백로그)

일부 통계/달력 API에서 `sentence_clinic`(v1)만 필터링하여 v2 데이터 누락.
수정 시 필터에 `sentence_clinic_v2`도 반드시 포함할 것.

## 카카오 리포트

- 학생별 특정 날짜의 학습 세션 집계 → 리포트 텍스트 생성
- 모듈별 정답률, 학습 시간, 완료 여부 포함

## 학습 달력 (LearningTable)

- 월별 학생×일자 히트맵 구조
- API와 페이지가 서버/클라이언트 2벌로 분리되어 있음
- 수정 시 두 벌 모두 확인 필요
