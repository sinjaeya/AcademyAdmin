-- study_month 컬럼 추가 마이그레이션
-- payment 테이블에 study_month 컬럼 추가 (DB Enum: 1월~12월)

-- 1. 기존 ENUM 타입 삭제 (존재하는 경우)
DROP TYPE IF EXISTS study_month_enum CASCADE;

-- 2. study_month_enum 타입 생성
CREATE TYPE study_month_enum AS ENUM('1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월');

-- 3. payment 테이블에 study_month 컬럼 추가 (NULL 허용)
ALTER TABLE payment ADD COLUMN IF NOT EXISTS study_month study_month_enum;

-- 4. 기존 데이터 업데이트: payment_date의 월을 기준으로 해당 월 값으로 설정
UPDATE payment
SET study_month = CASE 
  WHEN EXTRACT(MONTH FROM payment_date) = 1 THEN '1월'::study_month_enum
  WHEN EXTRACT(MONTH FROM payment_date) = 2 THEN '2월'::study_month_enum
  WHEN EXTRACT(MONTH FROM payment_date) = 3 THEN '3월'::study_month_enum
  WHEN EXTRACT(MONTH FROM payment_date) = 4 THEN '4월'::study_month_enum
  WHEN EXTRACT(MONTH FROM payment_date) = 5 THEN '5월'::study_month_enum
  WHEN EXTRACT(MONTH FROM payment_date) = 6 THEN '6월'::study_month_enum
  WHEN EXTRACT(MONTH FROM payment_date) = 7 THEN '7월'::study_month_enum
  WHEN EXTRACT(MONTH FROM payment_date) = 8 THEN '8월'::study_month_enum
  WHEN EXTRACT(MONTH FROM payment_date) = 9 THEN '9월'::study_month_enum
  WHEN EXTRACT(MONTH FROM payment_date) = 10 THEN '10월'::study_month_enum
  WHEN EXTRACT(MONTH FROM payment_date) = 11 THEN '11월'::study_month_enum
  WHEN EXTRACT(MONTH FROM payment_date) = 12 THEN '12월'::study_month_enum
  ELSE '1월'::study_month_enum -- 기본값 (혹시 모를 경우)
END
WHERE study_month IS NULL;

-- 5. NOT NULL 제약 조건 추가
ALTER TABLE payment ALTER COLUMN study_month SET NOT NULL;

-- 6. 코멘트 추가
COMMENT ON COLUMN payment.study_month IS '해당월 (1월~12월)';

