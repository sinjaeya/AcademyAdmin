# Next.js 어드민 사이트

현대적이고 반응형인 Next.js 기반 어드민 패널입니다.

## 🚀 기술 스택

- **Next.js 14** (App Router)
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **shadcn/ui** - 고품질 UI 컴포넌트
- **Zustand** - 상태 관리
- **React Query** - 서버 상태 관리
- **Prisma** - ORM
- **NextAuth.js** - 인증 시스템

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # 어드민 페이지들
│   │   ├── users/         # 사용자 관리
│   │   └── page.tsx       # 대시보드
│   └── api/               # API 라우트
├── components/            # React 컴포넌트
│   ├── admin/            # 어드민 전용 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   └── ui/               # shadcn/ui 컴포넌트
├── lib/                  # 유틸리티 및 설정
│   ├── auth/             # 인증 관련
│   ├── db/               # 데이터베이스 설정
│   └── validations/      # 폼 검증 스키마
├── store/                # Zustand 스토어
├── types/                # TypeScript 타입 정의
└── hooks/                # 커스텀 훅
```

## 🛠️ 설치 및 실행

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경변수 설정**

   **방법 1: 환경변수 파일 복사 (추천)**
   ```bash
   cp .env.example .env.local
   ```
   - `.env.local` 파일을 편집하여 실제 Supabase 값으로 변경
   - 자세한 설정 방법은 [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) 참조

   **방법 2: 수동 설정**
   ```bash
   # .env.local 파일 생성
   touch .env.local
   ```
   다음 내용을 추가:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **브라우저에서 확인**
   ```
   http://localhost:3000
   ```

## 📋 주요 기능

### ✅ 구현 완료
- [x] Next.js 14 프로젝트 설정
- [x] TypeScript 설정
- [x] Tailwind CSS + shadcn/ui 설정
- [x] 반응형 어드민 레이아웃
- [x] 사이드바 네비게이션
- [x] 대시보드 페이지
- [x] 사용자 관리 페이지
- [x] 통계 카드 컴포넌트
- [x] 사용자 테이블 컴포넌트
- [x] 상태 관리 (Zustand)

### 🚧 진행 예정
- [ ] 인증 시스템 (NextAuth.js)
- [ ] 데이터베이스 연동 (Prisma)
- [ ] API 라우트 구현
- [ ] 폼 검증 및 제출
- [ ] 실시간 데이터 업데이트
- [ ] 권한 기반 접근 제어
- [ ] 다크 모드 지원
- [ ] 국제화 (i18n)

## 🎨 UI 컴포넌트

shadcn/ui를 사용하여 다음 컴포넌트들이 포함되어 있습니다:
- Button, Card, Input, Label
- Table, Dropdown Menu
- Avatar, Badge
- Navigation Menu, Sidebar

## 📱 반응형 디자인

- 모바일: 햄버거 메뉴로 사이드바 토글
- 태블릿: 적응형 그리드 레이아웃
- 데스크톱: 고정 사이드바 + 메인 콘텐츠

## 🔧 개발 도구

- **ESLint** - 코드 품질 검사
- **Prettier** - 코드 포맷팅
- **TypeScript** - 정적 타입 검사

## 📝 다음 단계

1. **인증 시스템 구현**
   - NextAuth.js 설정
   - 로그인/로그아웃 페이지
   - 세션 관리

2. **데이터베이스 연동**
   - Prisma 스키마 정의
   - 데이터베이스 마이그레이션
   - API 라우트 구현

3. **고급 기능**
   - 실시간 알림
   - 데이터 필터링 및 검색
   - 엑셀 내보내기
   - 차트 및 그래프

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.