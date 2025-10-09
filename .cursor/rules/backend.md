# 백엔드 개발 규칙

## Next.js API Routes
- RESTful API 설계 원칙 준수
- 적절한 HTTP 상태 코드 사용
- 에러 핸들링 필수
- API Route는 `src/app/api/` 디렉토리에 위치

## Supabase 규칙
- Supabase 클라이언트는 `lib/supabase/`에서 관리
- Server/Client 환경별로 분리된 클라이언트 사용
- RLS (Row Level Security) 정책 적용
- 타입 안전성을 위해 Supabase 타입 사용

## 인증 & 권한
- 모든 API Route에서 권한 검증 필수
- Supabase Auth 사용
- 세션 만료 시 자동 로그아웃
- 민감한 정보는 Admin/Owner만 접근 가능

## 데이터베이스 규칙
- DB 스키마 변경 시 반드시 확인 후 작업
- 타이핑 오류로 불일치하는 경우 반드시 확인
- 트랜잭션 사용으로 데이터 일관성 보장
- 개인정보 마스킹 옵션 제공

## 보안 규칙
- 클라이언트와 서버 양측에서 권한 검증
- 민감 데이터는 HTTPS로만 전송
- 로그에 개인정보 기록 금지
- SQL 인젝션 방지를 위한 파라미터화된 쿼리 사용