# 실시간 국어 v2 - 단어 클릭 시 상세 팝업 구현

## 목표
학생이 학습 중인 단어 뱃지 클릭 → 단어 상세 정보(의미, 선지, 정답) 팝업 → 수정/삭제 기능

## 수정 파일

### 1. `src/types/realtime-korean.ts`
- `wordResults` 타입에 `vocaId: number` 필드 추가

### 2. `src/hooks/useRealtimeKorean.ts`
- `fetchSessionWords` 함수: 반환값에 `vocaId` 포함
- 실시간 핸들러: 단어 추가 시 `vocaId` 포함

### 3. `src/components/admin/WordPangDetailDialog.tsx` (신규)
- 단어 상세 정보 조회 및 표시
- 수정/삭제 기능 (기존 word-pang/page.tsx 로직 재사용)
- Props: `open`, `onOpenChange`, `vocaId`, `word`, `onUpdate`

### 4. `src/components/admin/RealtimeKoreanV2.tsx`
- `WordPangBadges`: `onWordClick` prop 추가, Badge에 클릭 이벤트
- 메인 컴포넌트: Dialog 상태 관리 및 렌더링

## 구현 순서
1. 타입 수정 (realtime-korean.ts)
2. 훅 수정 (useRealtimeKorean.ts) - vocaId 데이터 흐름
3. Dialog 컴포넌트 생성 (WordPangDetailDialog.tsx)
4. RealtimeKoreanV2.tsx 수정 - 클릭 이벤트 및 Dialog 연동

## 검증
- 단어 뱃지 클릭 → 팝업 표시 확인
- 선지, 정답, 해설 표시 확인
- 수정 후 저장 → toast 메시지 확인
- 삭제 → 확인 다이얼로그 → 삭제 완료 확인
