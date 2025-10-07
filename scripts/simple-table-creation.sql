-- 메시지 전송 기록 테이블 생성
CREATE TABLE IF NOT EXISTS message_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
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
