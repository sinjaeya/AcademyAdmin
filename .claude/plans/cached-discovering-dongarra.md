# 권한별 메뉴 접근 제어 구현 플랜

## 목표
1. DB `permissions` 테이블에 누락된 권한 카테고리 추가
2. 사이드바 모든 메뉴에 `requiredPermission` 지정
3. 권한 로드 실패 시 안전 처리

---

## Phase 1: DB 마이그레이션

### 1-1. 미사용 `documents.*` 권한 삭제 (4개)

```sql
DELETE FROM permissions WHERE category = 'documents';
```

### 1-2. 새 권한 추가 (3개)

```sql
INSERT INTO permissions (id, category, action, name, description, display_order) VALUES
  ('contents.manage', 'contents', 'manage', '콘텐츠 관리', '지문, 단어팡, 문장클리닉 콘텐츠 관리', 60),
  ('statistics.view', 'statistics', 'view', '통계 조회', '학습 통계 조회', 55),
  ('rag.manage', 'rag', 'manage', 'RAG 관리', 'RAG 파일, 추천주제, 로그 관리', 70);
```

### 1-3. 새 권한 기본 역할 할당

```sql
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('admin', 'contents.manage'),
  ('admin', 'statistics.view'),
  ('admin', 'rag.manage'),
  ('owner', 'contents.manage'),
  ('owner', 'statistics.view'),
  ('teacher', 'statistics.view');
```

---

## Phase 2: `src/lib/permissions.ts` 수정

### `getCategoryName()` 에 새 카테고리 추가 (라인 150-162)

```typescript
const names: Record<string, string> = {
  students: '학생 관리',
  payments: '결제 관리',
  users: '사용자 관리',
  academy: '학원 설정',
  reports: '리포트',
  contents: '콘텐츠 관리',   // 추가
  statistics: '통계',         // 추가
  rag: 'RAG 관리'             // 추가
};
```

---

## Phase 3: `src/components/layout/AdminSidebar.tsx` 수정

### 3-1. PERMISSION_IDS 상수 확장 (라인 55-60)

```typescript
const PERMISSION_IDS = {
  STUDENTS_VIEW: 'students.view',
  STUDENTS_EDIT: 'students.edit',     // 추가
  PAYMENTS_VIEW: 'payments.view',     // 추가
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',   // 추가 (현재 미사용이지만 예비)
  ACADEMY_SETTINGS: 'academy.settings',
  USERS_VIEW: 'users.view',
  CONTENTS_MANAGE: 'contents.manage', // 추가
  STATISTICS_VIEW: 'statistics.view', // 추가
  RAG_MANAGE: 'rag.manage'           // 추가
};
```

### 3-2. 메뉴별 requiredPermission 매핑

| 메뉴 | 현재 | 변경 후 | 변경 사유 |
|------|------|---------|----------|
| **OVERVIEW** | | | |
| 대시보드 | null | null | 모든 사용자 접근 |
| 실시간 국어 (v2) | null | null | 모든 사용자 접근 (사용자 결정) |
| 내손내줄 실시간 | null | null | 모든 사용자 접근 (사용자 결정) |
| 레벨테스트 | null | `reports.view` | 리포트 조회 권한 필요 |
| **ASSESSMENT** | | | |
| 레벨테스트 | null | `reports.view` | 위와 동일 |
| **STUDENT MANAGEMENT** | | | |
| 학생 관리 | `students.view` | `students.view` | 유지 |
| 풀스택-국어 카톡 발송 | null | `students.edit` | 학생/학부모 데이터 액션 |
| 등/하원 조회 | `students.view` | `students.view` | 유지 |
| 학습관리 | `reports.view` | `reports.view` | 유지 |
| 학습리포트 | `reports.view` | `reports.view` | 유지 |
| **STATISTICS** | | | |
| 통계 | null | `statistics.view` | 새 권한 |
| **CONTENTS** | | | |
| 콘텐츠 관리 | null | `contents.manage` | 새 권한 |
| RAG관리 | null | `rag.manage` | 새 권한 |
| **FINANCE** | | | |
| 학원비수납내역 | null | `payments.view` | 결제 조회 권한 필요 |
| **TEACHER** | | | |
| 지문가이드 | null | `reports.view` | 교육 도구, 리포트 권한에 포함 |
| **SETTINGS (서브메뉴)** | | | |
| 변수 관리 | null | `academy.settings` | 학원 설정 권한 필요 |
| 학원관리 | `academy.settings` | `academy.settings` | 유지 |
| 사용자 관리 | `users.view` | `users.view` | 유지 |
| 권한 관리 | admin hardcode | admin hardcode | 유지 |

### 3-3. 결과: 역할별 메뉴 가시성

현재 DB role_permissions 기준:

| 메뉴 | admin | owner | teacher | tutor |
|------|:-----:|:-----:|:-------:|:-----:|
| 대시보드 | ✅ | ✅ | ✅ | ✅ |
| 실시간 국어 | ✅ | ✅ | ✅ | ✅ |
| 내손내줄 실시간 | ✅ | ✅ | ✅ | ✅ |
| 레벨테스트 | ✅ | ✅ | ✅ | ✅ |
| 학생 관리 | ✅ | ✅ | ✅ | ✅ |
| 카톡 발송 | ✅ | ✅ | ✅ | ❌ |
| 등/하원 조회 | ✅ | ✅ | ✅ | ✅ |
| 학습관리 | ✅ | ✅ | ✅ | ✅ |
| 학습리포트 | ✅ | ✅ | ✅ | ✅ |
| 통계 | ✅ | ✅ | ✅ | ❌ |
| 콘텐츠 관리 | ✅ | ✅ | ❌ | ❌ |
| RAG관리 | ✅ | ❌ | ❌ | ❌ |
| 학원비수납내역 | ✅ | ✅ | ❌ | ❌ |
| 지문가이드 | ✅ | ✅ | ✅ | ✅ |
| 변수 관리 | ✅ | ❌ | ❌ | ❌ |
| 학원관리 | ✅ | ❌ | ❌ | ❌ |
| 사용자 관리 | ✅ | ✅ | ❌ | ❌ |
| 권한 관리 | ✅ | ❌ | ❌ | ❌ |

> ⚠️ **참고**: owner에게 `academy.settings` 권한이 없어 변수관리/학원관리 접근 불가.
> 이는 권한 관리 페이지에서 admin이 직접 추가 가능 (코드 변경 불필요).

### 3-4. 권한 로드 실패 시 안전 처리

**변경 전** (라인 283-285):
```typescript
// 권한 로딩 중이거나 비어있으면 → 모든 메뉴 표시 (위험!)
if (loadingPermissions || permissionIdsRef.current.length === 0) {
  return true;
}
```

**변경 후**:
```typescript
// 권한 로딩 중에는 대시보드만 표시
if (loadingPermissions) {
  return false;
}

// admin은 항상 모든 메뉴 접근 가능
if (user?.role_id === 'admin') {
  return true;
}

// 권한이 비어있으면 (로드 실패 등) → 숨김 처리
if (permissionIdsRef.current.length === 0) {
  return false;
}
```

**filteredCategories도 동일하게 수정** (라인 309-310):
```typescript
// 변경 전: 로딩 중 전체 메뉴 표시
if (loadingPermissions || permissionIdsRef.current.length === 0) {
  return navigationCategories;
}

// 변경 후: 로딩 중에는 필터링 적용 (hasPermission이 false 반환)
// → 별도 분기 제거, 항상 필터링 로직 실행
```

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| DB (마이그레이션) | documents 삭제, 3개 권한 추가, role_permissions 추가 |
| `src/lib/permissions.ts` | `getCategoryName()` 3개 카테고리 추가 |
| `src/components/layout/AdminSidebar.tsx` | PERMISSION_IDS 확장, 메뉴 매핑, 안전 처리 |

---

## 검증 방법

1. **DB 확인**: `SELECT * FROM permissions ORDER BY display_order` → documents 없고 새 3개 있는지
2. **DB 확인**: `SELECT * FROM role_permissions WHERE permission_id IN ('contents.manage','statistics.view','rag.manage')` → 6개 행
3. **빌드**: `npm run build` 성공
4. **브라우저 테스트**: 각 역할로 로그인하여 메뉴 가시성 확인
   - admin: 모든 메뉴 보임
   - owner: RAG관리, 변수관리, 학원관리, 권한관리 안 보임
   - teacher: 콘텐츠, RAG, 결제, 설정 안 보임
   - tutor: 카톡발송, 통계, 콘텐츠, RAG, 결제, 설정 안 보임
5. **권한 관리 페이지**: `/admin/settings/permissions` → 새 카테고리(콘텐츠관리, 통계, RAG관리) 표시 확인
