# 대시보드 리디자인 플랜 ✅ 완료

> 더미 데이터 → 실제 데이터 기반 역할별 대시보드
> 생성일: 2026-02-06
> 완료일: 2026-02-06

## 현재 상태 (문제점)

### 더미 데이터 컴포넌트 3개
- `src/components/admin/DashboardStats.tsx` - 하드코딩 통계 (총 사용자 2,543 등)
- `src/components/admin/QuickActions.tsx` - 존재하지 않는 페이지 링크 (문서 생성, 이메일 발송 등)
- `src/components/admin/RecentActivity.tsx` - 샘플 활동 로그
- 메인 페이지: `src/app/admin/page.tsx` (Server Component)

### 권한 미통합
- 사이드바는 권한 체크하지만, 대시보드 컴포넌트는 역할 구분 없음

## 역할 체계 (3단계)

| 역할 | role_id | 범위 | 핵심 관심사 |
|------|---------|------|------------|
| 전체 오너 | `admin` | 전체 학원 | 전체 현황, 학원별 비교, 매출 |
| 학원장 | `academy_owner` | 소속 학원 | 내 학원 학생, 출결, 수납 |
| 선생님 | `teacher` | 소속 학원 | 오늘 학습현황, 출결 |

## 역할별 대시보드 카드 구성

### 1. admin (전체 오너)
- **전체 학원 수** / **전체 학생 수** (재원/휴원/해지 breakdown)
- **학원별 학생 수 비교** (간단한 바 차트 or 테이블)
- **이번 달 전체 수납 현황** (총액, 완납/미납)
- **오늘 전체 학습 세션 수** (국어/수학/문장클리닉별)
- **최근 등록 학생 목록** (최근 5~10명)

### 2. academy_owner (학원장)
- **내 학원 학생 수** (재원/휴원/해지 breakdown)
- **오늘 출석 현황** (등원/하원, check_in_out 테이블)
- **이번 달 수납 현황** (완납/미납 금액)
- **오늘 학습 세션 현황** (국어/수학/문장클리닉별 완료/진행중)
- **최근 활동 로그** (학생 등록, 수납 등)

### 3. teacher (선생님)
- **오늘 출석 학생 수**
- **현재 학습 중인 학생** (실시간 세션)
- **오늘 학습 완료 세션 수**
- **빠른 작업 바로가기** (실시간 모니터링 등)

## QuickActions 역할별 구성

### admin
- 학원관리 (`/admin/settings/academies`)
- 사용자관리 (`/admin/settings/users`)
- 권한관리 (`/admin/settings/permissions`)
- 통계 (`/admin/statistics`)

### academy_owner
- 학생관리 (`/admin/students`)
- 수납관리 (`/admin/payments`)
- 실시간 모니터링 (`/admin/learning/realtime-korean2`)
- 통계 (`/admin/statistics`)

### teacher
- 실시간 국어 (`/admin/learning/realtime-korean2`)
- 내손내줄 실시간 (`/admin/handwriting/live`)
- 지문가이드 (`/admin/teacher/passage-guide`)

## 구현 단계

### Step 1: 대시보드 API 생성 ✅
- `GET /api/admin/dashboard` 엔드포인트 생성
- role_id, academy_id 기반 통계 데이터 반환
- Promise.all 병렬 쿼리, KST 날짜 처리

### Step 2: 대시보드 페이지 리팩토링 ✅
- `DashboardContent.tsx` 클라이언트 래퍼 생성
- useAuthStore에서 role_id, academy_id 사용

### Step 3: DashboardStats 리팩토링 ✅
- 하나의 컴포넌트에서 `getStatsForRole(data)` 함수로 분기
- admin 4카드 / academy_owner 4카드 / teacher 3카드

### Step 4: QuickActions 리팩토링 ✅
- 역할별 액션 목록 정의, 실제 라우트만 연결
- `/admin/settings/academy` 경로 수정 완료

### Step 5: RecentActivity 리팩토링 ✅
- admin/academy_owner: 최근 등록 학생 목록
- teacher: 오늘 학습 요약

## 관련 파일

### 수정 대상
- `src/app/admin/page.tsx` - 메인 페이지
- `src/components/admin/DashboardStats.tsx` - 통계 카드
- `src/components/admin/QuickActions.tsx` - 빠른 작업
- `src/components/admin/RecentActivity.tsx` - 최근 활동

### 새로 생성
- `src/app/api/admin/dashboard/route.ts` - 대시보드 데이터 API

### 참조
- `src/store/auth.ts` - role_id, academy_id
- `src/lib/permissions.ts` - 권한 체크
- `src/components/layout/AdminSidebar.tsx` - 메뉴 구조 참고

## 활용 가능한 기존 테이블
- `student` - 학생 수, 상태별 카운트
- `payment` - 수납 현황
- `test_session` - 학습 세션
- `check_in_out` - 출결
- `academy` - 학원 목록
- `admin_users` - 사용자 수

## Supabase 프로젝트
- Project ID: `mhorwnwhcyxynfxmlhit`
