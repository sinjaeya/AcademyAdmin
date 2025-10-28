# 개발 가이드 및 규칙

## 📝 Git 커밋 정책

### ✅ **커밋 규칙**
- **자동 커밋 금지**: 변경사항이 있어도 자동으로 커밋하지 않음
- **사전 요청 필수**: 커밋하기 전에 항상 사용자에게 요청
- **한글 커밋 메시지**: 한글로 작성 (UTF-8 인코딩 설정 완료)

### 🔧 **Git 설정 (완료됨)**
```bash
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
chcp 65001  # 콘솔 코드페이지 UTF-8로 변경
```

### 📋 **커밋 프로세스**
1. 코드 변경사항 확인
2. 커밋 메시지 제안
3. 사용자 승인 후 커밋 실행
4. 한글 메시지로 작성

## 🚀 환경변수 관리

### ✅ **현재 설정**
- **필수**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **선택적**: `SUPABASE_SERVICE_ROLE_KEY` (사용자 생성 기능이 필요한 경우에만)

### 📁 **파일 구조**
- `.env.local`: 로컬 개발용 (Git 무시됨)
- `.env.example`: 환경변수 템플릿 (Git 포함됨)
- `ENVIRONMENT_SETUP.md`: 상세 설정 가이드

### 🔧 **환경변수 검증**
- `src/lib/env.ts`에서 환경변수 검증 및 관리
- Service Role Key 없어도 기본 기능 정상 작동
- 경고 메시지만 출력 (에러 아님)

## 🎯 프로젝트 상태

### ✅ **완료된 작업**
- TypeScript 에러 모두 해결
- ESLint 경고 모두 제거
- 환경변수 분리 관리 구조 구축
- Supabase 연결 정상화
- 빌드 성공 확인

### 🔑 **로그인 정보**
- **이메일**: `admin@example.com`
- **비밀번호**: `password1234`
- **URL**: http://localhost:3000

### 📊 **데이터베이스 상태**
- **학원 데이터**: 3개 학원 등록됨
- **사용자 데이터**: admin@example.com 사용자 등록됨
- **역할 설정**: admin 역할로 설정됨

## 🛠️ 개발 서버

### 📍 **실행 정보**
- **포트**: 3000 (또는 3001)
- **명령어**: `npm run dev`
- **상태**: 정상 실행 중

### 🔍 **확인된 기능**
- 로그인 페이지 정상 작동
- 관리자 대시보드 접근 가능
- 학원 관리 페이지 정상 작동
- 학생 관리 페이지 정상 작동
- 환경변수 검증 로직 작동

## 📋 다음 작업 시 참고사항

### 🔄 **커밋 시**
- 변경사항 확인 후 커밋 메시지 제안
- 사용자 승인 후 실행
- 한글로 메시지 작성

### 🚀 **배포 시**
- Vercel 환경변수 설정 필요
- `ENVIRONMENT_SETUP.md` 참조
- Service Role Key는 선택사항

### 🐛 **문제 해결**
- 환경변수 문제: `src/lib/env.ts` 확인
- Supabase 연결: `.env.local` 파일 확인
- 빌드 에러: TypeScript 타입 확인

## 🎨 UI/UX 개발 규칙

### 📌 **버튼 스타일 가이드**

#### ✅ **필수 규칙**
모든 클릭 가능한 버튼과 인터랙티브 요소는 반드시 다음 규칙을 따릅니다:

1. **마우스 커서 스타일**
   - 모든 `<button>` 요소에 `cursor-pointer` 클래스 추가
   - 비활성화된 버튼은 `disabled:cursor-not-allowed` 추가
   
   ```tsx
   // ✅ 올바른 예시
   <button
     onClick={handleClick}
     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
   >
     버튼 텍스트
   </button>

   // ✅ 비활성화 버튼 예시
   <button
     disabled={isLoading}
     className="px-4 py-2 bg-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
   >
     버튼 텍스트
   </button>

   // ❌ 잘못된 예시 (cursor-pointer 누락)
   <button
     onClick={handleClick}
     className="px-4 py-2 bg-blue-600 text-white rounded"
   >
     버튼 텍스트
   </button>
   ```

2. **호버 효과**
   - 모든 버튼에 `hover:` 상태 스타일 적용
   - 색상 변경, 그림자 추가 등으로 시각적 피드백 제공
   
   ```tsx
   // ✅ 호버 효과 예시
   className="bg-blue-600 hover:bg-blue-700 hover:shadow-lg cursor-pointer"
   ```

3. **트랜지션 효과**
   - 부드러운 전환을 위해 `transition-colors` 또는 `transition-all` 추가
   
   ```tsx
   className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
   ```

#### 🔍 **적용 대상**
- 일반 버튼 (`<button>`)
- 링크 버튼 (`<a>` with `role="button"`)
- 아이콘 버튼
- 모달 닫기 버튼
- 폼 제출 버튼
- 팝업 내 액션 버튼
- 기타 모든 클릭 가능한 UI 요소

#### 📝 **체크리스트**
새로운 버튼을 추가할 때 다음 사항을 확인하세요:

- [ ] `cursor-pointer` 클래스 추가
- [ ] `hover:` 상태 스타일 추가
- [ ] `transition-colors` 또는 `transition-all` 추가
- [ ] 비활성화 상태가 있다면 `disabled:cursor-not-allowed` 추가
- [ ] 접근성을 위한 적절한 `aria-label` 또는 텍스트 제공

#### 🎯 **컴포넌트별 예시**

**모달 버튼**
```tsx
// 액션 버튼
<button
  onClick={handleSubmit}
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
>
  확인
</button>

// 닫기 버튼
<button
  onClick={handleClose}
  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
>
  <X className="h-6 w-6" />
</button>
```

**폼 버튼**
```tsx
<button
  type="submit"
  disabled={isSubmitting}
  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSubmitting ? '처리 중...' : '제출'}
</button>
```

### 🪟 **모달(팝업) 개발 가이드**

#### ✅ **필수 규칙**
모든 전체 화면 모달(팝업 레이어)은 반드시 다음 규칙을 따릅니다:

1. **배경 클릭으로 닫기**
   - 모달 배경(오버레이)을 클릭하면 모달이 닫혀야 함
   - 모달 내부 컨텐츠 클릭 시에는 닫히지 않도록 이벤트 전파 중단
   
   ```tsx
   // ✅ 올바른 예시
   {showModal && (
     <div 
       className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
       onClick={() => setShowModal(false)}  // 배경 클릭 시 닫기
     >
       <div 
         className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4"
         onClick={(e) => e.stopPropagation()}  // 모달 컨텐츠 클릭 시 이벤트 전파 중단
       >
         {/* 모달 내용 */}
       </div>
     </div>
   )}

   // ❌ 잘못된 예시 (배경 클릭으로 닫기 없음)
   {showModal && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
       <div className="bg-white rounded-lg shadow-xl">
         {/* 모달 내용 */}
       </div>
     </div>
   )}
   ```

2. **닫기 버튼 제공**
   - 명시적인 닫기 버튼(X 버튼)을 항상 제공
   - 일반적으로 모달 헤더 우측 상단에 배치
   
   ```tsx
   <button
     onClick={() => setShowModal(false)}
     className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
     aria-label="모달 닫기"
   >
     <X className="h-6 w-6" />
   </button>
   ```

3. **ESC 키로 닫기 (선택사항)**
   - 사용자 경험 향상을 위해 ESC 키로도 모달을 닫을 수 있도록 구현 권장
   
   ```tsx
   useEffect(() => {
     const handleEscape = (e: KeyboardEvent) => {
       if (e.key === 'Escape') {
         setShowModal(false);
       }
     };
     
     if (showModal) {
       document.addEventListener('keydown', handleEscape);
       return () => document.removeEventListener('keydown', handleEscape);
     }
   }, [showModal]);
   ```

#### 🎯 **모달 구조 템플릿**

```tsx
{showModal && (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    onClick={handleClose}
  >
    <div 
      className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] mx-4 flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 모달 헤더 */}
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900">모달 제목</h2>
        <div className="flex items-center gap-2">
          {/* 액션 버튼들 */}
          <button
            onClick={handleAction}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
          >
            확인
          </button>
          {/* 닫기 버튼 */}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="모달 닫기"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* 모달 내용 */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 컨텐츠 */}
      </div>
    </div>
  </div>
)}
```

#### 📝 **체크리스트**
새로운 모달을 추가할 때 다음 사항을 확인하세요:

- [ ] 배경 클릭 시 모달 닫기 (`onClick` on overlay)
- [ ] 모달 컨텐츠 클릭 시 이벤트 전파 중단 (`e.stopPropagation()`)
- [ ] 명시적인 닫기 버튼 제공
- [ ] 닫기 버튼에 `aria-label` 추가 (접근성)
- [ ] `z-50` 이상의 z-index 설정
- [ ] 배경 오버레이에 반투명 검은색 (`bg-black bg-opacity-50`)
- [ ] 모달 컨텐츠에 적절한 max-width 설정
- [ ] 스크롤이 필요한 경우 `overflow-y-auto` 설정
- [ ] (선택) ESC 키로 닫기 기능 구현

#### ⚠️ **주의사항**
- 모달이 열릴 때 배경 스크롤 방지가 필요한 경우 `document.body.style.overflow = 'hidden'` 설정
- 모달이 닫힐 때 스크롤 복원 `document.body.style.overflow = ''`
- 여러 모달이 중첩되는 경우 z-index 관리에 주의

## 📚 관련 문서
- `README.md`: 프로젝트 개요
- `ENVIRONMENT_SETUP.md`: 환경변수 설정 가이드
- `src/lib/env.ts`: 환경변수 관리 로직
- `.env.example`: 환경변수 템플릿
