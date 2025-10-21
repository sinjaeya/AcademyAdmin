# 개발 가이드 및 규칙

## 📝 Git 커밋 정책

### ✅ **커밋 규칙**
- **자동 커밋 금지**: 변경사항이 있어도 자동으로 커밋하지 않음
- **사전 요청 필수**: 커밋하기 전에 항상 사용자에게 요청
- **한글 커밋 메시지**: 한글로 작성 (UTF-8 인코딩 설정 완료)

### 🔧 **Git 설정 (완료됨)**
```bash
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
chcp 65001  # 콘솔 코드페이지 UTF-8로 변경
```

### 📋 **커밋 프로세스**
1. 코드 변경사항 확인
2. 커밋 메시지 제안
3. 사용자 승인 후 커밋 실행
4. 한글 메시지로 작성

## 🚀 환경변수 관리

### ✅ **현재 설정**
- **필수**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **선택적**: `SUPABASE_SERVICE_ROLE_KEY` (사용자 생성 기능이 필요한 경우에만)

### 📁 **파일 구조**
- `.env.local`: 로컬 개발용 (Git 무시됨)
- `.env.example`: 환경변수 템플릿 (Git 포함됨)
- `ENVIRONMENT_SETUP.md`: 상세 설정 가이드

### 🔧 **환경변수 검증**
- `src/lib/env.ts`에서 환경변수 검증 및 관리
- Service Role Key 없어도 기본 기능 정상 작동
- 경고 메시지만 출력 (에러 아님)

## 🎯 프로젝트 상태

### ✅ **완료된 작업**
- TypeScript 에러 모두 해결
- ESLint 경고 모두 제거
- 환경변수 분리 관리 구조 구축
- Supabase 연결 정상화
- 빌드 성공 확인

### 🔑 **로그인 정보**
- **이메일**: `admin@example.com`
- **비밀번호**: `password1234`
- **URL**: http://localhost:3000

### 📊 **데이터베이스 상태**
- **학원 데이터**: 3개 학원 등록됨
- **사용자 데이터**: admin@example.com 사용자 등록됨
- **역할 설정**: admin 역할로 설정됨

## 🛠️ 개발 서버

### 📍 **실행 정보**
- **포트**: 3000 (또는 3001)
- **명령어**: `npm run dev`
- **상태**: 정상 실행 중

### 🔍 **확인된 기능**
- 로그인 페이지 정상 작동
- 관리자 대시보드 접근 가능
- 학원 관리 페이지 정상 작동
- 학생 관리 페이지 정상 작동
- 환경변수 검증 로직 작동

## 📋 다음 작업 시 참고사항

### 🔄 **커밋 시**
- 변경사항 확인 후 커밋 메시지 제안
- 사용자 승인 후 실행
- 한글로 메시지 작성

### 🚀 **배포 시**
- Vercel 환경변수 설정 필요
- `ENVIRONMENT_SETUP.md` 참조
- Service Role Key는 선택사항

### 🐛 **문제 해결**
- 환경변수 문제: `src/lib/env.ts` 확인
- Supabase 연결: `.env.local` 파일 확인
- 빌드 에러: TypeScript 타입 확인

## 📚 관련 문서
- `README.md`: 프로젝트 개요
- `ENVIRONMENT_SETUP.md`: 환경변수 설정 가이드
- `src/lib/env.ts`: 환경변수 관리 로직
- `.env.example`: 환경변수 템플릿
