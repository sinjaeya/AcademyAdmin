# 학원 시스템 가이드

## 개요
이 시스템은 사용자(관리자)가 로그인했을 때 해당 사용자가 속한 학원 정보를 자동으로 가져와서 서버 사이드에서 지속적으로 사용할 수 있도록 하는 시스템입니다.

## 주요 기능

### 1. 학원 정보 테이블 (academy)
- 학원의 기본 정보를 저장하는 테이블
- 학원명, 주소, 전화번호, 이메일 등 기본 정보 포함
- 각 학원마다 고유한 ID 보유

### 2. 사용자-학원 연결 (user_role 테이블 업데이트)
- 기존 `user_role` 테이블에 `academy_id` 외래키 추가
- 사용자와 학원을 연결하여 어떤 학원에 속하는지 관리

### 3. 서버 사이드 사용자 컨텍스트
- 로그인 시 사용자 정보와 함께 학원 정보를 자동으로 가져옴
- 미들웨어를 통해 모든 요청에 사용자 정보를 헤더로 전달
- 서버 컴포넌트에서 쉽게 사용자 정보와 학원 정보에 접근 가능

## 설치 및 설정

### 1. 데이터베이스 설정
```bash
# 학원 시스템 설정 스크립트 실행
node scripts/setup-academy-system.js
```

### 2. 환경변수 확인
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 사용 방법

### 1. 서버 컴포넌트에서 사용자 정보 가져오기
```typescript
import { getServerUserContext, getServerAcademyId, isServerUserAdmin } from '@/lib/auth/server-context';

export default async function MyPage() {
  const userContext = getServerUserContext();
  const academyId = getServerAcademyId();
  const isAdmin = isServerUserAdmin();
  
  return (
    <div>
      <h1>{userContext?.academy?.name} 대시보드</h1>
      <p>학원 ID: {academyId}</p>
      <p>관리자 권한: {isAdmin ? '있음' : '없음'}</p>
    </div>
  );
}
```

### 2. 학원별 데이터 조회
```typescript
import { getStudentsQuery, getPaymentsQuery } from '@/lib/db/academy-queries';

// 현재 사용자의 학원에 속한 학생만 조회
const studentsQuery = getStudentsQuery();
const { data: students } = await studentsQuery.select('*').order('created_at', { ascending: false });

// 특정 학원의 학생 조회
const { data: specificStudents } = await studentsQuery.selectByAcademy('academy-id-here');

// 모든 학원의 학생 조회 (관리자용)
const { data: allStudents } = await studentsQuery.selectAll();
```

### 3. 새로운 데이터 삽입 시 학원 정보 자동 포함
```typescript
import { getStudentsQuery } from '@/lib/db/academy-queries';

const studentsQuery = getStudentsQuery();

// academy_id가 자동으로 현재 사용자의 학원 ID로 설정됨
const { data, error } = await studentsQuery.insert({
  name: '홍길동',
  grade: '1학년',
  phone: '010-1234-5678'
});
```

## 주요 파일 구조

```
src/
├── lib/
│   ├── auth/
│   │   ├── user-context.ts      # 사용자 컨텍스트 조회 함수
│   │   └── server-context.ts    # 서버에서 헤더로부터 정보 가져오기
│   └── db/
│       └── academy-queries.ts   # 학원별 데이터 조회 헬퍼
├── types/
│   └── index.ts                 # 타입 정의 (Academy, UserRole, ExtendedUser)
└── middleware.ts                # 사용자 정보를 헤더에 추가하는 미들웨어

scripts/
├── create-academy-table.sql     # Academy 테이블 생성
├── update-user-role-table.sql   # User Role 테이블 업데이트
└── setup-academy-system.js     # 전체 설정 스크립트
```

## 데이터베이스 스키마

### Academy 테이블
```sql
CREATE TABLE academy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Role 테이블 (업데이트됨)
```sql
-- 기존 컬럼들...
academy_id UUID REFERENCES academy(id) ON DELETE SET NULL
```

## 보안 및 권한

### RLS (Row Level Security)
- 각 테이블에 RLS 정책이 적용되어 사용자는 자신의 학원 데이터만 접근 가능
- 서비스 역할은 모든 데이터에 접근 가능 (관리자 기능용)

### 미들웨어 보안
- 관리자 페이지 접근 시 자동으로 권한 확인
- 인증되지 않은 사용자는 로그인 페이지로 리다이렉트

## 확장 가능성

### 추가 테이블에 학원 시스템 적용
다른 테이블(students, payments, attendance 등)에도 `academy_id` 컬럼을 추가하여 동일한 시스템을 적용할 수 있습니다:

```typescript
// 새로운 테이블용 쿼리 빌더 생성
export function getNewTableQuery() {
  return new AcademyQueryBuilder('new_table_name');
}
```

### 다중 학원 지원
현재 시스템은 사용자당 하나의 학원만 지원하지만, 필요에 따라 다중 학원 지원으로 확장 가능합니다.

## 문제 해결

### 1. 사용자 정보가 표시되지 않는 경우
- `user_role` 테이블에 해당 사용자의 데이터가 있는지 확인
- `academy_id`가 올바르게 설정되어 있는지 확인

### 2. 학원 정보가 표시되지 않는 경우
- `academy` 테이블에 해당 학원 데이터가 있는지 확인
- 외래키 관계가 올바르게 설정되어 있는지 확인

### 3. 권한 오류가 발생하는 경우
- RLS 정책이 올바르게 설정되어 있는지 확인
- 서비스 역할 키가 올바르게 설정되어 있는지 확인
