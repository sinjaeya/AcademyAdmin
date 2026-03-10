---
paths:
  - "src/app/**/schools*"
  - "src/app/**/homework*"
  - "src/app/**/concept-learning*"
  - "src/app/**/unit-exam*"
  - "src/app/**/exam-schedule*"
  - "src/components/admin/UnitExamDetail*"
  - "src/components/admin/ConceptLearningDetail*"
  - "src/components/admin/ExamScheduleForm*"
  - "src/components/admin/UnitTreeCheckbox*"
---

# 내신 모듈 규칙

## Phase 구조

| Phase | 기능 | 테이블 |
|-------|------|--------|
| Phase 1 | 학교 관리 + 교재 매핑 | `schools`, `school_grade_textbook` |
| Phase 2 | 단어팡 숙제 | `homework_assignment`, `homework_word_set` |
| Phase 3 | 개념확인 Leitner | `concept_learning_session`, `concept_learning_card` |
| Phase 4 | 단원평가 | `test_session` (test_type='unit_test') |
| Phase 5 | 시험기간 관리 | `exam_schedule` |
| Phase 6 | 중간/기말 평가 | 대기 |

## 테이블 관계 (교재 계층)

```
schools
  → school_grade_textbook (school_id, grade, textbook_id)
    → naesin_textbook
      → naesin_chapter
        → naesin_subchapter
          → naesin_unit
```

## exam_schedule 제약

- **UNIQUE**: `school_id + grade + exam_type + year + semester`
- `scope_unit_ids`: 시험범위 단원 ID 배열 (naesin_unit.id 참조)

## D-7 숙제 중단 규칙

시험 시작 7일 전부터 해당 school_id + grade 조합의 단어팡 숙제를 자동 차단.
숙제 배정 API에서 exam_schedule 조회 후 D-7 이내면 배정 거부.

## 단원평가 세트 구조

`test_session.metadata`에 저장:
```json
{
  "textbook_id": "...",
  "chapter_id": "...",
  "subchapter_id": "...",
  "set_number": 1
}
```

## 개념확인 (Leitner 알고리즘)

- 간격 반복 기반 플래시카드 학습
- `concept_learning_session.metadata`에 `textbook_id`, `unit_ids` 저장
- 카드 레벨에 따라 복습 간격 자동 조정
