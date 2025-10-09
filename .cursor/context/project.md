# 프로젝트 컨텍스트

## 프로젝트 개요
**학원 관리 시스템** - Next.js 15, TypeScript, Supabase 기반의 현대적인 학원 관리 플랫폼

## 주요 기능 모듈

### 1. 학생 관리
- 학생 정보 CRUD (이름, 연락처, 학년, 등록일 등)
- 학부모 정보 관리 (연락처, 관계)
- 학생별 수강 과목 조회
- 검색/필터링 (이름, 학년, 상태)

### 2. 등/하원 관리 (출결)
- 일일 출결 체크 (등원/하원 시간 기록)
- 결석/지각/조퇴 사유 입력
- 출결 통계 및 리포트
- 학부모 알림 연동 (향후)

### 3. 학습 관리 (성적)
- 시험/과제 성적 입력
- 과목별 성적 추이 그래프
- 학생별 성적표 생성
- 평균/순위 자동 계산

### 4. 수업/강의 관리
- 수업 스케줄 관리
- 강사-수업 배정
- 수업별 학생 명단
- 교실/시간 배정

### 5. 결제 내역 관리
- 월별 수강료 관리
- 납부/미납 상태 추적
- 결제 내역 조회 (날짜, 학생, 금액)
- 미납자 리스트 및 알림

### 6. 강사 관리
- 강사 정보 CRUD
- 담당 수업 배정
- 근무 스케줄 관리
- 급여 정보 (Owner/Admin만)

### 7. 단어 관리
- 단어 정보 CRUD (단어는 숙제로 나가기 때문에 관리 필요)
- 

### 7. 숙제 관리
- 숙제 정보 CRUD
- 숙제에는 숙제 및 학생과 연동동


## 사용자 플로우
1. **로그인 (필수 첫 페이지)** - Supabase Auth
2. **로그인 후 → 대시보드** - 권한별 맞춤 위젯
3. **주요 기능 접근** - 사이드바 네비게이션, 권한 기반 접근

## 현재 구현 상태
- ✅ 로그인 시스템 (Supabase Auth)
- 🔄 권한 시스템 구현 중
- 📋 학생 관리 (CRUD) - 일부 구현
- 📅 등/하원 관리 - 학습리포트 페이지 구현됨
- 📚 학습 관리 (성적) - 학습리포트 기능 구현됨
- 💰 결제 관리 - 미구현
- 👨‍🏫 강사 관리 - 미구현
- 🏫 수업 관리 - 미구현
- 📊 대시보드 위젯 - 미구현
- 🔔 알림 시스템 - 향후 계획

## 기술 스택 상세
- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **State Management**: React hooks, Zustand
- **Icons**: Lucide React
- **Forms**: React Hook Form, Zod validation

## 개발 환경
- **Node.js**: 최신 LTS 버전
- **Package Manager**: npm
- **Development**: Turbopack 사용 (`--turbopack` 플래그)
- **Linting**: ESLint 9
- **Type Checking**: TypeScript 컴파일러