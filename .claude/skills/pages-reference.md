# 전체 페이지 목록 레퍼런스

> 페이지 추가/수정, 라우팅 확인, 사이드바 메뉴 작업 시 참조.

## 어드민 페이지 (34개)

### 메인
- `/admin` — 대시보드 (역할별 통계 분기)

### 학습 모니터링
- `/admin/learning/realtime-korean2` — 실시간 국어 v2 (메인 모니터링)
- `/admin/handwriting/live` — 내손내줄 실시간 목록
- `/admin/handwriting/live/[studentId]` — 학생별 필기 캔버스
- `/admin/learning` — 학습관리 (풀스택-국어)
- `/admin/learning/korean2` — 풀스택-국어 캘린더뷰
- `/admin/learning/study-screenshots` — 공부 스크린샷
- `/admin/learning/math` — 수학(Mathflat) 학습

### 레벨테스트
- `/admin/level-test` — 레벨테스트 목록
- `/admin/level-test/report/[sessionId]` — 레벨테스트 상세 리포트

### 관리
- `/admin/students` — 학생 관리
- `/admin/payments` — 학원비 수납
- `/admin/checkinout` — 등/하원 조회
- `/admin/users` — 사용자 목록

### 알림/리포트
- `/admin/kakao-report` — 카카오 알림톡 발송
- `/admin/study-reports` — 학습 리포트 (AI 리포트)

### 통계
- `/admin/statistics/sentence-clinic` — 문장클리닉 통계
- `/admin/statistics/student-learning` — 학생별 학습 통계

### 콘텐츠
- `/admin/contents/passages` — 지문 관리
- `/admin/contents/word-pang` — 단어팡 관리
- `/admin/contents/sentence-clinic` — 문장클리닉 관리

### 선생님 도구
- `/admin/teacher/passage-guide` — 지문 가이드
- `/admin/teacher/passage-guide/[studentId]` — 학생별 지문 가이드
- `/admin/teacher/passage-guide/[studentId]/[code]` — 지문별 퀴즈

### RAG
- `/admin/rag/files` — RAG 파일 관리
- `/admin/rag/recommended-topics` — RAG 추천 주제
- `/admin/rag/generation-logs` — RAG 생성 로그
- `/admin/rag/sync-logs` — RAG 동기화 로그

### 설정
- `/admin/settings/variables` — 변수 관리
- `/admin/settings/academy` — 학원 관리
- `/admin/settings/users` — 사용자 관리
- `/admin/settings/permissions` — 권한 관리
- `/admin/settings/login-logs` — 로그인 로그
