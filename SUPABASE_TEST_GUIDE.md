# 🚀 Supabase 테스트 계정 생성 가이드

## 1단계: Supabase 프로젝트 생성

### 1.1 Supabase 대시보드 접속
1. [https://supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인

### 1.2 새 프로젝트 생성
1. "New Project" 클릭
2. **프로젝트 정보 입력**:
   - Organization: 선택 (또는 새로 생성)
   - Project name: `admin-test` (또는 원하는 이름)
   - Database password: 강력한 비밀번호 설정 (기억해두세요!)
   - Region: Asia Northeast (Seoul) 권장
3. "Create new project" 클릭
4. 프로젝트 생성 완료까지 2-3분 대기

## 2단계: API 키 확인

### 2.1 프로젝트 설정 접속
1. 생성된 프로젝트 클릭
2. 왼쪽 메뉴에서 **Settings** 클릭
3. **API** 탭 선택

### 2.2 API 키 복사
다음 정보를 복사해두세요:
- **Project URL**: `https://your-project-id.supabase.co`
- **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (비밀!)

## 3단계: 환경변수 설정

### 3.1 설정 스크립트 실행
```bash
npm run setup
```

### 3.2 정보 입력
스크립트에서 다음을 입력하세요:
- **Supabase URL**: 2.2에서 복사한 Project URL
- **Supabase Anon Key**: 2.2에서 복사한 anon public
- **Service Role Key**: 2.2에서 복사한 service_role

## 4단계: 테스트 계정 생성

### 4.1 Authentication 설정
1. Supabase 대시보드에서 **Authentication** 클릭
2. **Users** 탭 선택
3. **Add user** 클릭

### 4.2 테스트 계정 생성
**사용자 정보**:
- **Email**: `admin@example.com`
- **Password**: `password123` (또는 원하는 비밀번호)
- **Email Confirm**: 체크 (이메일 확인 생략)

### 4.3 추가 계정 생성 (선택사항)
더 많은 테스트 계정을 만들 수 있습니다:
- `user1@example.com` / `password123`
- `moderator@example.com` / `password123`

## 5단계: 테스트 실행

### 5.1 서버 시작
```bash
npm run dev
```

### 5.2 로그인 테스트
1. 브라우저에서 `http://localhost:3000` 접속
2. 생성한 계정으로 로그인
3. 어드민 대시보드 확인

## 🔧 문제 해결

### 환경변수가 설정되지 않은 경우
```
Error: Supabase 설정이 필요합니다. npm run setup을 실행해주세요.
```
**해결방법**: `npm run setup` 실행 후 Supabase 정보 입력

### 로그인 실패
```
Error: 로그인 ID와 비밀번호를 체크해주세요
```
**해결방법**: 
1. Supabase 대시보드에서 계정이 생성되었는지 확인
2. 이메일/비밀번호가 정확한지 확인
3. Authentication → Users에서 계정 상태 확인

### 네트워크 오류
```
Error: Failed to fetch
```
**해결방법**:
1. Supabase URL이 정확한지 확인
2. 인터넷 연결 상태 확인
3. Supabase 서비스 상태 확인

## 📋 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] API 키 복사 완료
- [ ] `npm run setup` 실행 완료
- [ ] 테스트 계정 생성 완료
- [ ] 로그인 테스트 성공
- [ ] 어드민 대시보드 접근 확인

## 🎯 다음 단계

테스트 계정이 정상적으로 작동하면:
1. 실제 사용자 데이터 추가
2. 권한 관리 설정
3. 추가 기능 개발

---

**도움이 필요하시면**: 이 가이드를 따라하시거나 `npm run setup`을 실행해주세요! 🚀




