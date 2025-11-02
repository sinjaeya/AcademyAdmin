-- 기존 테이블에 한글 코멘트 추가 스크립트
-- 이미 생성된 academy, user_role 테이블에 테이블 및 컬럼 코멘트를 추가합니다.

-- ============================================
-- 1. academy 테이블 코멘트
-- ============================================

-- 테이블 코멘트
COMMENT ON TABLE academy IS '학원 정보 관리 테이블';

-- 컬럼 코멘트
COMMENT ON COLUMN academy.id IS '학원 고유 식별자 (UUID)';
COMMENT ON COLUMN academy.name IS '학원 이름';
COMMENT ON COLUMN academy.address IS '학원 주소';
COMMENT ON COLUMN academy.phone IS '학원 전화번호';
COMMENT ON COLUMN academy.email IS '학원 이메일 주소';
COMMENT ON COLUMN academy.website IS '학원 웹사이트 URL';
COMMENT ON COLUMN academy.description IS '학원 소개 및 설명';
COMMENT ON COLUMN academy.logo_url IS '학원 로고 이미지 URL';
COMMENT ON COLUMN academy.settings IS '학원 설정 정보 (JSON 형식)';
COMMENT ON COLUMN academy.is_active IS '활성화 상태 (true: 운영중, false: 폐원)';
COMMENT ON COLUMN academy.created_at IS '레코드 생성 일시';
COMMENT ON COLUMN academy.updated_at IS '레코드 최종 수정 일시';

-- ============================================
-- 2. user_role 테이블 코멘트
-- ============================================

-- 테이블 코멘트
COMMENT ON TABLE user_role IS '사용자 역할 정보 테이블';

-- 컬럼 코멘트
COMMENT ON COLUMN user_role.id IS '역할 고유 식별자 (UUID)';
COMMENT ON COLUMN user_role.user_id IS '사용자 ID (auth.users 테이블 참조)';
COMMENT ON COLUMN user_role.role_id IS '역할 ID (문자열)';
COMMENT ON COLUMN user_role.name IS '사용자 이름';
COMMENT ON COLUMN user_role.role IS '사용자 역할 (admin: 관리자, owner: 원장, teacher: 교사, tutor: 강사)';
COMMENT ON COLUMN user_role.academy_name IS '소속 학원 이름';
COMMENT ON COLUMN user_role.is_active IS '활성화 상태 (true: 활성, false: 비활성)';
COMMENT ON COLUMN user_role.created_at IS '레코드 생성 일시';
COMMENT ON COLUMN user_role.updated_at IS '레코드 최종 수정 일시';

-- ============================================
-- 완료 메시지
-- ============================================
SELECT '기존 테이블에 한글 코멘트가 성공적으로 추가되었습니다!' as message;

