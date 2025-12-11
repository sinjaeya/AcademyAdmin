# PWA (Progressive Web App) 설정 가이드

이 문서는 프로젝트의 PWA 설정에 대한 상세 가이드를 제공합니다.

## 📋 목차

1. [개요](#개요)
2. [설정 파일](#설정-파일)
3. [아이콘 관리](#아이콘-관리)
4. [테스트 방법](#테스트-방법)
5. [배포 시 주의사항](#배포-시-주의사항)

## 개요

이 프로젝트는 **Progressive Web App (PWA)**로 구성되어 있어 다음과 같은 기능을 제공합니다:

- 📱 모바일 앱처럼 홈 화면에 설치 가능
- 🔄 오프라인에서도 기본 기능 사용 가능
- ⚡ Service Worker를 통한 빠른 로딩
- 🎨 독립적인 앱 창에서 실행

## 설정 파일

### 1. next.config.ts

PWA 플러그인 설정:

```typescript
import withPWA from "@ducanh2912/next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", // 개발 모드에서 비활성화
  workboxOptions: {
    disableDevLogs: true,
  },
});
```

**주요 설정 옵션:**
- `dest`: Service Worker 파일이 생성될 디렉토리
- `cacheOnFrontEndNav`: 프론트엔드 네비게이션 시 캐싱 활성화
- `aggressiveFrontEndNavCaching`: 공격적인 캐싱 전략 사용
- `reloadOnOnline`: 온라인 상태로 복귀 시 자동 리로드
- `disable`: 개발 모드에서 PWA 비활성화

### 2. public/manifest.json

PWA 매니페스트 파일:

```json
{
  "name": "부산EDU 학원관리 시스템",
  "short_name": "부산EDU",
  "description": "학원 관리 시스템 PWA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 3. src/app/layout.tsx

PWA 메타데이터 설정:

```typescript
export const metadata: Metadata = {
  title: '부산EDU 학원관리 시스템',
  description: '학원 관리 시스템 PWA',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '부산EDU',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};
```

## 아이콘 관리

### 아이콘 생성

프로젝트에는 PWA 아이콘을 자동으로 생성하는 스크립트가 포함되어 있습니다:

```bash
npm run pwa:icons
```

이 명령어는 다음 파일들을 생성합니다:
- `public/icon-192x192.png` (192x192 픽셀)
- `public/icon-512x512.png` (512x512 픽셀)

### 아이콘 커스터마이징

실제 프로덕션에서는 디자인된 아이콘 이미지를 사용해야 합니다:

1. **아이콘 디자인 준비**
   - 192x192 픽셀 PNG 이미지
   - 512x512 픽셀 PNG 이미지
   - 투명 배경 권장

2. **아이콘 교체**
   ```bash
   # public 폴더에 직접 복사
   cp your-icon-192.png public/icon-192x192.png
   cp your-icon-512.png public/icon-512x512.png
   ```

3. **아이콘 스크립트 수정** (선택사항)
   - `scripts/generate-pwa-icons.js` 파일을 수정하여 커스텀 아이콘 생성 로직 추가

## 테스트 방법

### 1. 로컬에서 프로덕션 빌드 테스트

```bash
# 프로덕션 빌드 생성
npm run build

# 프로덕션 모드로 실행
npm start
```

브라우저에서 `http://localhost:3000` 접속 후 개발자 도구에서 확인:

1. **Chrome DevTools**
   - F12 > Application 탭
   - Manifest 섹션에서 PWA 설정 확인
   - Service Workers 섹션에서 Service Worker 상태 확인

2. **PWA 설치 테스트**
   - Chrome: 주소창 오른쪽의 설치 아이콘 클릭
   - Edge: 주소창 오른쪽의 앱 설치 아이콘 클릭
   - 모바일: 브라우저 메뉴에서 "홈 화면에 추가" 선택

### 2. 배포 환경에서 테스트

Vercel, Netlify 등에 배포하면 자동으로 프로덕션 빌드가 실행되어 PWA가 활성화됩니다.

**체크리스트:**
- ✅ HTTPS 연결 확인 (PWA는 HTTPS 필수)
- ✅ manifest.json 접근 가능 확인
- ✅ 아이콘 파일 접근 가능 확인
- ✅ Service Worker 등록 확인

### 3. PWA 감사 (Lighthouse)

Chrome DevTools의 Lighthouse를 사용하여 PWA 점수를 확인:

1. F12 > Lighthouse 탭
2. "Progressive Web App" 선택
3. "Analyze page load" 클릭
4. 점수 및 개선 사항 확인

## 배포 시 주의사항

### 1. HTTPS 필수

PWA는 **HTTPS 환경에서만** 정상 작동합니다:
- ✅ Vercel, Netlify: 자동으로 HTTPS 제공
- ✅ 자체 서버: SSL 인증서 설정 필요

### 2. Service Worker 캐싱

Service Worker는 리소스를 캐싱하므로, 업데이트 시 다음을 고려하세요:

- **캐시 버전 관리**: `workboxOptions`에서 캐시 버전 설정
- **업데이트 전략**: 네트워크 우선 또는 캐시 우선 전략 선택

### 3. 아이콘 최적화

- **파일 크기**: 아이콘 파일 크기를 최적화하여 로딩 속도 개선
- **다양한 크기**: 필요시 다양한 크기의 아이콘 추가 (예: 144x144, 384x384)

### 4. 매니페스트 검증

배포 전 다음 사항을 확인하세요:

- ✅ `manifest.json` JSON 형식 유효성
- ✅ 아이콘 파일 경로 정확성
- ✅ `start_url` 올바른 경로 설정
- ✅ `theme_color` 브랜드 색상과 일치

## 문제 해결

### Service Worker가 등록되지 않는 경우

1. **프로덕션 빌드 확인**
   ```bash
   npm run build
   npm start
   ```

2. **HTTPS 확인**: 개발 환경에서도 HTTPS 필요 (localhost는 예외)

3. **브라우저 캐시 클리어**: Service Worker 캐시 삭제 후 재시도

### 아이콘이 표시되지 않는 경우

1. **파일 경로 확인**: `public` 폴더에 아이콘 파일 존재 확인
2. **파일 형식 확인**: PNG 형식인지 확인
3. **매니페스트 확인**: `manifest.json`의 아이콘 경로 확인

### 오프라인에서 작동하지 않는 경우

1. **Service Worker 등록 확인**
2. **캐싱 전략 확인**: `workboxOptions` 설정 확인
3. **네트워크 요청 확인**: API 요청은 오프라인에서 실패할 수 있음

## 참고 자료

- [Next.js PWA 문서](https://github.com/Ducanh2912/next-pwa)
- [Web.dev PWA 가이드](https://web.dev/progressive-web-apps/)
- [MDN PWA 문서](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

## 업데이트 이력

- **2024-12-XX**: PWA 초기 설정 완료
  - `@ducanh2912/next-pwa` 패키지 설치
  - manifest.json 생성
  - PWA 아이콘 생성 스크립트 추가
  - 프로덕션 빌드에서만 활성화 설정







