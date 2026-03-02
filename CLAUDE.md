# CLAUDE.md

## 필수 규칙

- **모든 응답은 한글로 작성**
- **코드 주석도 한글로 작성**

## 프로젝트 개요

학원관리 시스템 - Next.js 16 기반 어드민 대시보드. 학원, 학생, 결제, 출결 관리. 대상 사용자: 10명 이하. Student App과 Supabase Realtime으로 실시간 통신.

## 환경

- **OS**: WSL/Linux, **루트**: `/home/sinjaeya/Source/AcademyAdmin`
- **공유 컨텍스트**: `/home/sinjaeya/Source/.ai_context/`
- 한글/공백 포함 경로는 반드시 **큰따옴표**로 감싸기

## 명령어

```bash
npm run dev          # 개발 서버 (Turbopack)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 검사
npm run type-check   # TypeScript 타입 검사
npm run db:generate  # Prisma 타입 생성
npm run db:push      # DB 스키마 푸시
```

## 기술 스택

Next.js 16 (App Router) + React 19 + TypeScript 5 | Supabase (PostgreSQL) + Prisma ORM | Supabase Realtime (postgres_changes + presence) | Zustand (`auth-storage`) + React Query | shadcn/ui + Radix UI + MUI DataGrid + Tailwind CSS 4 | React Hook Form + Zod | Fabric.js (내손내줄) | PWA (프로덕션만)

## 디렉토리 구조

- `src/app/admin/` — 어드민 페이지 (students, payments, learning, handwriting, statistics, contents, teacher, settings)
- `src/app/api/` — API 라우트 (응답: `{ success, data, message, error }`)
- `src/components/ui/` — shadcn/ui
- `src/config/constants.ts` — ENUM 옵션/라벨 정의
- `src/types/` — 타입 (`index.ts`, `realtime-korean.ts`)
- `src/store/auth.ts` — Zustand 인증 스토어
- `src/hooks/` — 커스텀 훅
- `src/lib/permissions.ts` — 역할 기반 접근 제어 (5분 캐시)
- `src/lib/supabase/client.ts` — `supabase` (anon) / `supabaseAdmin` (service role)

## 인증 흐름

1. `layout.tsx`: ToastProvider → AuthProvider → children
2. `AuthProvider`: `initializeAuth()` 호출
3. `ProtectedRoute`: `hasHydrated` 대기 후 인증 체크
4. `useAuthStore`: Zustand persist (`auth-storage`)
5. `permissions.ts`: `role_permissions` 테이블, 5분 캐시

핵심: `hasHydrated === true` 전까지 인증 체크 안 함 (SSR/CSR 불일치 방지)

## 코딩 규칙

- 파일명: kebab-case | 컴포넌트: PascalCase | 함수/변수: camelCase | 상수: UPPER_SNAKE_CASE
- `any` 타입 사용 금지, Props는 interface로 정의
- 함수형 컴포넌트만, Server Component 우선
- `localStorage` 직접 사용 금지 (Zustand persist만 허용)
- 컴포넌트에서 직접 DB 쿼리 금지 (`lib/supabase` 함수 사용)
- 하드코딩된 권한 체크 금지 (`lib/permissions.ts` 통해서만)
- 권한 카테고리: `students`, `payments`, `users`, `academy`, `reports`

## UI 패턴

- `alert()`/`confirm()` 금지 → Toast(`useToast`) + Dialog 사용
- 클릭 가능한 요소에 `cursor-pointer` 필수

## DB 작업

- DB 작업은 **supabase-db 에이전트에 위임** (직접 `execute_sql` 금지)
- 프로젝트 ID: `mhorwnwhcyxynfxmlhit`
- 테이블 생성: `scripts/`에 SQL → `apply_migration` → TypeScript 타입 업데이트
- 모든 테이블/컬럼에 한글 주석 필수

## API 응답 형식

```typescript
{ success: true, data: T, message?: string }  // 성공
{ success: false, error: string }              // 실패
```

- 모든 API Route에서 권한 검증 필수, 파라미터화된 쿼리, 로그에 개인정보 금지

## Git 제한사항

AI는 git 작업을 직접 수행하지 않음 (명시적 요청 시 tag/checkout만 허용)

## 환경변수

`.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — `src/lib/env.ts`에서 검증
