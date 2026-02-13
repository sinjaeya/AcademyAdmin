# 로그인 로그 뷰어 페이지 추가

## Context

StudentApp에서 Edge Function `log-login`을 통해 `login_logs` 테이블에 로그인 기록(성공/실패)을 저장하고 있음. 현재 어드민에서 이 기록을 확인할 방법이 없어, 관리자가 학생 로그인 현황을 파악하기 어려움. SETTINGS 하위에 로그인 로그 뷰어 페이지를 추가하여 필터링과 함께 조회 가능하게 함.

## login_logs 테이블 (기존, 변경 없음)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | bigint | PK |
| created_at | timestamptz | 로그 시각 |
| student_id | bigint | 학생 ID (nullable) |
| student_name | text | 학생명 (nullable) |
| email | text | 이메일 (nullable) |
| academy_id | uuid | 학원 ID (nullable) |
| login_type | text | normal / proxy / dev |
| success | boolean | 성공 여부 |
| error_message | text | 실패 시 에러 (nullable) |
| user_agent | text | 브라우저 정보 (nullable) |
| metadata | jsonb | 추가 데이터 (nullable) |
| ip_address | text | IP 주소 (nullable) |

## 변경 파일 (4개)

### 1. `src/types/index.ts` -- LoginLog 타입 추가

파일 끝에 `LoginLog` 인터페이스 추가:
```typescript
export interface LoginLog {
  id: number;
  created_at: string;
  student_id: number | null;
  student_name: string | null;
  email: string | null;
  academy_id: string | null;
  login_type: 'normal' | 'proxy' | 'dev';
  success: boolean;
  error_message: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
}
```

### 2. `src/app/api/admin/login-logs/route.ts` -- API Route (신규)

**참고 패턴**: `src/app/api/admin/payments/route.ts` (학원 격리), `src/app/api/admin/rag/generation-logs/route.ts` (페이지네이션)

- `createServerClient()` + `getServerAcademyId()` + `isServerUserAdmin()` 사용
- 서버사이드 페이지네이션: `select('*', { count: 'exact' })` + `.range()`
- 쿼리 파라미터 필터:
  - `page`, `limit` (기본 30건)
  - `login_type` (normal/proxy/dev)
  - `success` (true/false)
  - `search` (학생명/이메일 ilike 검색)
  - `date_from`, `date_to` (KST 타임존 `+09:00` 적용)
- 학원 격리: `!isAdmin && academyId` 일 때 `.eq('academy_id', academyId)`
- 응답: `{ success, data, count, page, limit, totalPages }`

### 3. `src/app/admin/settings/login-logs/page.tsx` -- 뷰어 페이지 (신규)

**참고 패턴**: `src/app/admin/statistics/student-learning/page.tsx` (필터/검색), `src/app/admin/payments/page.tsx` (테이블)

**UI 구성:**
```
[Card 헤더: "로그인 로그" + 총 N건 + 새로고침]

[필터 바]
  검색(Input) | 로그인 유형(Select) | 성공여부(Select) | 시작일(date) | 종료일(date)

[Table]
  시간 | 학생명 | 이메일 | 유형(Badge) | 결과(Badge) | IP | 에러 | 상세

[페이지네이션: 이전 | N/N | 다음]
```

**Badge 규칙:**
- 유형: normal=기본, proxy=노란색, dev=보라색
- 결과: 성공=초록, 실패=destructive

**상세 다이얼로그:** 행 클릭 시 Dialog로 user_agent, metadata(JSON), 전체 정보 표시

**상태 관리:** useState + fetch + useEffect (기존 패턴 일관성)

### 4. `src/components/layout/AdminSidebar.tsx` -- 메뉴 추가

**변경 1:** import에 `LogIn` 추가 (line 36 근처):
```typescript
import { ..., History, RefreshCw, LogIn } from 'lucide-react';
```

**변경 2:** `settingsSubMenus` 배열에 항목 추가 (line 165 뒤):
```typescript
{ name: '로그인 로그', href: '/admin/settings/login-logs', icon: LogIn, requiredPermission: PERMISSION_IDS.ACADEMY_SETTINGS, liteVisible: false }
```

- 권한: `ACADEMY_SETTINGS` (학원 설정 접근 가능한 관리자만)
- liteVisible: false (full 학원 전용)
- 아이콘: `LogIn` (History는 이미 RAG 로그보기에서 사용 중)

## 구현 순서

1. 타입 정의 (types/index.ts)
2. API Route 생성 (api/admin/login-logs/route.ts)
3. 페이지 생성 (admin/settings/login-logs/page.tsx)
4. 사이드바 메뉴 추가 (AdminSidebar.tsx)

## 검증

1. `npm run build` -- 타입/빌드 에러 없음
2. `/api/admin/login-logs` 직접 호출 -- JSON 응답 확인
3. 필터 테스트: `?login_type=normal`, `?success=false`, `?search=홍`
4. `/admin/settings/login-logs` 접속 -- 테이블, 필터, 페이지네이션, 상세 다이얼로그
5. 사이드바에서 설정 > 로그인 로그 메뉴 노출 확인
