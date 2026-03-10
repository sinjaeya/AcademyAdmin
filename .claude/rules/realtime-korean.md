---
paths:
  - "src/hooks/useRealtime*"
  - "src/hooks/useStudentPresence*"
  - "src/components/admin/RealtimeKorean*"
  - "src/types/realtime-korean.ts"
  - "src/app/**/realtime*"
  - "src/components/admin/WordPangDetailDialog*"
---

# 실시간 한국어 학습 모니터링 규칙

## Supabase Realtime 채널 구조

- **test_session 채널**: INSERT/UPDATE 이벤트 구독
  - 필터: `test_type=in.(word_pang,passage_quiz,handwriting,sentence_clinic_v2)`
- **test_result 채널**: INSERT 이벤트 구독
  - 필터: `test_type=in.(word_pang,passage_quiz,handwriting,sc_v2_cloze,sc_v2_comprehension,sc_v2_inference,sc_v2_relation)`
- **check_in_board 채널**: 학생 등원/퇴원 추적

## LearningRecord 타입 핵심 필드

```typescript
id: `ts_${sessionId}`   // 고유 식별자
studentId: string
learningType: 'word_pang' | 'passage_quiz' | 'handwriting' | 'sentence_clinic_v2'
startedAt: string
completedAt: string | null
totalItems: number
correctCount: number
accuracyRate: number
```

## 모듈별 상세 타입

- **word_pang**: `correctWords[]`, `wrongWords[]`, `wordResults[]`
- **passage_quiz**: `passageQuizDetails[]` (PassageQuizDetail)
- **sentence_clinic_v2**: `sentenceClinicV2Detail` (SentenceClinicV2Detail) — quizzes 배열 4개
- **handwriting**: `handwritingDetail` (passageCode, passageId, quizzes[])

## StudentSummary 정답률 계산

- **wordPang**: correctWords 기반 (wordCounts 미사용)
- **passageQuiz**: passageQuizDetails 기반
- **sentenceClinic**: `correctCount / (count * 4) * 100`
- **handwriting**: totalItems / correctCount 기반

## 학생 정렬 순서

체크아웃 미완료(상단) → 등원시간순 → 이름순 → studentId

## UPDATE 이벤트 처리

UPDATE 이벤트 수신 시 payload를 직접 사용하지 말고 DB에서 fresh data 재조회.
(Realtime payload에 변경 전/후 데이터가 불완전하게 포함될 수 있음)

## 주의사항

- `sentence_clinic_v2`의 `accuracy_rate`는 최근에야 학생앱에서 설정하기 시작
- 과거 데이터는 NULL 가능 → null 체크 필수
