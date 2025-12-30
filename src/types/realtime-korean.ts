// 풀스택-국어 실시간뷰 공통 타입 정의

// 학습 유형
export type LearningType = 'word_pang' | 'passage_quiz' | 'sentence_clinic';

// 문장클리닉 상세 정보
export interface SentenceClinicDetail {
  keyword: string;
  text: string;
  // 빈칸 문제
  clozeSummary: string;
  clozeOptions: string[];
  clozeAnswer: number;
  clozeSelectedAnswer: number | null;
  clozeIsCorrect: boolean | null;
  clozeExplanation: string;
  // 키워드 문제
  keywordQuestion: string;
  keywordOptions: string[];
  keywordAnswer: number;
  keywordSelectedAnswer: number | null;
  keywordIsCorrect: boolean | null;
  keywordExplanation: string;
}

// 보물찾기 O/X 문제 상세
export interface PassageQuizDetail {
  statement: string;
  oxType: string;
  isCorrect: boolean;
  answer: string;
}

// 학습 기록
export interface LearningRecord {
  id: string;
  studentId: number;
  studentName: string;
  learningType: LearningType;
  startedAt: string;
  completedAt: string | null;
  totalItems: number;
  correctCount: number;
  accuracyRate: number;
  // 단어팡 전용
  correctWords?: string[];
  wrongWords?: string[];
  // 문장클리닉 전용
  sentenceClinicDetail?: SentenceClinicDetail;
  // 보물찾기 전용
  passageQuizDetails?: PassageQuizDetail[];
}

// 학생별 문제 수 카운트
export interface StudentWordCount {
  wordPangCount: number;
  wordPangCorrect: number;
  passageQuizCount: number;
  passageQuizCorrect: number;
}

// 학생별 누적 정답률 (오늘 이전)
export interface StudentHistoricalAccuracy {
  wordPangTotal: number;
  wordPangCorrect: number;
  wordPangAccuracyRate: number | null;
}

// 학생별 요약
export interface StudentSummary {
  studentId: number;
  studentName: string;
  currentActivity: LearningType | null;
  wordPang: {
    count: number;
    correctCount: number;
    accuracyRate: number;
  };
  passageQuiz: {
    sessionCount: number;
    count: number;
    correctCount: number;
    accuracyRate: number;
  };
  sentenceClinic: {
    count: number;
    correctCount: number;
    accuracyRate: number;
    reviewCount: number; // 복습 대상 지문 수
  };
  records: LearningRecord[];
  historicalAccuracy?: StudentHistoricalAccuracy;
}

// API 응답
export interface RealtimeKoreanApiResponse {
  data: LearningRecord[];
  wordCounts: Record<number, StudentWordCount>;
  historicalAccuracy: Record<number, StudentHistoricalAccuracy>;
  reviewCounts: Record<number, number>; // 학생별 문장클리닉 복습 대상 카운트
}
