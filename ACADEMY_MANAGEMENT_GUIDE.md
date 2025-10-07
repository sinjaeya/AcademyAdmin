# 학원관리 시스템 가이드

## 개요
좌측 "설정" 메뉴 하위의 "학원관리" 메뉴를 통해 academy 테이블의 CRUD 기능을 제공하는 시스템입니다.

## 기능 소개

### 🏫 학원관리 메뉴
- **위치**: 좌측 사이드바 > 설정 > 학원관리
- **경로**: `/admin/settings/academy`

### 📋 주요 기능

#### 1. 학원 목록 조회
- 등록된 모든 학원을 카드 형태로 표시
- 학원명, 주소, 전화번호, 이메일, 웹사이트, 설명 정보 표시
- 활성/비활성 상태 표시
- 생성일 기준 내림차순 정렬

#### 2. 학원 추가
- "학원 추가" 버튼 클릭으로 새 학원 등록
- 필수 항목: 학원명
- 선택 항목: 주소, 전화번호, 이메일, 웹사이트, 로고 URL, 설명
- 활성 상태 설정 가능

#### 3. 학원 수정
- 각 학원 카드의 "수정" 버튼으로 정보 변경
- 모든 필드 수정 가능
- 활성/비활성 상태 변경 가능

#### 4. 학원 삭제
- 각 학원 카드의 "삭제" 버튼으로 학원 제거
- 해당 학원에 연결된 사용자가 있으면 삭제 불가
- 삭제 확인 다이얼로그 표시

## 데이터베이스 구조

### Academy 테이블
```sql
CREATE TABLE academy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                    -- 학원명 (필수)
  address TEXT,                          -- 주소
  phone TEXT,                            -- 전화번호
  email TEXT,                            -- 이메일
  website TEXT,                          -- 웹사이트
  description TEXT,                      -- 설명
  logo_url TEXT,                         -- 로고 URL
  settings JSONB DEFAULT '{}',           -- 추가 설정
  is_active BOOLEAN DEFAULT true,        -- 활성 상태
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API 엔드포인트

### 1. 학원 목록 조회
```
GET /api/admin/academy
```
**응답:**
```json
{
  "success": true,
  "academies": [
    {
      "id": "uuid",
      "name": "학원명",
      "address": "주소",
      "phone": "전화번호",
      "email": "이메일",
      "website": "웹사이트",
      "description": "설명",
      "logo_url": "로고URL",
      "is_active": true,
      "created_at": "2025-10-07T05:50:28.005378Z",
      "updated_at": "2025-10-07T05:50:28.005378Z"
    }
  ]
}
```

### 2. 학원 추가
```
POST /api/admin/academy
```
**요청 본문:**
```json
{
  "name": "학원명",
  "address": "주소",
  "phone": "전화번호",
  "email": "이메일",
  "website": "웹사이트",
  "description": "설명",
  "logo_url": "로고URL",
  "is_active": true
}
```

### 3. 학원 수정
```
PUT /api/admin/academy/[id]
```
**요청 본문:** (추가와 동일)

### 4. 학원 삭제
```
DELETE /api/admin/academy/[id]
```

## 보안 및 권한

### RLS (Row Level Security)
- 인증된 사용자는 모든 academy 정보 조회 가능
- 서비스 역할은 모든 academy 정보 관리 가능
- 일반 사용자는 academy 정보를 읽기 전용으로 접근

### 삭제 제한
- 해당 학원에 연결된 사용자(`user_role` 테이블의 `academy_id`)가 있으면 삭제 불가
- 안전한 데이터 삭제를 위한 참조 무결성 보장

## 사용 예시

### 1. 새 학원 추가
1. 좌측 사이드바에서 "설정" > "학원관리" 클릭
2. "학원 추가" 버튼 클릭
3. 학원명 입력 (필수)
4. 추가 정보 입력 (선택)
5. "추가" 버튼 클릭

### 2. 학원 정보 수정
1. 수정할 학원 카드의 "수정" 버튼 클릭
2. 정보 수정
3. "수정" 버튼 클릭

### 3. 학원 삭제
1. 삭제할 학원 카드의 "삭제" 버튼 클릭
2. 확인 다이얼로그에서 "확인" 클릭

## 현재 테스트 데이터

시스템에 4개의 테스트 학원이 등록되어 있습니다:

1. **테스트 학원** (활성)
   - 주소: 서울시 강남구 테스트로 123
   - 전화: 02-1234-5678
   - 이메일: info@testacademy.com

2. **이지국어교습소** (활성)
   - 주소: 서울시 서초구 서초대로 456
   - 전화: 02-5678-9012
   - 이메일: contact@eazykorean.com

3. **수학의 신** (활성)
   - 주소: 서울시 강남구 테헤란로 789
   - 전화: 02-3456-7890
   - 이메일: info@mathking.com

4. **영어마스터** (비활성)
   - 주소: 서울시 송파구 올림픽로 321
   - 전화: 02-9876-5432
   - 이메일: hello@englishmaster.com

## 확장 가능성

### 추가 기능 아이디어
1. **학원 검색 및 필터링**: 학원명, 주소, 상태별 검색
2. **학원별 사용자 수 표시**: 각 학원에 연결된 사용자 수 표시
3. **대량 삭제**: 여러 학원을 한 번에 삭제
4. **학원 복사**: 기존 학원 정보를 복사하여 새 학원 생성
5. **학원 통계**: 학원별 사용자 통계 및 활동 현황

### 다른 테이블과의 연동
- `user_role` 테이블과 연결되어 사용자-학원 관계 관리
- 향후 `students`, `payments` 등 다른 테이블에도 `academy_id` 추가 가능
