-- 메시지 전송 기록 테이블 생성
CREATE TABLE IF NOT EXISTS message_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    message_content TEXT NOT NULL,
    attendance TEXT NOT NULL,
    class_attitude TEXT NOT NULL,
    homework_submission TEXT NOT NULL,
    homework_quality TEXT NOT NULL,
    test_score INTEGER,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_message_history_student_id ON message_history(student_id);
CREATE INDEX IF NOT EXISTS idx_message_history_sent_at ON message_history(sent_at);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE message_history ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Allow read access for all users" ON message_history
    FOR SELECT USING (true);

-- 인증된 사용자가 삽입 가능하도록 설정
CREATE POLICY "Allow insert for authenticated users" ON message_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_message_history_updated_at
    BEFORE UPDATE ON message_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
