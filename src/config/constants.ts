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

// 보호자 타입 옵션
export const PARENT_TYPE_OPTIONS = [
  '엄마',
  '아빠',
  '할아버지',
  '할머니',
  '기타'
] as const;

// 입금방법 옵션
export const PAYMENT_METHOD_OPTIONS = [
  '무통장',
  '카드'
] as const;

// 해당월 옵션
export const STUDY_MONTH_OPTIONS = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월'
] as const;

// 루브릭 학년 레벨 옵션
export const RUBRIC_GRADE_LEVEL_OPTIONS = [
  'middle',
  'high'
] as const;

// 루브릭 난이도 레벨 옵션
export const RUBRIC_DIFFICULTY_LEVEL_OPTIONS = [
  'medium',
  'advanced',
  'highest',
  'extreme',
  'high_mock_1',
  'high_mock_2',
  'high_mock_3',
  'csat'
] as const;

// 루브릭 학년 레벨 라벨 (한글)
export const RUBRIC_GRADE_LEVEL_LABELS: Record<string, string> = {
  middle: '중학교',
  high: '고등학교'
};

// 루브릭 난이도 레벨 라벨 (한글)
export const RUBRIC_DIFFICULTY_LEVEL_LABELS: Record<string, string> = {
  medium: '중급',
  advanced: '고급',
  highest: '최고급',
  extreme: '극상급',
  high_mock_1: '고1 모의고사',
  high_mock_2: '고2 모의고사',
  high_mock_3: '고3 모의고사',
  csat: '수능'
};

// 타입 정의
export type GradeOption = typeof GRADE_OPTIONS[number];
export type SchoolOption = typeof SCHOOL_OPTIONS[number];
export type AcademyOption = typeof ACADEMY_OPTIONS[number];
export type StatusOption = typeof STATUS_OPTIONS[number];
export type ParentType = typeof PARENT_TYPE_OPTIONS[number];
export type PaymentMethod = typeof PAYMENT_METHOD_OPTIONS[number];
export type StudyMonth = typeof STUDY_MONTH_OPTIONS[number];
export type RubricGradeLevel = typeof RUBRIC_GRADE_LEVEL_OPTIONS[number];
export type RubricDifficultyLevel = typeof RUBRIC_DIFFICULTY_LEVEL_OPTIONS[number];

