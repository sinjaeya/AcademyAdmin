-- user_role 테이블에 academy_id 외래키 추가 스크립트

-- 1. user_role 테이블에 academy_id 컬럼 추가
ALTER TABLE user_role 
ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES academy(id) ON DELETE SET NULL;

-- 2. academy_id 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_role_academy_id ON user_role(academy_id);

-- 3. 기존 데이터에 academy_id 업데이트 (academy_name과 매칭)
UPDATE user_role 
SET academy_id = (
  SELECT id 
  FROM academy 
  WHERE academy.name = user_role.academy_name 
  LIMIT 1
)
WHERE academy_id IS NULL AND academy_name IS NOT NULL;

-- 4. academy_name 컬럼을 제거 (academy_id로 대체됨)
-- 주의: 실제 운영 환경에서는 데이터 백업 후 실행
-- ALTER TABLE user_role DROP COLUMN academy_name;

-- 5. 업데이트된 데이터 확인
SELECT 
  ur.id,
  ur.user_id,
  ur.role_id,
  ur.name,
  ur.role,
  ur.academy_id,
  a.name as academy_name,
  ur.is_active,
  ur.created_at
FROM user_role ur
LEFT JOIN academy a ON ur.academy_id = a.id
ORDER BY ur.created_at DESC;

-- 6. 업데이트 완료 메시지
SELECT 'user_role 테이블이 성공적으로 업데이트되었습니다!' as message;
