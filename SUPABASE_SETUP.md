# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 계정을 생성하거나 로그인합니다.
2. "New Project" 버튼을 클릭하여 새 프로젝트를 생성합니다.
3. 프로젝트 이름과 데이터베이스 비밀번호를 설정합니다.
4. 프로젝트가 생성되면 대시보드로 이동합니다.

## 2. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next.js 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 환경변수 값 찾기

1. **NEXT_PUBLIC_SUPABASE_URL**: Supabase 대시보드 > Settings > API > Project URL
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Supabase 대시보드 > Settings > API > Project API keys > anon public
3. **SUPABASE_SERVICE_ROLE_KEY**: Supabase 대시보드 > Settings > API > Project API keys > service_role secret
4. **NEXTAUTH_SECRET**: 임의의 긴 문자열 (예: `openssl rand -base64 32`)

## 3. 인증 설정

### 3.1 이메일 인증 활성화

1. Supabase 대시보드 > Authentication > Settings
2. "Enable email confirmations" 옵션을 활성화/비활성화
3. "Enable email change confirmations" 옵션을 활성화/비활성화

### 3.2 사용자 등록 설정

1. Supabase 대시보드 > Authentication > Settings
2. "Enable signup" 옵션을 활성화
3. "Enable email confirmations" 설정에 따라 이메일 확인 필요 여부 결정

## 4. 데이터베이스 스키마 (선택사항)

사용자 프로필을 위한 추가 테이블을 생성할 수 있습니다:

```sql
-- 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 볼 수 있음
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 업데이트할 수 있음
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## 5. 테스트 사용자 생성

### 5.1 Supabase 대시보드에서 생성

1. Supabase 대시보드 > Authentication > Users
2. "Add user" 버튼 클릭
3. 이메일과 비밀번호 입력
4. "Create user" 클릭

### 5.2 애플리케이션에서 회원가입

1. 애플리케이션 실행: `npm run dev`
2. `/login` 페이지 접속
3. "회원가입" 링크 클릭 (구현된 경우)
4. 이메일과 비밀번호로 계정 생성

## 6. 문제 해결

### 6.1 CORS 오류

Supabase 대시보드 > Settings > API > CORS에서 허용된 도메인에 `http://localhost:3000` 추가

### 6.2 인증 오류

- 환경변수가 올바르게 설정되었는지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인
- 네트워크 연결 상태 확인

### 6.3 세션 유지 문제

- 브라우저 쿠키 설정 확인
- Supabase 클라이언트 설정에서 `persistSession: true` 확인

## 7. 보안 고려사항

1. **환경변수 보안**: `.env.local` 파일을 `.gitignore`에 추가
2. **RLS 정책**: 데이터베이스 테이블에 적절한 RLS 정책 설정
3. **API 키 보안**: Service Role Key는 서버 사이드에서만 사용
4. **HTTPS**: 프로덕션 환경에서는 반드시 HTTPS 사용

## 8. 추가 기능

### 8.1 소셜 로그인

Supabase 대시보드 > Authentication > Providers에서 Google, GitHub 등 소셜 로그인 설정

### 8.2 비밀번호 재설정

이미 구현된 `resetPassword` 함수를 사용하여 비밀번호 재설정 기능 구현

### 8.3 이메일 템플릿

Supabase 대시보드 > Authentication > Email Templates에서 이메일 템플릿 커스터마이징




