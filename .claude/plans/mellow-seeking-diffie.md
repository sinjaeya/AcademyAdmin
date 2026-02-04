# 문장클리닉 v2 마이그레이션 계획

## 개요

StudentApp에서 문장클리닉 v2가 배포되어 Admin 사이트도 v2로 전환합니다.
- 기존 v1 내역 유지 불필요
- 깔끔하게 v2로 완전 전환

## v1 → v2 주요 변경점

| 항목 | v1 | v2 |
|------|----|----|
| test_type | `sentence_clinic` | `sentence_clinic_v2` |
| 지문 테이블 | `short_passage` | `short_passage_v2` |
| 퀴즈 테이블 | (지문에 통합) | `short_passage_quiz_v2` (분리) |
| 문제 수 | 2문제 (빈칸, 핵심어) | 4문제 (빈칸, 이해, 추론, 관계) |
| test_result 타입 | `sc_cloze`, `sc_keyword` | `sc_v2_cloze`, `sc_v2_comprehension`, `sc_v2_inference`, `sc_v2_relation` |
| 오답 복습 | 있음 | **없음** |
| 미완료 세션 | 없음 | **있음** (이어하기) |

---

## 수정 파일 목록 (11개)

### 1단계: 타입 정의
- `src/types/realtime-korean.ts`

### 2단계: Hook
- `src/hooks/useRealtimeKorean.ts`

### 3단계: API 라우트
- `src/app/api/admin/learning/realtime/route.ts`
- `src/app/api/admin/contents/sentence-clinic/route.ts`
- `src/app/api/admin/contents/sentence-clinic/[id]/route.ts`
- `src/app/api/admin/statistics/sentence-clinic/route.ts`
- `src/app/api/admin/statistics/student-learning/[studentId]/route.ts`

### 4단계: 컴포넌트/페이지
- `src/components/admin/RealtimeKoreanV2.tsx`
- `src/app/admin/contents/sentence-clinic/page.tsx`

---

## 상세 구현 계획

### 1. 타입 정의 수정 (`src/types/realtime-korean.ts`)

```typescript
// LearningType 변경
export type LearningType = 'word_pang' | 'passage_quiz' | 'sentence_clinic_v2' | 'handwriting';

// SentenceClinicV2Detail 새 인터페이스
export interface SentenceClinicV2Detail {
  passageId: string;
  keyword: string;
  text?: string;
  quizzes: Array<{
    quizOrder: number;
    quizType: 'cloze' | 'comprehension' | 'inference' | 'relation';
    question: string;
    options: string[];
    correctAnswer: number;
    selectedAnswer: number | null;
    isCorrect: boolean | null;
  }>;
}

// StudentSummary에서 reviewCount 제거
sentenceClinic: {
  count: number;
  correctCount: number;
  accuracyRate: number;
  // reviewCount 삭제 (v2에 복습 없음)
};
```

### 2. Hook 수정 (`src/hooks/useRealtimeKorean.ts`)

- test_type 필터: `sentence_clinic` → `sentence_clinic_v2`
- test_result 타입: `sc_v2_*` 4개 타입으로 변경
- `fetchShortPassage` → `short_passage_v2` + `short_passage_quiz_v2` 조인
- `reviewCounts` 상태 및 `refreshReviewCount` 함수 삭제

### 3. 실시간 API 수정 (`src/app/api/admin/learning/realtime/route.ts`)

- test_session 조회: `sentence_clinic` → `sentence_clinic_v2`
- test_result 조회: `sc_v2_*` 4개 타입
- 지문 조회: `short_passage_v2` + `short_passage_quiz_v2`
- 정답률: `/2` → `/4`
- 복습 카운트 로직 전체 삭제

### 4. 콘텐츠 API 수정

**route.ts**:
```typescript
// short_passage_v2 + short_passage_quiz_v2 조인 조회
const { data } = await supabase
  .from('short_passage_v2')
  .select(`
    *,
    short_passage_quiz_v2 (*)
  `)
  .order('created_at', { ascending: false });
```

**[id]/route.ts**:
- 단건 조회/수정/삭제도 v2 테이블로 변경

### 5. 통계 API 수정

**sentence-clinic/route.ts**:
- `short_passage` → `short_passage_v2`

**student-learning/[studentId]/route.ts**:
- test_type 필터: `sentence_clinic` → `sentence_clinic_v2`
- 정답률 계산: `/2` → `/4`

### 6. 컴포넌트 수정 (`RealtimeKoreanV2.tsx`)

- SentenceClinicBadges: 4문제 표시 (빈칸/이해/추론/관계)
- 복습대기 Badge 삭제
- 정답률 계산: `count * 4` 기준

### 7. 콘텐츠 관리 페이지 수정 (`sentence-clinic/page.tsx`)

- v2 스키마에 맞는 UI (4문제 표시)
- relation 타입의 sentence_a, sentence_b 표시

---

## 미완료 세션 처리

- 미완료 세션(`completed_at IS NULL`)은 표시만 함 ("진행중" 배지)
- 삭제 기능은 추후 필요 시 추가

---

## 삭제 대상

1. **복습 관련 전체**
   - `reviewCounts` 상태
   - `refreshReviewCount` 함수
   - 복습대기 Badge UI

2. **v1 전용 코드**
   - `short_passage` 테이블 참조
   - `sc_cloze`, `sc_keyword` test_type

---

## 검증 방법

1. **타입 체크**: `npm run type-check`
2. **빌드**: `npm run build`
3. **실시간 모니터링 테스트**
   - 학생이 문장클리닉 v2 학습 시 실시간 반영 확인
   - 4문제 정답/오답 표시 확인
4. **통계 페이지 테스트**
   - 레벨별 통계가 v2 테이블 기준으로 표시되는지 확인
5. **콘텐츠 관리 테스트**
   - v2 지문 목록 조회
   - 4문제 상세 표시

---

## 예상 작업량

- 타입 정의: 1개 파일
- Hook: 1개 파일 (복잡)
- API: 5개 파일
- 컴포넌트/페이지: 2개 파일
- **총 9개 파일 수정**
