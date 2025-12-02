# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 필수 규칙

- **모든 응답은 한글로 작성**
- **코드 주석도 한글로 작성**

## 프로젝트 개요

학원관리 시스템 - Next.js 15 기반 어드민 대시보드. 학원, 학생, 결제, 출결 관리. 대상 사용자: 10명 이하 (학원 관리자, 강사, 튜터).

## 명령어

```bash
npm run dev          # 개발 서버 실행 (Turbopack)
npm run build        # 프로덕션 빌드 (Turbopack)
npm run lint         # ESLint 검사
npm run lint:fix     # ESLint 자동 수정
npm run type-check   # TypeScript 타입 검사
npm run db:studio    # Prisma Studio 실행
npm run pwa:icons    # PWA 아이콘 생성
```

## 아키텍처

### 기술 스택
- **프레임워크**: Next.js 15 (App Router), React 19, TypeScript 5
- **데이터베이스**: Supabase (PostgreSQL) + Prisma ORM
- **상태관리**: Zustand (localStorage 키: `auth-storage`)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS 4 + Lucide icons
- **폼**: React Hook Form + Zod 유효성 검증

### 주요 디렉토리
- `src/app/admin/` - 어드민 페이지 (대시보드, 사용자, 학생, 결제 등)
- `src/app/api/` - API 라우트 (RESTful, 응답 형식: `{ success, data, message, error }`)
- `src/components/ui/` - shadcn/ui 컴포넌트
- `src/lib/permissions.ts` - 역할 기반 접근 제어 (5분 캐시)
- `src/store/auth.ts` - Zustand 인증 스토어
- `scripts/` - SQL 스크립트 및 설정 유틸리티

### 데이터베이스 프로젝트 ID
Supabase 프로젝트: `mhorwnwhcyxynfxmlhit`

## 코딩 규칙

### 네이밍 규칙
- 파일명: kebab-case (`student-list.tsx`)
- 컴포넌트: PascalCase (`StudentList`)
- 함수/변수: camelCase (`getStudentList`)
- 상수: UPPER_SNAKE_CASE (`MAX_STUDENTS`)

### TypeScript
- `any` 타입 사용 금지
- 모든 함수에 명시적 반환 타입 지정
- Props는 interface로 정의

### 컴포넌트
- 함수형 컴포넌트만 사용
- Server Component 우선, 필요시에만 `'use client'` 사용
- 파일당 하나의 컴포넌트

## 데이터베이스 테이블 생성

**반드시 Supabase MCP를 사용하여 마이그레이션을 직접 적용** - SQL 스크립트만 작성하지 말 것.

절차:
1. `scripts/` 디렉토리에 SQL 스크립트 작성
2. `mcp_supabase_apply_migration`으로 적용
3. 성공 후 TypeScript 타입 업데이트

**모든 테이블 필수 사항:**
- 테이블 한글 주석: `COMMENT ON TABLE ... IS '한글 설명';`
- 모든 컬럼 한글 주석: `COMMENT ON COLUMN ... IS '한글 설명';`

## UI 패턴

### 사용자 피드백 - 브라우저 alert 금지
```typescript
// ❌ 금지
alert(), confirm(), prompt()

// ✅ 필수 - 메시지는 Toast 사용
import { useToast } from '@/components/ui/toast';
const { toast } = useToast();
toast({ type: 'success', description: '작업 완료' }); // success, error, warning, info

// ✅ 필수 - 확인 다이얼로그는 Dialog 사용
import { Dialog, DialogContent, ... } from '@/components/ui/dialog';
```

### 커서 스타일
모든 클릭 가능한 요소에 `cursor-pointer` 클래스 필수. Button, DialogTrigger, SelectTrigger는 기본 포함됨.

## Git 제한사항

**AI는 git 작업을 직접 수행하지 않음** - 명시적 요청 시에만 예외:
- ✅ 허용: `git tag -a <name> -m "한글 메시지"` (한글 메시지 필수)
- ✅ 허용: `git checkout <tag-name>`
- ❌ 금지: commit, push, pull, merge, rebase, branch, stash

그 외 git 작업은 사용자가 직접 수행하도록 안내.

## 환경변수

`.env.local` 필수 설정:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
