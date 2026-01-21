# 레벨테스트 인쇄 출력 개선 플랜

## 대상 파일
- `src/app/admin/level-test/report/[sessionId]/page.tsx`

## 문제점 및 해결 방안

### 1. 푸터 연락처 하드코딩 (우선순위: 높음)
**현재**: 641줄에 `연락처: 010-3745-9631` 하드코딩
**해결**: `session.academy_phone` 사용하여 동적 처리

```typescript
// 변경 전
<p className="text-xl text-gray-600">연락처: 010-3745-9631</p>

// 변경 후
{session.academy_phone && (
  <p className="text-xl text-gray-600">연락처: {session.academy_phone}</p>
)}
```

### 2. 차트 인쇄 미지원 (우선순위: 중간)
**현재**: 레이더차트(342줄), 막대그래프(397줄)가 `print:hidden`
**해결 옵션**:
- A안: 현재 유지 (인쇄용 그리드로 대체)
- B안: 차트도 인쇄에 포함 (`print:hidden` 제거)

→ **A안 권장**: 차트는 인쇄 시 깨질 수 있어 현재 그리드 방식 유지

### 3. 페이지 나눔 제어 부족 (우선순위: 중간)
**현재**: `page-break-inside-avoid`가 세분화 분석 전체에만 적용 (437줄)
**해결**: 각 섹션별로 개별 적용

적용 대상 섹션:
- 학생 정보 섹션 (212줄)
- 핵심 결과 섹션 (249줄)
- 영역별 성취도 섹션 (286줄)
- 어휘 난이도별 분석 (440줄)
- 글 구조 파악 분석 (472줄)
- 독해 유형 분석 (509줄)
- 수능형 도메인별 분석 (550줄)
- 영역별 평균 풀이 시간 (579줄)
- 종합 분석 코멘트 (615줄)

### 4. 인쇄 스타일 보강 (우선순위: 낮음)
**현재**: body에만 색상 보존 적용
**해결**: 전체 요소에 색상 보존 적용

```css
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
```

## 구현 순서

1. 푸터 연락처 동적 처리
2. 각 섹션에 `page-break-inside-avoid` 클래스 추가
3. 인쇄 스타일 보강 (색상 보존 전체 적용)

## 검증 방법

1. 브라우저에서 `/admin/level-test/report/[sessionId]` 접속
2. 인쇄 버튼 클릭 또는 Ctrl+P
3. 확인 항목:
   - 푸터에 학원 연락처가 표시되는지
   - 섹션이 페이지 중간에서 잘리지 않는지
   - 배경색이 정상 출력되는지
