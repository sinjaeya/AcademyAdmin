# Git 커밋 및 푸시 + Vercel 배포 모니터링

> 커밋, 푸시 후 자동으로 Vercel 배포 상태를 모니터링하고 결과를 알려줍니다.

## 실행 순서

### 1. 사전 정리
```bash
# Windows 오류 파일 삭제 (있다면)
rm -f nul aux con prn 2>/dev/null
```

### 2. 상태 확인
```bash
git status --short
git diff --staged
git diff
git log --oneline -3
```

### 3. 스테이징 및 커밋
```bash
git add .
git commit -m "$(cat <<'EOF'
타입: 커밋 메시지 (한글)

- 변경사항 요약

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 4. 푸시
```bash
git push origin master
```

### 5. Vercel 배포 모니터링 (백그라운드)

푸시 완료 후 **백그라운드 Task**로 배포 모니터링 시작:

```
1. 10초 대기 (Vercel 트리거 대기)
2. mcp__vercel__getDeployments로 최신 배포 확인
3. 상태가 BUILDING이면 30초 간격으로 폴링 (최대 5분)
4. 결과 알림:
   - READY: "✅ Vercel 배포 성공" + URL
   - ERROR: "❌ Vercel 배포 실패" + 에러 로그 자동 분석
```

## 커밋 메시지 규칙

- **언어**: 반드시 한글로 작성
- **형식**: `타입: 내용`
  - `feat:` 새 기능
  - `fix:` 버그 수정
  - `refactor:` 리팩토링
  - `docs:` 문서 변경
  - `style:` 코드 스타일 변경
  - `chore:` 빌드, 설정 등
  - `test:` 테스트 추가/수정

## 주의사항

- 민감한 파일(.env, credentials 등)이 포함되면 경고
- 푸시 전 현재 브랜치 확인 (master/main)
- Co-Authored-By 헤더 필수 포함

## 배포 실패 시 자동 분석

배포 실패 감지 시:
1. `mcp__vercel__getDeploymentEvents`로 빌드 로그 조회
2. 에러 메시지 추출 및 원인 분석
3. 수정 방법 제안
4. 사용자에게 알림

## 예시 출력

### 성공 시
```
✅ Vercel 배포 성공!
- 커밋: abc1234
- 상태: READY
- URL: https://admin.busanedu.co.kr
```

### 실패 시
```
❌ Vercel 배포 실패!
- 커밋: abc1234
- 에러: Type error in src/app/page.tsx:42

분석 중...
→ 타입 에러 발견: 'string' is not assignable to 'number'
→ 수정 제안: page.tsx:42 라인의 타입 확인 필요
```
