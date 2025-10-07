-- user_role 테이블 생성 및 초기 데이터 삽입 스크립트

-- 1. 기존 user_role 테이블이 있다면 삭제
DROP TABLE IF EXISTS user_role;

-- 2. user_role 테이블 생성
CREATE TABLE user_role (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'owner', 'teacher', 'tutor')),
  academy_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_user_role_user_id ON user_role(user_id);
CREATE INDEX idx_user_role_role ON user_role(role);
CREATE INDEX idx_user_role_is_active ON user_role(is_active);

-- 4. RLS (Row Level Security) 활성화
ALTER TABLE user_role ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
-- 인증된 사용자는 자신의 user_role 정보만 조회 가능
CREATE POLICY "Users can view own user_role" ON user_role
  FOR SELECT USING (auth.uid() = user_id);

-- 인증된 사용자는 자신의 user_role 정보만 업데이트 가능
CREATE POLICY "Users can update own user_role" ON user_role
  FOR UPDATE USING (auth.uid() = user_id);

-- 서비스 역할은 모든 user_role 정보에 접근 가능 (관리자용)
CREATE POLICY "Service role can manage all user_roles" ON user_role
  FOR ALL USING (auth.role() = 'service_role');

-- 6. 현재 사용자 (admin@example.com)에 대한 초기 데이터 삽입
-- 사용자 ID는 실제 Supabase Auth의 사용자 ID로 교체해야 함
INSERT INTO user_role (
  user_id,
  role_id,
  name,
  role,
  academy_name,
  is_active
) VALUES (
  'daacce13-eb9c-4822-87d2-088f2b8a529e', -- 현재 사용자 ID
  'admin-role-001',
  '관리자',
  'admin',
  '테스트 학원',
  true
);

-- 7. 테이블 생성 완료 메시지
SELECT 'user_role 테이블이 성공적으로 생성되었습니다!' as message;
