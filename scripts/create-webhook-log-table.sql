-- webhook_log 테이블 생성
-- Make.com 웹훅 요청/응답을 기록하는 테이블

CREATE TABLE IF NOT EXISTS webhook_log (
  id BIGSERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  student_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  request_payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_webhook_log_student_id ON webhook_log(student_id);
CREATE INDEX IF NOT EXISTS idx_webhook_log_created_at ON webhook_log(created_at DESC);

-- 코멘트 추가
COMMENT ON TABLE webhook_log IS 'Make.com 웹훅 전송 로그';
COMMENT ON COLUMN webhook_log.student_id IS '학생 ID';
COMMENT ON COLUMN webhook_log.student_name IS '학생 이름';
COMMENT ON COLUMN webhook_log.webhook_url IS '웹훅 URL';
COMMENT ON COLUMN webhook_log.request_payload IS '전송한 요청 데이터 (JSON)';
COMMENT ON COLUMN webhook_log.response_status IS 'HTTP 응답 상태 코드';
COMMENT ON COLUMN webhook_log.response_body IS '웹훅 응답 내용';
COMMENT ON COLUMN webhook_log.error_message IS '오류 발생 시 에러 메시지';
COMMENT ON COLUMN webhook_log.created_at IS '생성 일시';

