// 레벨테스트 어드민 타입 정의

// 학습 영역 타입
export type LevelTestQuestionType = 'vocab' | 'sentence' | 'reading' | 'suneung';

// 난이도 레벨
export type DifficultyLevel = 1 | 2 | 3;

// 테스트 상태
export type LevelTestStatus = 'in_progress' | 'completed' | 'abandoned';

// 영역별 한글 이름
export const QUESTION_TYPE_LABELS: Record<LevelTestQuestionType, string> = {
  vocab: '어휘력',
  sentence: '구조 파악',
  reading: '독해력',
  suneung: '종합 사고',
};

// 레벨 한글 이름
export const LEVEL_LABELS: Record<string, string> = {
  'Lv3_Mid1': '중1',
  'Lv4_Mid2': '중2',
  'Lv5_Mid3': '중3',
  'Lv6_High1': '고1',
  'Lv7_High2': '고2',
  'Lv8_High3': '고3',
};

// 장문 독해 유형 라벨
export const READING_TYPE_LABELS: Record<string, string> = {
  factual: '사실적 독해',
  inferential: '추론적 독해',
};

// 단문 구조 유형 라벨
export const STRUCTURE_TYPE_LABELS: Record<string, string> = {
  description: '설명',
  contrast: '비교·대조',
  problem_solution: '문제·해결',
  causal: '인과',
  argument: '주장·근거',
};

// 수능형 도메인 라벨
export const DOMAIN_LABELS: Record<string, string> = {
  humanities: '인문',
  science: '과학',
  social: '사회',
  arts: '예술',
  technology: '기술',
};

// 어휘 난이도 라벨
export const VOCAB_DIFFICULTY_LABELS: Record<string, string> = {
  '1': '기초 (중1)',
  '2': '중급 (중2)',
  '3': '심화 (중3)',
};

// 난이도 진행 상태
export interface DifficultyProgress {
  vocab: DifficultyLevel;
  sentence: DifficultyLevel;
  reading: DifficultyLevel;
  suneung: DifficultyLevel;
}

// 문제 진행 상태
export interface QuestionProgress {
  vocab: number;
  sentence: number;
  reading: number;
  suneung: number;
}

// 영역별 결과
export interface AreaResult {
  correct: number;
  total: number;
  avgDifficulty: number;
}

// 세션 결과
export interface LevelTestResults {
  vocab: AreaResult;
  sentence: AreaResult;
  reading: AreaResult;
  suneung: AreaResult;
  overall: AreaResult;
}

// 세분화 분석 타입
export interface DetailedAnalysis {
  overallComments: string[];
  readingByType: {
    factual: { correct: number; total: number };
    inferential: { correct: number; total: number };
  };
  sentenceByStructure: Record<string, { correct: number; total: number }>;
  suneungByDomain: Record<string, { correct: number; total: number }>;
  vocabByDifficulty: Record<string, { correct: number; total: number }>;
  avgTimeByArea: Record<string, { avgMs: number; count: number }>;
}

// 세션 DB 타입 (목록용)
export interface LevelTestSession {
  id: string;
  student_id: number;
  student_name?: string; // JOIN으로 가져옴
  status: LevelTestStatus;
  started_at: string;
  completed_at: string | null;
  elapsed_seconds: number | null;
  initial_difficulty: DifficultyLevel;
  current_difficulty: DifficultyProgress;
  progress: QuestionProgress;
  results: LevelTestResults | null;
  recommended_level: string | null;
  created_at: string;
}

// 개별 답안 DB 타입
export interface LevelTestResultItem {
  id: string;
  session_id: string;
  student_id: number;
  question_type: LevelTestQuestionType;
  question_index: number;
  item_id: number | null;
  item_uuid: string | null;
  difficulty: DifficultyLevel;
  selected_answer: number | null;
  correct_answer: number;
  is_correct: boolean;
  time_spent_ms: number | null;
  sub_type: string | null;
  category_id: string | null;
  keywords: string[] | null;
  answered_at: string;
}

// 세션 상세 (결과 포함)
export interface LevelTestSessionDetail extends LevelTestSession {
  student_school?: string | null;
  student_grade?: string | null;
  academy_name?: string | null;
  academy_logo_url?: string | null;
  academy_phone?: string | null;
  academy_email?: string | null;
  results_items: LevelTestResultItem[];
  analysis?: DetailedAnalysis;
}

// API 목록 응답
export interface LevelTestListResponse {
  success: boolean;
  data: LevelTestSession[];
  total: number;
  page: number;
  pageSize: number;
}

// API 상세 응답
export interface LevelTestDetailResponse {
  success: boolean;
  data: LevelTestSessionDetail;
}

// 등급 계산 함수
export function getGrade(rate: number): { label: string; color: string } {
  if (rate >= 90) return { label: 'S', color: '#8B5CF6' }; // purple
  if (rate >= 80) return { label: 'A', color: '#22C55E' }; // green
  if (rate >= 70) return { label: 'B', color: '#3B82F6' }; // blue
  if (rate >= 60) return { label: 'C', color: '#F59E0B' }; // amber
  return { label: 'D', color: '#F87171' }; // red
}

// 정답률 계산
export function calculateRate(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

// 소요 시간 포맷
export function formatElapsedTime(seconds: number | null): string {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}분 ${secs}초`;
}

// 날짜 포맷
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// 상태 한글 변환
export function getStatusLabel(status: LevelTestStatus): string {
  switch (status) {
    case 'completed': return '완료';
    case 'in_progress': return '진행중';
    case 'abandoned': return '중단';
    default: return status;
  }
}

// 상태별 색상
export function getStatusColor(status: LevelTestStatus): string {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700';
    case 'in_progress': return 'bg-blue-100 text-blue-700';
    case 'abandoned': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
