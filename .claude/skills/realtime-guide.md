# Supabase Realtime 가이드

> Realtime 구독, 실시간 모니터링, KST 시간 처리 시 참조. Student App 연동 작업 시 트리거.

## 공유 문서 (Student-Admin)

`/home/sinjaeya/Source/.ai_context/specs/Student_Admin/`

| 문서 | 내용 |
|------|------|
| `REALTIME_SPEC.md` | Supabase Realtime 통신 스펙 (postgres_changes, 채널 구조) |
| `DB_SCHEMA.md` | 공유 테이블 구조 (handwriting_progress, test_session 등) |
| `HANDWRITING_FLOW.md` | 내손내줄 학습/모니터링 Phase별 흐름 |

## Realtime 구독 패턴

```typescript
const channel = supabase
  .channel('realtime-learning')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'test_session',
    filter: `academy_id=eq.${academyId}`
  }, (payload) => {
    // INSERT, UPDATE, DELETE 처리
  })
  .subscribe();

// 컴포넌트 언마운트 시 정리
return () => { supabase.removeChannel(channel); };
```

주요 실시간 테이블: `test_session`, `test_result`, `handwriting_progress`, `check_in_out`

## KST 타임존 패턴

모든 실시간 기능에서 UTC→KST 변환 사용:

```typescript
const getKSTDateString = (date: Date): string => {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kstDate.toISOString().split('T')[0];
};
```

API 날짜 필터링 시에도 KST 기준으로 당일 범위 계산 필수.

## 커스텀 훅

- `useRealtimeKorean` — Supabase Realtime으로 `test_session`/`test_result` 변경 실시간 수신, KST 날짜 필터링
- `useStudentPresence` — Supabase Presence로 학생 접속 상태 추적
- `use-mobile` — 반응형 모바일 감지
