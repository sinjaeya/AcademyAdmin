-- user_role 테이블 데이터 확인

-- 1. user_role 테이블의 모든 데이터 조회
SELECT * FROM user_role;

-- 2. 특정 사용자 ID로 조회
SELECT * FROM user_role WHERE user_id = 'daacce13-eb9c-4822-87d2-088f2b8a529e';

-- 3. auth.users와 조인해서 이메일과 함께 조회
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
LEFT JOIN auth.users au ON ur.user_id = au.id;

-- 4. 테이블이 존재하는지 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_role';
