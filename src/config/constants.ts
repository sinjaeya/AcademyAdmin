// 학년 옵션
export const GRADE_OPTIONS = [
  '초1',
  '초2',
  '초3',
  '초4',
  '초5',
  '초6',    
  '중1',
  '중2', 
  '중3',
  '고1',
  '고2',
  '고3'
] as const;

// 학교 옵션 (예시)
export const SCHOOL_OPTIONS = [
    '동명초',
    '연동초',
    '연제중',
    '연산중',    
  '연제고',
  '예술고',
  '문화고'  
] as const;

// 학원 옵션 (예시)
export const ACADEMY_OPTIONS = [
  '이지국어교습소',
  '이지수학교습소'
] as const;

// 학원 옵션 (예시)
export const STATUS_OPTIONS = [
    '재원',
    '휴원',
    '해지'
  ] as const;

// 타입 정의
export type GradeOption = typeof GRADE_OPTIONS[number];
export type SchoolOption = typeof SCHOOL_OPTIONS[number];
export type AcademyOption = typeof ACADEMY_OPTIONS[number];
export type StatusOption = typeof STATUS_OPTIONS[number];

