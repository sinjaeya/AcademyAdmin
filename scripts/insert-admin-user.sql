-- admin@example.com 사용자를 위한 user_role 데이터 삽입

-- 1. 현재 auth.users 테이블에서 admin@example.com 사용자 ID 확인
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@example.com';

-- 2. user_role 테이블에 admin@example.com 사용자 데이터 삽입
-- (위 쿼리 결과의 실제 user_id로 교체해야 함)
INSERT INTO user_role (
  user_id,
  role_id,
  name,
  role,
  academy_name,
  is_active
) VALUES (
  'daacce13-eb9c-4822-87d2-088f2b8a529e', -- admin@example.com의 실제 user_id
  'admin-role-001',
  '관리자',
  'admin',
  '테스트 학원',
  true
);

-- 3. 삽입된 데이터 확인
SELECT 
  ur.id,
  ur.user_id,
  au.email,
  ur.name,
  ur.role,
  ur.academy_name,
  ur.is_active,
  ur.created_at
FROM user_role ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'admin@example.com';

-- 4. 성공 메시지
SELECT 'admin@example.com 사용자의 user_role 데이터가 성공적으로 삽입되었습니다!' as message;
