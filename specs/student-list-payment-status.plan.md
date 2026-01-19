# 학생 목록 - 당월 납부 여부 표시 테스트

## Application Overview

학생 API를 1쿼리 JOIN으로 변경한 후, 학생 목록 페이지에서 당월 납부 여부가 정상적으로 표시되는지 검증합니다. API는 payment 테이블과 LEFT JOIN하여 hasPaidThisMonth 필드를 반환하고, UI는 이 값에 따라 아바타 배경색을 파란색(납부 완료) 또는 회색(미납)으로 표시합니다.

## Test Scenarios

### 1. 학생 목록 페이지 - 납부 상태 표시

**Seed:** `seed.spec.ts`

#### 1.1. 페이지 로드 및 학생 목록 표시

**File:** `tests/student-list/page-load.spec.ts`

**Steps:**
  1. http://localhost:3000 페이지 접속
  2. '개발자 로그인' 버튼 클릭하여 자동 로그인
  3. 사이드바에서 '학생 관리' 링크 클릭
  4. 학생 목록 페이지(http://localhost:3000/admin/students) 로드 대기
  5. 페이지 제목이 '학생 관리'인지 확인
  6. '총 16명의 학생이 있습니다' 텍스트가 표시되는지 확인
  7. 테이블 헤더가 정상적으로 표시되는지 확인 (학생명, 액션, 핸드폰번호 등)

**Expected Results:**
  - 로그인 없이 페이지 접근 시 로그인 페이지로 리다이렉트
  - 개발자 로그인 버튼 클릭 시 자동으로 admin@example.com 계정 입력 및 로그인
  - 학생 관리 페이지가 정상적으로 로드됨
  - 16명의 학생이 테이블에 표시됨
  - 로딩 인디케이터가 먼저 보인 후 데이터가 표시됨

#### 1.2. API 응답 - hasPaidThisMonth 필드 검증

**File:** `tests/student-list/api-payment-field.spec.ts`

**Steps:**
  1. 학생 목록 페이지 로드
  2. 네트워크 요청 '/api/admin/students?academy_id=...' 인터셉트
  3. API 응답 JSON 파싱
  4. 각 학생 객체에 'hasPaidThisMonth' 필드가 존재하는지 확인
  5. hasPaidThisMonth 값이 boolean 타입(true/false)인지 확인
  6. 전체 학생 중 납부 완료/미납 학생 수 계산
  7. 샘플 학생 5명의 납부 상태 확인 (최원준: true, 김지유: false, 테스트11: false, 박시은: true, 문라현: true)

**Expected Results:**
  - API 응답이 200 OK 상태 코드 반환
  - 모든 학생 객체에 'hasPaidThisMonth' 필드 포함
  - hasPaidThisMonth 값이 boolean 타입
  - 총 16명 중 11명 납부 완료, 5명 미납
  - 각 학생의 납부 상태가 DB의 payment 테이블 데이터와 일치

#### 1.3. UI 표시 - 아바타 배경색 검증

**File:** `tests/student-list/avatar-background.spec.ts`

**Steps:**
  1. 학생 목록 페이지 로드 및 데이터 로드 완료 대기
  2. 첫 번째 학생(최원준) 행의 아바타 요소 선택
  3. 아바타의 CSS 클래스에 'bg-blue-100'이 포함되어 있는지 확인
  4. 두 번째 학생(김지유) 행의 아바타 요소 선택
  5. 아바타의 CSS 클래스에 'bg-gray-200'이 포함되어 있는지 확인
  6. 전체 학생 목록에서 파란색 아바타 개수 세기
  7. 전체 학생 목록에서 회색 아바타 개수 세기

**Expected Results:**
  - 납부 완료 학생(hasPaidThisMonth: true)의 아바타는 'bg-blue-100' 클래스 적용
  - 미납 학생(hasPaidThisMonth: false)의 아바타는 'bg-gray-200' 클래스 적용
  - 최원준(납부 완료): 파란색 배경
  - 김지유(미납): 회색 배경
  - 테스트11(미납): 회색 배경
  - 박시은(납부 완료): 파란색 배경
  - 문라현(납부 완료): 파란색 배경
  - 파란색 아바타 11개, 회색 아바타 5개

#### 1.4. 납부 상태와 아바타 색상 일치 검증

**File:** `tests/student-list/payment-avatar-match.spec.ts`

**Steps:**
  1. 학생 목록 페이지 로드
  2. API 응답에서 각 학생의 hasPaidThisMonth 값 추출
  3. UI에서 각 학생의 아바타 배경색 추출
  4. 각 학생에 대해 API 응답과 UI 표시가 일치하는지 검증
  5. - hasPaidThisMonth === true이면 bg-blue-100 클래스 확인
  6. - hasPaidThisMonth === false이면 bg-gray-200 클래스 확인
  7. 불일치하는 학생이 있으면 이름과 상태 로그 출력

**Expected Results:**
  - 모든 학생(16명)에 대해 API 응답의 hasPaidThisMonth 값과 UI 아바타 색상이 100% 일치
  - 불일치하는 케이스 0건
  - 납부 완료 학생 11명 모두 파란색 아바타
  - 미납 학생 5명 모두 회색 아바타

#### 1.5. 페이지 새로고침 - 데이터 일관성

**File:** `tests/student-list/page-refresh.spec.ts`

**Steps:**
  1. 학생 목록 페이지 로드
  2. 첫 번째 로드 시 학생 목록 데이터 저장 (이름, 납부 상태)
  3. 페이지 새로고침 (F5 또는 navigate 재호출)
  4. 로딩 완료 대기
  5. 두 번째 로드 시 학생 목록 데이터 저장
  6. 첫 번째와 두 번째 데이터 비교
  7. 학생 수, 순서, 납부 상태가 동일한지 확인

**Expected Results:**
  - 새로고침 전후 학생 수 동일 (16명)
  - 새로고침 전후 학생 순서 동일 (등록일 역순)
  - 새로고침 전후 각 학생의 납부 상태 동일
  - 새로고침 시 로딩 인디케이터가 짧게 표시된 후 데이터 로드
  - 콘솔에 에러 없음 (아바타 이미지 404 제외)

#### 1.6. 에러 처리 - 빈 학생 목록

**File:** `tests/student-list/empty-list.spec.ts`

**Steps:**
  1. API 요청을 인터셉트하여 빈 배열([]) 반환하도록 모킹
  2. 학생 목록 페이지 로드
  3. '총 0명의 학생이 있습니다' 텍스트 확인
  4. 테이블 body가 비어있는지 확인
  5. 에러 메시지가 표시되지 않는지 확인

**Expected Results:**
  - 빈 목록이 정상적으로 처리됨
  - '총 0명의 학생이 있습니다' 메시지 표시
  - 테이블 헤더는 표시되지만 데이터 행은 없음
  - 에러 메시지나 크래시 없음

#### 1.7. 에러 처리 - API 오류

**File:** `tests/student-list/api-error.spec.ts`

**Steps:**
  1. API 요청을 인터셉트하여 500 에러 반환하도록 모킹
  2. 학생 목록 페이지 로드
  3. 에러 메시지가 표시되는지 확인
  4. '데이터를 가져오는 중 오류가 발생했습니다' 또는 유사한 메시지 확인
  5. '다시 시도' 버튼이 표시되는지 확인

**Expected Results:**
  - API 에러 시 사용자에게 명확한 에러 메시지 표시
  - 페이지가 크래시하지 않음
  - '다시 시도' 버튼 제공
  - 콘솔에 에러 로그 출력

#### 1.8. 학생 아바타 초성 표시

**File:** `tests/student-list/avatar-initial.spec.ts`

**Steps:**
  1. 학생 목록 페이지 로드
  2. 각 학생 아바타 내부의 텍스트 추출
  3. 학생 이름의 첫 글자와 아바타 텍스트가 일치하는지 확인
  4. 예: '최원준' → '최', '김지유' → '김', '박시은' → '박'

**Expected Results:**
  - 모든 학생 아바타에 이름의 첫 글자가 표시됨
  - 아바타 텍스트가 학생 이름의 첫 글자와 100% 일치
  - 텍스트 색상은 납부 상태에 따라 달라짐 (blue-600 또는 gray-600)

#### 1.9. 테이블 스크롤 및 Sticky 컬럼

**File:** `tests/student-list/table-scroll.spec.ts`

**Steps:**
  1. 학생 목록 페이지 로드
  2. 테이블을 가로로 스크롤
  3. '학생명' 컬럼이 고정(sticky)되어 있는지 확인 (left: 0)
  4. '액션' 컬럼이 고정(sticky)되어 있는지 확인 (left: 100px)
  5. 스크롤 후에도 학생명과 액션 버튼이 보이는지 확인

**Expected Results:**
  - 학생명 컬럼이 왼쪽에 고정되어 스크롤 시에도 보임
  - 액션 컬럼이 학생명 옆에 고정되어 스크롤 시에도 보임
  - 나머지 컬럼은 가로 스크롤 시 이동함
  - sticky 컬럼의 z-index가 올바르게 설정되어 있음
