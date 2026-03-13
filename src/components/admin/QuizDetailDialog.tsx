'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LearningRecord } from '@/types/realtime-korean';

// 퀴즈 타입 라벨
const quizTypeLabels: Record<string, string> = {
  'cloze': '빈칸',
  'comprehension': '이해',
  'inference': '추론',
  'relation': '관계'
};

// 내손내줄 문제 유형 라벨 (sort_order 기준)
const hwQuizTypeLabels: Record<number, string> = {
  1: '사실확인',
  2: '사실확인',
  3: '추론',
  4: '[보기]',
  5: '단어'
};

// 선택지 번호 원문자
const circledNumbers = ['①', '②', '③', '④', '⑤'];

interface QuizDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: LearningRecord | null;
}

// 퀴즈 목록 렌더링 (공용)
function QuizList({ quizzes }: {
  quizzes: Array<{
    label: string;
    question: string;
    options: string[];
    correctAnswer: number;
    selectedAnswer: number | null;
    isCorrect: boolean | null;
    explanation?: string;
  }>;
}) {
  if (quizzes.length === 0) {
    return <p className="text-center text-gray-400 py-4">퀴즈 데이터가 없습니다</p>;
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz, idx) => (
        <div key={idx} className="border rounded-lg p-4">
          {/* 문제 헤더 */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {quiz.label}
            </Badge>
            {quiz.isCorrect !== null && (
              <span className={`text-sm font-bold ${quiz.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {quiz.isCorrect ? '정답' : '오답'}
              </span>
            )}
            {quiz.isCorrect === null && (
              <span className="text-sm text-gray-400">미응답</span>
            )}
          </div>

          {/* 문제 텍스트 */}
          {quiz.question && (
            <p className="text-sm text-gray-800 mb-3 font-medium">{quiz.question}</p>
          )}

          {/* 선택지 */}
          {quiz.options.length > 0 && (
            <div className="grid grid-cols-1 gap-1.5 mb-3">
              {quiz.options.map((option, optIdx) => {
                const optNum = optIdx + 1;
                const isCorrectOption = optNum === quiz.correctAnswer;
                const isStudentChoice = optNum === quiz.selectedAnswer;

                let bgClass = 'bg-white border-gray-200';
                if (isCorrectOption && isStudentChoice) {
                  bgClass = 'bg-green-50 border-green-300';
                } else if (isStudentChoice && !isCorrectOption) {
                  bgClass = 'bg-red-50 border-red-300';
                } else if (isCorrectOption && quiz.selectedAnswer !== null) {
                  bgClass = 'bg-green-50 border-green-200';
                }

                return (
                  <div
                    key={optIdx}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border text-sm ${bgClass}`}
                  >
                    <span className="text-gray-500 shrink-0">
                      {circledNumbers[optIdx] || `${optNum}.`}
                    </span>
                    <span className="flex-1">{option}</span>
                    {isStudentChoice && (
                      <span className={`text-xs font-medium shrink-0 ${isCorrectOption ? 'text-green-600' : 'text-red-600'}`}>
                        학생 선택
                      </span>
                    )}
                    {isCorrectOption && !isStudentChoice && quiz.selectedAnswer !== null && (
                      <span className="text-xs font-medium text-green-600 shrink-0">정답</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 해설 */}
          {quiz.explanation && (
            <div className="bg-blue-50 rounded px-3 py-2">
              <p className="text-xs text-blue-800">
                <span className="font-medium">해설:</span> {quiz.explanation}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 지문 텍스트 렌더링 (<u> 태그 지원)
function PassageView({ text }: { text: string }) {
  // <u>...</u> 태그만 허용하여 렌더링
  const parts = text.split(/(<u>.*?<\/u>)/g);
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
        {parts.map((part, i) => {
          const match = part.match(/^<u>(.*?)<\/u>$/);
          if (match) {
            return <u key={i} className="underline decoration-2">{match[1]}</u>;
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        })}
      </p>
    </div>
  );
}

export function QuizDetailDialog({ open, onOpenChange, record }: QuizDetailDialogProps) {
  if (!record) return null;

  const isSentenceClinic = record.learningType === 'sentence_clinic_v2';
  const isHandwriting = record.learningType === 'handwriting';
  const detail = isSentenceClinic ? record.sentenceClinicV2Detail : null;
  const hwDetail = isHandwriting ? record.handwritingDetail : null;

  // 퀴즈 데이터 통합
  const quizzes = isSentenceClinic && detail
    ? detail.quizzes.map(q => ({
        label: quizTypeLabels[q.quizType] || q.quizType,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedAnswer: q.selectedAnswer,
        isCorrect: q.isCorrect,
        explanation: q.explanation
      }))
    : isHandwriting && hwDetail?.quizzes
    ? hwDetail.quizzes.map(q => ({
        label: hwQuizTypeLabels[q.sortOrder] || `${q.sortOrder}번`,
        question: q.question || '',
        options: q.options || [],
        correctAnswer: q.correctAnswer ?? 0,
        selectedAnswer: q.selectedAnswer ?? null,
        isCorrect: q.isCorrect,
        explanation: q.explanation
      }))
    : [];

  const title = isSentenceClinic ? '문장클리닉 상세' : '내손내줄 상세';
  const badgeText = isSentenceClinic ? detail?.keyword : hwDetail?.passageCode;
  const badgeClass = isSentenceClinic
    ? 'bg-purple-100 text-purple-700 border-purple-200'
    : 'bg-amber-100 text-amber-700 border-amber-200';

  // 지문 텍스트
  const passageText = isSentenceClinic ? detail?.text : hwDetail?.passageText;
  const hasPassage = !!passageText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            {badgeText && (
              <Badge className={`${badgeClass} text-sm`}>
                {badgeText}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {hasPassage ? (
          <Tabs defaultValue="passage">
            <TabsList className="w-full">
              <TabsTrigger value="passage" className="flex-1">지문</TabsTrigger>
              <TabsTrigger value="quiz" className="flex-1">
                문제 ({quizzes.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="passage" className="mt-3">
              <PassageView text={passageText!} />
            </TabsContent>
            <TabsContent value="quiz" className="mt-3">
              <QuizList quizzes={quizzes} />
            </TabsContent>
          </Tabs>
        ) : (
          // 지문이 없으면 퀴즈만 바로 표시
          <QuizList quizzes={quizzes} />
        )}
      </DialogContent>
    </Dialog>
  );
}
