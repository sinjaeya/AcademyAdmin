# AcademyAdmin React 성능 최적화 플랜

> react-best-practices 규칙 기반 프로젝트 분석 결과
> 생성일: 2026-01-19

---

## 요약

| 카테고리 | 발견된 이슈 | 우선순위 | 예상 개선 효과 |
|---------|-----------|---------|--------------|
| 워터폴 제거 | 8개 | CRITICAL | 300-600ms |
| 번들 최적화 | 4개 | CRITICAL | ~1.4MB 감소 |
| 서버 성능 | 8개 | HIGH | 1000ms → 200ms |
| 리렌더 최적화 | 6개 | MEDIUM | 30-50% 렌더링 감소 |
| 렌더링/JS 성능 | 7개 | MEDIUM | 50-70% 스크롤 개선 |
| 고급 패턴 | 4개 | LOW | 안정성 향상 |

---

## Phase 1: 즉시 개선 (1주)

### 1.1 워터폴 제거 - API 병렬화

#### Task 1-1: 학생 API JOIN 통합 ✅ 완료 (2026-01-19)
**파일**: `src/app/api/admin/students/route.ts`

**분석 결과**: Promise.all 병렬화보다 **Supabase JOIN**이 더 효과적
- 현재: 2쿼리 순차 (students → payments)
- ~~플랜: 2쿼리 병렬 (Promise.all)~~
- **최종: 1쿼리 JOIN**

```typescript
// ❌ 현재 (2쿼리 순차)
const { data: students } = await query.order('created_at', { ascending: false });
const studentIds = students.map(s => s.id);
const { data: payments } = await supabase.from('payment').select('student_id').in('student_id', studentIds);

// ✅ 개선 (1쿼리 JOIN)
const { data: students } = await supabase
  .from('student')
  .select(`
    *,
    academy:academy_id (id, name),
    current_month_payment:payment!left (student_id)
  `)
  .eq('academy_id', academyId)
  .eq('current_month_payment.study_month', currentMonthStr)
  .order('created_at', { ascending: false });

// hasPaidThisMonth는 current_month_payment 존재 여부로 판단
```

**변경 사항**:
1. payment 조회 쿼리 제거
2. student 조회에 LEFT JOIN으로 payment 포함
3. `paidStudentIds` Set 로직 → `current_month_payment` 존재 여부로 대체

**예상 개선**: 100-150ms (2쿼리→1쿼리)

#### Task 1-2: 결제 API JOIN 활용
**파일**: `src/app/api/admin/payments/route.ts`

```typescript
// ✅ Supabase JOIN으로 단일 쿼리
const { data: payments } = await supabase
  .from('payment')
  .select(`*, student:student_id (id, name)`)
  .order('payment_date', { ascending: false });
```

**예상 개선**: 100-150ms

#### Task 1-3: 클라이언트 페이지 병렬 fetch
**파일**: `src/app/admin/students/page.tsx`, `src/app/admin/payments/page.tsx`

```typescript
// ✅ useEffect 내 병렬 실행
useEffect(() => {
  Promise.all([fetchStudents(), fetchAcademies()]).catch(console.error);
}, []);
```

**예상 개선**: 100-200ms/페이지

---

### 1.2 번들 최적화 - Dynamic Import

#### Task 1-4: Fabric.js 동적 로드 (최우선)
**파일**: `src/app/admin/handwriting/live/[studentId]/page.tsx`

```typescript
// ❌ 현재
import * as fabric from 'fabric';  // ~2MB

// ✅ 개선
const HandwritingCanvas = dynamic(
  () => import('@/components/admin/HandwritingCanvas'),
  { loading: () => <CanvasLoading />, ssr: false }
);
```

**예상 개선**: 600KB 번들 감소

#### Task 1-5: Recharts 동적 로드
**파일**: 3개 파일
- `src/app/admin/level-test/report/[sessionId]/page.tsx`
- `src/app/admin/statistics/student-learning/page.tsx`
- `src/components/admin/LevelTestDetailDialog.tsx`

```typescript
// ✅ 차트 컴포넌트 분리 후 lazy import
const ChartSection = lazy(() => import('./ChartSection'));

<Suspense fallback={<ChartSkeleton />}>
  <ChartSection data={data} />
</Suspense>
```

**예상 개선**: 800KB 번들 감소

#### Task 1-6: next.config.ts 최적화 설정
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-icons'],
  },
};
```

---

### 1.3 SELECT * 제거

#### Task 1-7: 17개 API 파일 수정
필요한 컬럼만 명시적으로 선택

```typescript
// ❌ 현재
.select('*')

// ✅ 개선
.select('id, name, email, status, created_at')
```

**대상 파일**:
- [ ] `src/app/api/admin/academy/route.ts`
- [ ] `src/app/api/admin/permissions/route.ts`
- [ ] `src/app/api/admin/settings/route.ts`
- [ ] `src/app/api/admin/checkinout/route.ts`
- [ ] `src/app/api/admin/payments/route.ts`
- [ ] `src/app/api/admin/level-test/[sessionId]/route.ts`
- [ ] 기타 11개

**예상 개선**: 20-40% 대역폭 절감

---

## Phase 2: 서버 성능 (2주)

### 2.1 실시간 학습 API 통합 (최우선)

#### Task 2-1: RPC 함수 작성
**파일**: `scripts/migrations/get_realtime_learning_data.sql`

```sql
CREATE OR REPLACE FUNCTION get_realtime_learning_data(
  p_academy_id UUID,
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP
) RETURNS JSON AS $$
  -- test_session, student, test_result 통합 조회
  -- 12개 쿼리 → 1개로 통합
$$ LANGUAGE plpgsql;
```

**파일**: `src/app/api/admin/learning/realtime/route.ts`
- 현재: 12개 쿼리, ~1000-2000ms
- 목표: 1개 RPC, ~200-300ms

**예상 개선**: 800-1700ms

#### Task 2-2: 상태 집계 쿼리 통합
**파일**: `src/app/api/admin/contents/passages/route.ts`

```sql
-- 5개 상태별 쿼리 → 1개 GROUP BY
SELECT qa_status, COUNT(*) as count
FROM passage
GROUP BY qa_status;
```

**예상 개선**: 500ms

### 2.2 React.cache() 적용

#### Task 2-3: 학습 데이터 캐싱
**파일**: `src/app/admin/learning/page.tsx`

```typescript
import { cache } from 'react';

const getLearningData = cache(async (year: number, month: number) => {
  // 동일 요청 내 중복 호출 방지
});
```

### 2.3 권한 캐싱 개선

#### Task 2-4: 학원별 캐시 분리
**파일**: `src/lib/permissions.ts`

```typescript
// ❌ 현재: 전역 캐시
let permissionCache: Record<string, string[]> = {};

// ✅ 개선: 학원별 캐시
const cacheByAcademy = new Map<string, { data: string[], time: number }>();
```

---

## Phase 3: 리렌더 최적화 (2주)

### 3.1 필기 모니터링 리팩토링

#### Task 3-1: useEffect 통합
**파일**: `src/app/admin/handwriting/live/[studentId]/page.tsx`

현재 10개 useEffect → 3-4개로 통합:
1. 초기화 + 정리
2. Realtime 구독
3. 캔버스 설정
4. 드로잉 로드

#### Task 3-2: 상태 분리
```typescript
// UI 상태 → Context로 분리
const DrawingToolContext = createContext(null);

// 데이터 상태만 컴포넌트에서 관리
const [quizzes, setQuizzes] = useState<Quiz[]>([]);
```

#### Task 3-3: useCallback 의존성 수정
```typescript
// ❌ 현재
const refetchProgressData = useCallback(async () => {
  // progressInfo 참조
}, [studentId]); // progressInfo 누락

// ✅ 개선
const refetchProgressData = useCallback(async () => {
  // progressInfo 참조
}, [studentId, progressInfo?.passageId]);
```

### 3.2 학습 테이블 최적화

#### Task 3-4: ElapsedTime 메모이제이션
**파일**: `src/components/admin/RealtimeKoreanV2.tsx`

```typescript
// 100개 컴포넌트가 1분마다 동시 업데이트 방지
const ElapsedTime = React.memo(({ onlineAt }: { onlineAt: string }) => {
  // ...
});

const StudentRow = React.memo(({ summary, ... }) => {
  // ...
}, (prev, next) => prev.summary.records.length === next.summary.records.length);
```

### 3.3 의존성 체인 제거

#### Task 3-5: useCallback → 직접 useEffect
**파일**: `src/app/admin/learning/study-screenshots/page.tsx`

```typescript
// ❌ 현재
const fetchScreenshots = useCallback(async () => {...}, [selectedStudentId, selectedDate, students]);
useEffect(() => { fetchScreenshots(); }, [fetchScreenshots]);

// ✅ 개선
useEffect(() => {
  if (!selectedStudentId || !selectedDate) return;
  const load = async () => { /* fetch 로직 */ };
  load();
}, [selectedStudentId, selectedDate]);
```

---

## Phase 4: 렌더링/JS 성능 (1주)

### 4.1 content-visibility 적용

#### Task 4-1: 학습 테이블 최적화
**파일**: 3개
- `src/components/admin/LearningTable.tsx`
- `src/components/admin/LearningTableKorean.tsx`
- `src/components/admin/MathLearningTable.tsx`

```typescript
<tr style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 50px' }}>
  {/* 셀 렌더링 */}
</tr>
```

**예상 개선**: 50-70% 스크롤 성능

### 4.2 정적 상수 호이스팅

#### Task 4-2: 배열/객체 외부 이동
```typescript
// 컴포넌트 외부로 이동
const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'] as const;
const SENTENCE_LEVEL_LABELS: Record<string, string> = { ... } as const;
```

### 4.3 배열 메서드 최적화

#### Task 4-3: .toSorted() 적용
**파일**: `src/app/admin/statistics/student-learning/page.tsx`

```typescript
// ❌ 현재
const sorted = [...arr].sort((a, b) => ...);

// ✅ 개선 (ES2023)
const sorted = arr.toSorted((a, b) => ...);
```

---

## Phase 5: 고급 패턴 (선택)

### 5.1 useLatest 훅 도입

#### Task 5-1: 커스텀 훅 생성
**파일**: `src/hooks/useLatest.ts`

```typescript
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref;
}
```

#### Task 5-2: 필기 모니터링 적용
**파일**: `src/app/admin/handwriting/live/[studentId]/page.tsx`

```typescript
const saveTeacherDrawingsLatest = useLatest(saveTeacherDrawings);

canvas.on('path:created', () => {
  saveTeacherDrawingsLatest.current();
});
```

---

## 실행 체크리스트

### Phase 1 (1주) - CRITICAL
- [ ] Task 1-1: 학생 API 병렬화
- [ ] Task 1-2: 결제 API JOIN
- [ ] Task 1-3: 클라이언트 병렬 fetch
- [ ] Task 1-4: Fabric.js 동적 로드
- [ ] Task 1-5: Recharts 동적 로드
- [ ] Task 1-6: next.config.ts 설정
- [ ] Task 1-7: SELECT * 제거 (17개 파일)

### Phase 2 (2주) - HIGH
- [ ] Task 2-1: 실시간 학습 RPC 함수
- [ ] Task 2-2: 상태 집계 쿼리 통합
- [ ] Task 2-3: React.cache() 적용
- [ ] Task 2-4: 권한 캐싱 개선

### Phase 3 (2주) - MEDIUM
- [ ] Task 3-1: useEffect 통합
- [ ] Task 3-2: 상태 분리 (Context)
- [ ] Task 3-3: useCallback 의존성 수정
- [ ] Task 3-4: ElapsedTime 메모이제이션
- [ ] Task 3-5: 의존성 체인 제거

### Phase 4 (1주) - MEDIUM
- [ ] Task 4-1: content-visibility 적용
- [ ] Task 4-2: 정적 상수 호이스팅
- [ ] Task 4-3: .toSorted() 적용

### Phase 5 (선택) - LOW
- [ ] Task 5-1: useLatest 훅 생성
- [ ] Task 5-2: 필기 모니터링 적용

---

## 측정 방법

### 번들 크기
```bash
npm run build
# .next/static/chunks/ 폴더 크기 비교
```

### API 응답 시간
```typescript
// 각 API에 측정 로그 추가
const start = Date.now();
// ... 쿼리 실행 ...
console.log(`[API] ${endpoint}: ${Date.now() - start}ms`);
```

### 렌더링 성능
- React DevTools Profiler
- Chrome Performance 탭

---

## 예상 결과

| 지표 | 현재 | 목표 | 개선율 |
|-----|------|-----|-------|
| 초기 번들 | ~3MB | ~1.6MB | 47% |
| 학생 페이지 로드 | ~800ms | ~300ms | 63% |
| 실시간 API | ~1500ms | ~300ms | 80% |
| 학습 테이블 스크롤 | 프레임 드롭 | 60fps | - |
| 필기 모니터링 리렌더 | 빈번 | 50% 감소 | 50% |
