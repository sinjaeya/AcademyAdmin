---
paths:
  - "src/app/**/handwriting*"
---

# 내손내줄 (Fabric.js 필기) 규칙

## Fabric.js 캔버스 관리

- `fabricCanvasRef`로 인스턴스 참조 유지
- 컴포넌트 언마운트 시 `dispose()` 반드시 호출 (메모리 누수 방지)
- 캔버스 크기 변경 시 `setDimensions()` 사용

## 실시간 드로잉 동기화

- Supabase Realtime으로 학생↔선생님 캔버스 양방향 동기화
- `handwriting_progress` 테이블: 학생 학습 진행 상태 추적 (실시간 모니터링 표시용)

## 세션 삭제 시 FK 순서

반드시 이 순서로 삭제:
1. `handwriting_canvas`
2. `test_result`
3. `test_session`

## 퀴즈 유형 (sort_order 고정)

| sort_order | 유형 |
|-----------|------|
| 1 | 사실확인 |
| 2 | 사실확인 |
| 3 | 추론 |
| 4 | [보기] |
| 5 | 단어 |

sort_order는 변경하면 안 됨 — 학생앱과 어드민이 이 순서에 의존.

## 레벨 컬럼 분리

- `handwriting_level`: `student` 테이블의 별도 컬럼
- `sentence_level`과 독립적으로 관리 (혼용 금지)

## 메모리 관리 (학생앱)

1지문 완료마다 페이지 새로고침으로 Fabric.js 메모리 초기화.
(canvas dispose만으로 메모리 완전 해제 불가)
