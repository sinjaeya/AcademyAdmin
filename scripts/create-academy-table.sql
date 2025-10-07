-- academy 테이블 생성 스크립트

-- 1. 기존 academy 테이블이 있다면 삭제
DROP TABLE IF EXISTS academy CASCADE;

-- 2. academy 테이블 생성
CREATE TABLE academy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_academy_name ON academy(name);
CREATE INDEX idx_academy_is_active ON academy(is_active);

-- 4. RLS (Row Level Security) 활성화
ALTER TABLE academy ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
-- 인증된 사용자는 모든 academy 정보 조회 가능
CREATE POLICY "Authenticated users can view academies" ON academy
  FOR SELECT USING (auth.role() = 'authenticated');

-- 서비스 역할은 모든 academy 정보에 접근 가능 (관리자용)
CREATE POLICY "Service role can manage all academies" ON academy
  FOR ALL USING (auth.role() = 'service_role');

-- 6. 초기 학원 데이터 삽입
INSERT INTO academy (
  name,
  address,
  phone,
  email,
  description,
  is_active
) VALUES (
  '테스트 학원',
  '서울시 강남구 테스트로 123',
  '02-1234-5678',
  'info@testacademy.com',
  '테스트용 학원입니다.',
  true
);

-- 7. 테이블 생성 완료 메시지
SELECT 'academy 테이블이 성공적으로 생성되었습니다!' as message;
