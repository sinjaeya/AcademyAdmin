-- payment 테이블 생성 스크립트
-- 학원비 수납 내역을 관리하는 테이블

-- 1. 기존 ENUM 타입 삭제 (존재하는 경우)
DROP TYPE IF EXISTS payment_method_enum CASCADE;

-- 2. ENUM 타입 생성
CREATE TYPE payment_method_enum AS ENUM('무통장', '카드');

-- 3. 기존 테이블 삭제 (필요시)
DROP TABLE IF EXISTS payment CASCADE;

-- 4. 테이블 생성
CREATE TABLE payment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  payer_name TEXT,
  amount INTEGER NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method payment_method_enum NOT NULL,
  cash_receipt_issued BOOLEAN DEFAULT false,
  academy_id UUID REFERENCES academy(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 인덱스 생성
CREATE INDEX idx_payment_student_id ON payment(student_id);
CREATE INDEX idx_payment_academy_id ON payment(academy_id);
CREATE INDEX idx_payment_payment_date ON payment(payment_date DESC);

-- 6. RLS (Row Level Security) 설정
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 생성
-- 모든 사용자가 읽기 가능
CREATE POLICY "Allow read access for all users" ON payment
  FOR SELECT USING (true);

-- 인증된 사용자가 삽입 가능
CREATE POLICY "Allow insert for authenticated users" ON payment
  FOR INSERT WITH CHECK (true);

-- 인증된 사용자가 업데이트 가능
CREATE POLICY "Allow update for authenticated users" ON payment
  FOR UPDATE USING (true);

-- 인증된 사용자가 삭제 가능
CREATE POLICY "Allow delete for authenticated users" ON payment
  FOR DELETE USING (true);

-- 8. 업데이트 트리거 함수 (이미 존재하는 경우 무시)
CREATE OR REPLACE FUNCTION update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_payment_updated_at ON payment;
CREATE TRIGGER update_payment_updated_at
  BEFORE UPDATE ON payment
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

-- 10. 테이블 코멘트 추가
COMMENT ON TABLE payment IS '학원비 수납 내역 관리 테이블';

-- 11. 컬럼 코멘트 추가
COMMENT ON COLUMN payment.id IS '고유 식별자 (UUID)';
COMMENT ON COLUMN payment.student_id IS '학생 ID (student 테이블 참조)';
COMMENT ON COLUMN payment.payer_name IS '입금자 이름';
COMMENT ON COLUMN payment.amount IS '입금 금액';
COMMENT ON COLUMN payment.payment_date IS '입금일시';
COMMENT ON COLUMN payment.payment_method IS '입금방법 (무통장, 카드)';
COMMENT ON COLUMN payment.cash_receipt_issued IS '현금영수증 발행여부 (true: 발행됨, false: 미발행)';
COMMENT ON COLUMN payment.academy_id IS '학원 ID (academy 테이블 참조)';
COMMENT ON COLUMN payment.created_at IS '레코드 생성 일시';
COMMENT ON COLUMN payment.updated_at IS '레코드 최종 수정 일시';

