# 전역 개발 규칙

## 필수 규칙
- **모든 응답은 한글로 작성**
- **코드 주석도 한글로 작성**

## 프로젝트 개요
- **목적**: 학원 관리 시스템 (제한된 사용자 10명 이하)
- **타겟**: 학원 관리자, 강사, 튜터
- **특징**: 권한 기반 접근 제어, 학생/수업/출결/결제 통합 관리

## 기술 스택
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: React hooks + Zustand
- **Icons**: Lucide React

## 코딩 규칙

### 네이밍 컨벤션
- **파일명**: kebab-case (예: `student-list.tsx`, `attendance-table.tsx`)
- **컴포넌트명**: PascalCase (예: `StudentList`, `AttendanceTable`)
- **함수/변수**: camelCase (예: `getStudentList`, `isLoading`)
- **상수**: UPPER_SNAKE_CASE (예: `MAX_STUDENTS`, `ROLE_PERMISSIONS`)
- **타입/인터페이스**: PascalCase (예: `Student`, `UserRole`)

### TypeScript 규칙
- `any` 타입 사용 금지
- 모든 함수에 명시적 반환 타입 지정
- Props는 interface로 정의
- Supabase 타입은 자동 생성된 타입 사용
- 상수는 `src/config/constants.ts`에서 관리

### 컴포넌트 작성 규칙
- 함수형 컴포넌트만 사용
- Server Component 우선, 필요시 `'use client'`
- 커스텀 훅으로 로직 분리
- 한 파일에 하나의 컴포넌트 원칙
- 모든 주석은 한국어로 작성

### 금지 사항
- `localStorage`/`sessionStorage` 사용 금지 (Supabase session 사용)
- 하드코딩된 권한 체크 (권한 시스템 통해서만)
- 주석 없는 복잡한 로직
- 컴포넌트에서 직접 DB 쿼리 (lib/supabase 함수 사용)