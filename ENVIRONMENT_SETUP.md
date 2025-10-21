# 환경변수 설정 가이드

## 개발환경 설정

### 1. 로컬 개발환경
```bash
# .env.local 파일 생성
cp .env.example .env.local
```

`.env.local` 파일을 편집하여 실제 값으로 변경:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. Supabase 키 확인 방법
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. Settings > API 메뉴에서 확인:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret**: `SUPABASE_SERVICE_ROLE_KEY`

## 배포환경 설정

### Vercel 배포 시 환경변수 설정

#### 1. Vercel Dashboard에서 설정
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. Settings > Environment Variables 메뉴
4. 다음 환경변수들을 추가:

| 변수명 | 값 | 환경 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key-here` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key-here` | Production, Preview, Development |

#### 2. Vercel CLI로 설정
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트에 로그인
vercel login

# 환경변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

#### 3. 배포 후 확인
배포 완료 후 다음을 확인:
- [ ] 로그인 페이지가 정상적으로 로드되는가?
- [ ] `admin@example.com` / `password1234`로 로그인이 되는가?
- [ ] 관리자 페이지에 접근할 수 있는가?

## 보안 주의사항

### ⚠️ 중요
- `SUPABASE_SERVICE_ROLE_KEY`는 **절대** 클라이언트에 노출되면 안됩니다
- `.env.local` 파일은 Git에 커밋하지 마세요
- 프로덕션 환경에서는 반드시 Vercel의 환경변수 설정을 사용하세요

### 환경변수 파일 우선순위
1. `.env.local` (로컬 개발용, Git 무시됨)
2. `.env.development` (개발환경용)
3. `.env.production` (프로덕션용)
4. `.env` (기본값)

## 문제 해결

### 환경변수가 인식되지 않는 경우
1. 서버 재시작: `npm run dev`
2. 브라우저 캐시 삭제
3. 환경변수 이름 확인 (대소문자 구분)
4. `.env.local` 파일 위치 확인 (프로젝트 루트)

### Supabase 연결 오류
1. Supabase 프로젝트가 활성화되어 있는지 확인
2. API 키가 올바른지 확인
3. 네트워크 연결 상태 확인
4. Supabase 서비스 상태 확인: https://status.supabase.com
