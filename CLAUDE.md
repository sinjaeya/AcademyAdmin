# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 필수 규칙

- **모든 응답은 한글로 작성**
- **코드 주석도 한글로 작성**

## 프로젝트 개요

학원관리 시스템 - Next.js 15 기반 어드민 대시보드. 학원, 학생, 결제, 출결 관리. 대상 사용자: 10명 이하 (학원 관리자, 강사, 튜터).

## 명령어

```bash
# 개발
npm run dev          # 개발 서버 실행 (Turbopack)
npm run build        # 프로덕션 빌드 (Turbopack)
npm run lint         # ESLint 검사
npm run lint:fix     # ESLint 자동 수정
npm run type-check   # TypeScript 타입 검사

# 데이터베이스
npm run db:studio    # Prisma Studio 실행
npm run db:generate  # Prisma 타입 생성
npm run db:push      # DB 스키마 푸시
npm run db:migrate   # 마이그레이션 실행

# 기타
npm run pwa:icons    # PWA 아이콘 생성
npm run setup        # Supabase 초기 설정
npm run clean        # .next, node_modules 삭제
npm run fresh        # clean + npm install
```

## 아키텍처

### 기술 스택
- **프레임워크**: Next.js 15 (App Router), React 19, TypeScript 5
- **데이터베이스**: Supabase (PostgreSQL) + Prisma ORM
- **상태관리**: Zustand (localStorage 키: `auth-storage`)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS 4 + Lucide icons
- **폼**: React Hook Form + Zod 유효성 검증

### 주요 디렉토리
- `src/app/admin/` - 어드민 페이지
  - `students/`, `payments/` - 학생/결제 관리
  - `learning/` - 실시간 학습 모니터링 (국어, 수학, 실시간 뷰)
  - `statistics/` - 학습 통계 (문장클리닉, 학생별)
  - `contents/` - 콘텐츠 관리 (지문, 단어팡, 문장클리닉)
  - `teacher/` - 선생님 도구 (지문 가이드)
  - `settings/` - 시스템 설정 (변수, 권한, 학원, 사용자)
- `src/app/api/` - API 라우트 (RESTful, 응답 형식: `{ success, data, message, error }`)
- `src/components/ui/` - shadcn/ui 컴포넌트
- `src/config/constants.ts` - 모든 ENUM 옵션과 라벨 정의
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

### 금지 사항
- `localStorage`/`sessionStorage` 직접 사용 금지 (Zustand persist 또는 Supabase session 사용)
- 컴포넌트에서 직접 DB 쿼리 금지 (`lib/supabase` 함수 사용)
- 하드코딩된 권한 체크 금지 (`lib/permissions.ts` 통해서만)

### 권한 카테고리
`students`, `payments`, `users`, `academy`, `reports` - 권한 추가 시 해당 카테고리 사용

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

## 데이터 모델

### 주요 테이블
- `student` - 학생 정보 (이름, 연락처, 학교, 학년, 학습레벨 등)
- `academy` - 학원 정보
- `payment` - 학원비 수납 내역
- `settings` - 시스템 변수 관리 (name, value 컬럼)
- `users` - 관리자/강사 사용자

### student 테이블 주요 필드
| 필드명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGINT | PK |
| `name` | VARCHAR | 학생 이름 |
| `phone_number` | VARCHAR | 핸드폰 번호 |
| `phone_middle_4` | VARCHAR | 핸드폰 중간 4자리 (자동 추출) |
| `school` | VARCHAR | 학교명 |
| `grade` | VARCHAR | 학년 (초1~고3) |
| `parent_phone` | VARCHAR | 학부모 연락처 |
| `parent_type` | ENUM | 보호자 유형 |
| `academy_id` | FK | 소속 학원 |
| `status` | VARCHAR | 재원 상태 |
| `sentence_level` | ENUM | 문장학습레벨 |
| `rubric_grade_level` | ENUM | 루브릭 학년 레벨 |
| `rubric_difficulty_level` | ENUM | 루브릭 난이도 레벨 |

### 주요 ENUM 타입

**sentence_level (문장학습레벨)** - `grade_level_type`
```
Lv1_Elem5, Lv2_Elem6, Lv3_Mid1, Lv4_Mid2, Lv5_Mid3, Lv6_High1, Lv7_High2, Lv8_High3, Lv9_CSAT
```
라벨: Lv1 초5 ~ Lv9 수능

**rubric_grade_level (루브릭 학년)**
```
middle, high
```
라벨: 중학교, 고등학교

**rubric_difficulty_level (루브릭 난이도)**
```
medium, advanced, highest, extreme, high_mock_1, high_mock_2, high_mock_3, csat
```
라벨: 중급, 고급, 최고급, 극상급, 고1~3 모의고사, 수능

**parent_type (보호자 유형)**
```
엄마, 아빠, 할아버지, 할머니, 기타
```

**status (재원 상태)**
```
재원, 휴원, 해지
```


## 주요 API 엔드포인트

| 그룹 | 엔드포인트 | 설명 |
|------|-----------|------|
| 학생 | `/api/admin/students`, `/api/admin/students/[id]` | CRUD (status 파라미터로 필터링) |
| 결제 | `/api/admin/payments`, `/api/admin/payments/[id]` | 수납 내역 CRUD |
| 학습 | `/api/admin/learning/realtime`, `/api/admin/learning/realtime/[id]` | 실시간 학습 모니터링 |
| 콘텐츠 | `/api/admin/contents/passages`, `/api/admin/contents/word-pang`, `/api/admin/contents/sentence-clinic` | 지문/단어/문장 관리 |
| 통계 | `/api/admin/statistics/sentence-clinic`, `/api/admin/statistics/student-learning` | 학습 통계 |
| 학원 | `/api/admin/academy`, `/api/admin/academy/[id]` | 학원 CRUD |
| 설정 | `/api/admin/settings`, `/api/admin/permissions` | 변수/권한 관리 |

### API 응답 형식
```typescript
// 성공
{ success: true, data: any, message: string }

// 실패
{ error: string }
```

### API 보안 규칙
- 모든 API Route에서 권한 검증 필수
- SQL 인젝션 방지를 위한 파라미터화된 쿼리 사용
- 민감 데이터는 Admin/Owner만 접근 가능
- 로그에 개인정보 기록 금지

## 환경변수

`.env.local` 필수 설정:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
