-- academy 테이블에 type 컬럼 추가
-- 학원 타입: full(전체 기능), lite(문해력 앱만)
ALTER TABLE academy ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'full';

-- CHECK 제약조건 추가
ALTER TABLE academy ADD CONSTRAINT academy_type_check CHECK (type IN ('full', 'lite'));

-- 컬럼 주석 추가
COMMENT ON COLUMN academy.type IS '학원 타입 (full: 전체 기능, lite: 문해력 앱만)';
