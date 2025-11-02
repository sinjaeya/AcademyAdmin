# Vercel 배포 모니터링 절차

이 문서는 AcademyAdmin 프로젝트의 Vercel 배포 상태를 모니터링하고 오류 발생 시 수정 및 재배포하는 절차를 정리합니다.

## 프로젝트 정보

- **프로젝트 이름**: `academy-admin`
- **프로젝트 ID**: `prj_uNAYPShHbbOSjKow6mHKFQEKBYUQ`
- **GitHub 리포지토리**: `sinjaeya/AcademyAdmin`
- **Vercel Team**: `team_P2a9aKMDtAjFFW5NBNQZuOFR`

## 모니터링 절차

### 1. Vercel 배포 상태 확인

#### 1.1 프로젝트 정보 확인
```bash
curl -s -H "Authorization: Bearer uLtKB1AoV0ntLSWny3PfPACY" \
  "https://api.vercel.com/v9/projects/academy-admin" | \
  python -m json.tool
```

#### 1.2 최신 배포 목록 확인
```bash
curl -s -H "Authorization: Bearer uLtKB1AoV0ntLSWny3PfPACY" \
  "https://api.vercel.com/v2/deployments?projectId=prj_uNAYPShHbbOSjKow6mHKFQEKBYUQ&limit=3" | \
  python -m json.tool
```

**확인 사항**:
- 최신 배포의 `readyState` 확인
  - `READY`: 배포 성공 ✅
  - `ERROR`: 배포 실패 ❌ (2단계로 진행)
  - `BUILDING`: 배포 진행 중 ⏳

### 2. 로컬 빌드 테스트

배포 오류가 있는 경우 또는 예방 차원에서 로컬 빌드를 실행합니다:

```bash
npm run build
```

**확인 사항**:
- 빌드가 성공적으로 완료되는지 확인
- 타입 오류, 컴파일 오류가 없는지 확인
- 경고 메시지 확인 (치명적이지 않은 경우 무시 가능)

### 3. 오류 발생 시 수정 절차

#### 3.1 오류 로그 확인
Vercel 대시보드 또는 배포 상세 정보에서 오류 로그 확인:
```bash
curl -s -H "Authorization: Bearer uLtKB1AoV0ntLSWny3PfPACY" \
  "https://api.vercel.com/v2/deployments/{DEPLOYMENT_ID}/events" | \
  python -m json.tool
```

#### 3.2 오류 유형별 대응

**타입 오류 (Type Error)**
- 파일 경로와 오류 메시지 확인
- 해당 파일에서 타입 정의 수정
- 빌드 재실행하여 확인

**빌드 오류 (Build Error)**
- `package.json` 의존성 확인
- 환경 변수 설정 확인
- 빌드 스크립트 확인

**런타임 오류 (Runtime Error)**
- 로그에서 스택 트레이스 확인
- 관련 코드 수정
- 테스트 후 재배포

#### 3.3 수정 완료 후 검증

1. 로컬 빌드 성공 확인
   ```bash
   npm run build
   ```

2. 수정 사항 커밋 및 푸시
   ```bash
   git add .
   git commit -m "fix: 배포 오류 수정"
   git push origin master
   ```

3. Vercel 자동 배포 확인
   - GitHub push 후 Vercel이 자동으로 새 배포를 시작합니다
   - 배포 상태를 모니터링합니다

### 4. 재배포 트리거 (필요시)

자동 배포가 되지 않는 경우 수동으로 재배포:

```bash
# Vercel CLI가 설치되어 있는 경우
vercel --prod

# 또는 GitHub에서 커밋을 다시 푸시하여 트리거
git commit --allow-empty -m "trigger: 재배포"
git push origin master
```

### 5. 결과 보고

모니터링 결과를 다음 형식으로 정리:

```
## 배포 모니터링 결과

### 현재 상태
- 로컬 빌드: [성공/실패]
- 최신 Vercel 배포: [상태]
- 배포 URL: [URL]

### 배포 이력
1. 최신 배포 - 상태: [READY/ERROR/BUILDING]
2. 이전 배포들...

### 발견된 문제 (있는 경우)
- 문제 설명
- 수정 내용
- 재배포 상태
```

## 주요 API 엔드포인트

### Vercel API 사용법

**프로젝트 정보**
```
GET https://api.vercel.com/v9/projects/{project_name}
```

**배포 목록**
```
GET https://api.vercel.com/v2/deployments?projectId={project_id}&limit={limit}
```

**배포 상세 정보**
```
GET https://api.vercel.com/v2/deployments/{deployment_id}
```

**배포 이벤트/로그**
```
GET https://api.vercel.com/v2/deployments/{deployment_id}/events
```

## 참고사항

- Vercel 토큰은 보안상 `.env` 또는 환경 변수로 관리해야 합니다 (현재는 예시용으로 문서에 포함)
- 배포 상태 확인은 최소 3개까지 확인하여 패턴 파악
- 로컬 빌드가 성공해도 Vercel 환경에서 실패할 수 있으므로 실제 배포 상태 확인 필수
- 빌드 시간은 보통 1-3분이 소요됩니다

## 자동화 고려사항

향후 자동화를 위한 아이디어:
- GitHub Actions로 자동 모니터링 설정
- 배포 실패 시 자동 알림 (Slack, Email 등)
- 배포 성공률 메트릭 수집

