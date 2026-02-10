# 학원 타입(Academy Type) 시스템 도입

> 학원별로 제공 기능/메뉴를 다르게 하기 위한 타입 시스템
> 생성일: 2026-02-06

## Context

현재 시스템은 **역할(role)** 기반으로만 메뉴 접근을 제어한다. 하지만 학원 자체의 성격에 따라 기능 범위가 달라야 한다:
- 전체 기능을 사용하는 학원 (`full`)
- 문해력(국어) 앱만 사용하는 간단 버전 학원 (`lite`)

향후 full 학원이 과목을 선택적으로 사용하는 경우도 대비한다 (`enabled_subjects` - 이번에는 미구현).

## 학원 타입별 메뉴

| 메뉴 | full | lite |
|------|:----:|:----:|
| 대시보드 | O | O |
| 실시간 국어 (v2) | O | O |
| 레벨테스트 | O | O |
| 학생 관리 | O | O |
| 카톡 발송 | O | O |
| 학습리포트 | O | O |
| 지문가이드 | O | O |
| 설정 > 사용자 관리 | O | O |
| 내손내줄 실시간 | O | - |
| 등/하원 조회 | O | - |
| 학습관리 (서브메뉴) | O | - |
| 통계 | O | - |
| 콘텐츠/RAG 관리 | O | - |
| 학원비수납 | O | - |
| 설정 > 변수/학원/권한 | O | - |

## 구현 단계

### Step 1: DB 마이그레이션
- `academy` 테이블에 `type` 컬럼 추가 (`text NOT NULL DEFAULT 'full'`)
- ENUM 대신 text + CHECK 제약 사용 (확장 용이)
- 기존 학원 모두 `full`로 자동 설정
- **supabase-db 에이전트에게 위임**

### Step 2: 타입 정의 수정
- **`src/types/index.ts`**
  - `AcademyType = 'full' | 'lite'` 타입 추가
  - `Academy` interface에 `type?: AcademyType` 추가
  - `User` interface에 `academy_type?: AcademyType | null` 추가

### Step 3: Auth 스토어 수정
- **`src/store/auth.ts`**
  - `AuthState`에 `academyType: string | null` 추가
  - `login()`: `result.user.academy_type` 저장
  - `setUser()`: `user?.academy_type` 저장
  - `logout()`: `academyType: null`
  - `initializeAuth()`: `state.user.academy_type` 복원
  - `partialize`: `academyType` 추가 (localStorage 영속화)

### Step 4: 로그인 API 수정
- **`src/app/api/auth/login/route.ts`**
  - `admin_users` select에 `academy:academy_id ( type )` JOIN 추가
  - 응답에 `academy_type` 필드 포함
  - `academy_id`가 null이면 `academy_type`도 null

### Step 5: 서버 사이드 인증 수정
- **`src/lib/auth/server-context.ts`**
  - `getServerUserContext()` 내 academy select에 `type` 추가 (라인 36~47)
  - `getServerAcademyType()` 헬퍼 함수 추가

### Step 6: 사이드바 메뉴 필터링
- **`src/components/layout/AdminSidebar.tsx`**
  - `NavigationItem` interface에 `liteVisible?: boolean` 플래그 추가
  - 각 메뉴에 `liteVisible: true/false` 설정 (lite에서 보일 메뉴만 true)
  - `useAuthStore`에서 `academyType` 가져오기
  - `filteredCategories` 계산 시 academyType 필터링 AND 조합
  - admin 역할은 academyType 제한 무시
  - 설정 하위 메뉴도 동일 적용 (사용자 관리만 lite 허용)

### Step 7: 학원 관리 UI + API
- **`src/components/admin/AcademyManagement.tsx`** (확인 필요)
  - 학원 추가/수정 폼에 타입 Select 추가
  - 학원 카드에 타입 배지 표시 (FULL/LITE)
- **`src/app/api/admin/academy/route.ts`** - POST에 type 필드 처리
- **`src/app/api/admin/academy/[id]/route.ts`** - PUT에 type 필드 처리

## 수정 파일 목록

| 파일 | 변경 |
|------|------|
| (마이그레이션 SQL) | 신규 |
| `src/types/index.ts` | AcademyType, Academy, User 수정 |
| `src/store/auth.ts` | academyType 상태 추가 |
| `src/app/api/auth/login/route.ts` | academy JOIN + academy_type 응답 |
| `src/lib/auth/server-context.ts` | type select 추가 + getServerAcademyType() |
| `src/components/layout/AdminSidebar.tsx` | liteVisible 플래그 + academyType 필터링 |
| `src/components/admin/AcademyManagement.tsx` | type 필드 UI |
| `src/app/api/admin/academy/route.ts` | POST type 처리 |
| `src/app/api/admin/academy/[id]/route.ts` | PUT type 처리 |

## 주의사항

1. **하위 호환**: 기존 localStorage의 `auth-storage`에 academyType이 없음 → null이면 `full`로 취급
2. **admin 무제한**: admin 역할은 academyType 제한 무시 (전체 오너)
3. **UI 레벨만**: 사이드바 메뉴 숨김으로 제어. API 레벨 보호는 향후 추가
4. **향후 확장**: `enabled_subjects` JSONB 컬럼으로 full 학원의 과목 선택 지원 (이번 미구현)

## 검증 방법

1. `npm run type-check` 통과 확인
2. lite 학원으로 로그인 → 사이드바에 허용 메뉴만 표시되는지 확인
3. full 학원으로 로그인 → 기존과 동일하게 전체 메뉴 표시 확인
4. admin으로 로그인 → academyType 무관하게 전체 메뉴 표시 확인
5. 학원 관리에서 타입 변경 가능한지 확인
