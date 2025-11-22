'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft } from 'lucide-react';

interface PassageDetail {
  code_id: string;
  content: string | null;
  rubric_grade_level: string | null;
  rubric_difficulty_level: string | null;
  keyword_list: string[] | string | null;
  char_count: number | null;
  paragraph_count: number | null;
  qa_status: string | null;
}

interface QuizResult {
  quiz_id: string;
  statement: string;
  correct_answer: string;
  student_answer: string | null;
  is_correct: boolean | null;
  evidence: string;
  reasoning: string;
  quiz_order: number;
  ox_type: string;
  difficulty_level: number;
}

export default function PassageDetailPage({ 
  params 
}: { 
  params: Promise<{ studentId: string; code: string }> 
}) {
  const [studentId, setStudentId] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [passage, setPassage] = useState<PassageDetail | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.studentId;
      const passageCode = resolvedParams.code;
      
      setStudentId(id);
      setCode(passageCode);
      
      const name = searchParams.get('name') || '';
      setStudentName(name);

      try {
        setLoading(true);
        const response = await fetch(`/api/admin/contents/passages/${encodeURIComponent(passageCode)}`);
        if (!response.ok) {
          throw new Error('지문 상세를 가져오는데 실패했습니다.');
        }
        const data = await response.json();
        setPassage(data);
      } catch (error) {
        console.error('Error loading passage detail:', error);
        toast({
          type: 'error',
          description: '지문 상세를 불러오는 중 오류가 발생했습니다.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params, searchParams, toast]);

  // OX 퀴즈 결과 로드
  useEffect(() => {
    const loadQuizResults = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.studentId;
      const passageCode = resolvedParams.code;

      try {
        setLoadingQuizzes(true);
        const response = await fetch(`/api/admin/teacher/passage-guide/${id}/${encodeURIComponent(passageCode)}/quiz`);
        if (!response.ok) {
          throw new Error('퀴즈 결과를 가져오는데 실패했습니다.');
        }
        const result = await response.json();
        setQuizResults(result.data || []);
      } catch (error) {
        console.error('Error loading quiz results:', error);
        // 퀴즈 결과가 없어도 에러로 표시하지 않음
        setQuizResults([]);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    if (code && studentId) {
      loadQuizResults();
    }
  }, [params, code, studentId]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/teacher/passage-guide/${studentId}?name=${encodeURIComponent(studentName)}`)}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">지문 상세</h1>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                지문을 불러오는 중...
              </div>
            </CardContent>
          </Card>
        ) : !passage ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                지문을 찾을 수 없습니다
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 지문 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>지문 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">지문 코드</p>
                    <Badge variant="outline" className="text-sm font-semibold px-3 py-1.5">
                      {passage.code_id}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">학년</p>
                    <p className="font-medium">{passage.rubric_grade_level || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">난이도</p>
                    <p className="font-medium">{passage.rubric_difficulty_level || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">상태</p>
                    <Badge variant="secondary">{passage.qa_status || '-'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">문자 수</p>
                    <p className="font-medium">{passage.char_count?.toLocaleString() || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">문단 수</p>
                    <p className="font-medium">{passage.paragraph_count || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 지문 본문 */}
            <Card>
              <CardHeader>
                <CardTitle>지문 본문</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {passage.content || '본문 내용이 없습니다.'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* OX 퀴즈 결과 */}
            <Card>
              <CardHeader>
                <CardTitle>OX 퀴즈 결과</CardTitle>
                <CardDescription>
                  {studentName}님이 푼 OX 퀴즈와 정/오답 여부입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingQuizzes ? (
                  <div className="text-center py-8 text-gray-500">
                    퀴즈 결과를 불러오는 중...
                  </div>
                ) : quizResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    해당 지문에 대한 OX 퀴즈가 없습니다
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quizResults.map((quiz, index) => (
                      <div
                        key={quiz.quiz_id}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge variant="outline" className="text-xs">문제 {index + 1}</Badge>
                              {quiz.ox_type && (
                                <Badge variant="secondary" className="text-xs">
                                  {quiz.ox_type}
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-gray-900 text-sm mb-2">
                              {quiz.statement}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">정답</p>
                            <Badge
                              variant={quiz.correct_answer === 'O' ? 'default' : 'secondary'}
                              className={
                                quiz.correct_answer === 'O'
                                  ? 'bg-green-100 text-green-800 text-xs'
                                  : 'bg-red-100 text-red-800 text-xs'
                              }
                            >
                              {quiz.correct_answer}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">학생 답안</p>
                            {quiz.student_answer ? (
                              <Badge
                                variant={
                                  quiz.is_correct
                                    ? 'default'
                                    : 'destructive'
                                }
                                className={
                                  quiz.is_correct
                                    ? 'bg-green-100 text-green-800 text-xs'
                                    : 'bg-red-100 text-red-800 text-xs'
                                }
                              >
                                {quiz.student_answer}
                                {quiz.is_correct ? ' (정답)' : ' (오답)'}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400">미응답</span>
                            )}
                          </div>
                        </div>

                        {quiz.evidence && (
                          <div className="flex items-start gap-2">
                            <p className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                              근거:
                            </p>
                            <p className="text-xs text-gray-600 bg-gray-50 p-1.5 rounded flex-1">
                              {quiz.evidence}
                            </p>
                          </div>
                        )}

                        {quiz.reasoning && (
                          <div className="flex items-start gap-2">
                            <p className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                              추론:
                            </p>
                            <p className="text-xs text-gray-600 bg-gray-50 p-1.5 rounded flex-1">
                              {quiz.reasoning}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

