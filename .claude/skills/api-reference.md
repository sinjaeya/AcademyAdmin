# API 엔드포인트 레퍼런스

> API 호출, 엔드포인트 추가/수정 시 참조. 새 API Route 작성 시 트리거.

## 엔드포인트 목록

| 그룹 | 엔드포인트 | 설명 |
|------|-----------|------|
| 학생 | `/api/admin/students`, `/api/admin/students/[id]` | CRUD (status 파라미터로 필터링) |
| 결제 | `/api/admin/payments`, `/api/admin/payments/[id]` | 수납 내역 CRUD |
| 학습 | `/api/admin/learning/realtime`, `/api/admin/learning/realtime/[id]` | 실시간 학습 모니터링 |
| 학습v2 | `/api/admin/learning/realtime-korean2` | 실시간 국어 v2 |
| 필기 | `/api/admin/handwriting/live` | 내손내줄 실시간 필기 |
| 콘텐츠 | `/api/admin/contents/passages`, `/api/admin/contents/word-pang`, `/api/admin/contents/sentence-clinic` | 지문/단어/문장 관리 |
| 통계 | `/api/admin/statistics/sentence-clinic`, `/api/admin/statistics/student-learning` | 학습 통계 |
| 학원 | `/api/admin/academy`, `/api/admin/academy/[id]` | 학원 CRUD |
| 설정 | `/api/admin/settings`, `/api/admin/permissions` | 변수/권한 관리 |

## API 보안 규칙

- 모든 API Route에서 권한 검증 필수
- SQL 인젝션 방지를 위한 파라미터화된 쿼리 사용
- 민감 데이터는 Admin/Owner만 접근 가능
- 로그에 개인정보 기록 금지
