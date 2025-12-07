'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { Loader2, Send, User, MessageSquare, Zap, BookText, Search, Calendar } from 'lucide-react';

// 타입 정의
interface Student {
  id: number;
  name: string;
  parent_phone: string | null;
  school: string | null;
  grade: string | null;
}

interface LearningStats {
  wordPang: { totalItems: number; correctCount: number; sessions: number; accuracy: number };
  sentenceLearning: { totalItems: number; correctCount: number; sessions: number; accuracy: number };
  passageQuiz: { totalItems: number; correctCount: number; sessions: number; accuracy: number };
}

interface StudentLearningData {
  student: Student;
  date: string;
  stats: LearningStats;
  hasData: boolean;
}

// 날짜 포맷 함수
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${month}/${day}(${weekday})`;
};

export default function KakaoReportPage(): React.ReactElement {
  const { toast } = useToast();

  // 상태
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [learningDates, setLearningDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [learningData, setLearningData] = useState<StudentLearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [sending, setSending] = useState(false);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  // 학생 목록 로드
  useEffect(() => {
    const fetchStudents = async (): Promise<void> => {
      try {
        const response = await fetch('/api/admin/kakao-report');
        const result = await response.json();

        if (result.success) {
          setStudents(result.data.students || []);
        } else {
          toast({ type: 'error', description: result.error || '학생 목록 조회 실패' });
        }
      } catch (error) {
        console.error('학생 목록 조회 오류:', error);
        toast({ type: 'error', description: '학생 목록을 불러오는 중 오류가 발생했습니다.' });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [toast]);

  // 학생 선택 시 학습 이력 날짜 조회
  const fetchLearningDates = useCallback(async (studentId: string): Promise<void> => {
    setLoadingDates(true);
    setLearningDates([]);
    setSelectedDate('');
    setLearningData(null);
    setMessage('');

    try {
      const response = await fetch(
        `/api/admin/kakao-report?student_id=${studentId}&get_dates=true`
      );
      const result = await response.json();

      if (result.success) {
        setLearningDates(result.data.learningDates || []);
        if (result.data.learningDates?.length === 0) {
          toast({ type: 'info', description: '학습 이력이 없습니다.' });
        }
      } else {
        toast({ type: 'error', description: result.error || '학습 이력 조회 실패' });
      }
    } catch (error) {
      console.error('학습 이력 조회 오류:', error);
      toast({ type: 'error', description: '학습 이력을 불러오는 중 오류가 발생했습니다.' });
    } finally {
      setLoadingDates(false);
    }
  }, [toast]);

  // 학생 선택 변경 시
  const handleStudentChange = (studentId: string): void => {
    setSelectedStudentId(studentId);
    if (studentId) {
      fetchLearningDates(studentId);
    }
  };

  // 날짜 선택 시 학습 데이터 조회
  const fetchLearningData = async (date: string): Promise<void> => {
    if (!selectedStudentId || !date) return;

    setSelectedDate(date);
    setLoadingData(true);

    try {
      const response = await fetch(
        `/api/admin/kakao-report?student_id=${selectedStudentId}&date=${date}`
      );
      const result = await response.json();

      if (result.success) {
        setLearningData(result.data);
        generateMessage(result.data);
      } else {
        toast({ type: 'error', description: result.error || '학습 데이터 조회 실패' });
      }
    } catch (error) {
      console.error('학습 데이터 조회 오류:', error);
      toast({ type: 'error', description: '학습 데이터를 불러오는 중 오류가 발생했습니다.' });
    } finally {
      setLoadingData(false);
    }
  };

  // 메시지 생성
  const generateMessage = (data: StudentLearningData): void => {
    const { student, stats } = data;
    const lines: string[] = [];

    lines.push('안녕하세요. 이지국어교습소입니다.');
    lines.push(`오늘 ${student.name}(이)는 다음과 같은 내용을 공부했습니다.`);
    lines.push('');

    if (stats.wordPang.totalItems > 0) {
      lines.push(`단어팡! : ${stats.wordPang.totalItems}단어 (정답률 ${stats.wordPang.accuracy}%)`);
    }

    if (stats.sentenceLearning.totalItems > 0) {
      lines.push(`문장클리닉 : ${stats.sentenceLearning.totalItems}문장 (정답률 ${stats.sentenceLearning.accuracy}%)`);
    }

    if (stats.passageQuiz.totalItems > 0) {
      lines.push(`보물찾기(긴 문장) : ${stats.passageQuiz.totalItems}문장 (정답률 ${stats.passageQuiz.accuracy}%)`);
    }

    if (stats.wordPang.totalItems === 0 && stats.sentenceLearning.totalItems === 0 && stats.passageQuiz.totalItems === 0) {
      lines.push('오늘은 학습 기록이 없습니다.');
    }

    setMessage(lines.join('\n'));
  };

  // 코멘트 추가
  const addComment = (): void => {
    if (comment.trim()) {
      setMessage((prev) => prev + '\n\n' + comment.trim());
      setComment('');
    }
  };

  // 메시지 발송
  const sendMessage = async (): Promise<void> => {
    if (!learningData) {
      toast({ type: 'warning', description: '먼저 학습 데이터를 조회해주세요.' });
      return;
    }

    if (!learningData.student.parent_phone) {
      toast({ type: 'error', description: '학부모 연락처가 등록되어 있지 않습니다.' });
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/admin/kakao-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: learningData.student.id,
          studentName: learningData.student.name,
          parentPhone: learningData.student.parent_phone,
          message
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({ type: 'success', description: '카카오톡 메시지가 발송되었습니다.' });
      } else {
        toast({ type: 'error', description: result.error || '메시지 발송 실패' });
      }
    } catch (error) {
      console.error('메시지 발송 오류:', error);
      toast({ type: 'error', description: '메시지 발송 중 오류가 발생했습니다.' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">로딩 중...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Send className="w-7 h-7 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">풀스택-국어 카톡 발송</h1>
            <p className="text-sm text-gray-500">이지국어교습소 학생 학습 리포트 발송</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 좌측: 학생 선택 및 데이터 조회 */}
          <div className="space-y-4">
            {/* 학생 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  학생 선택
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="student">학생</Label>
                  <Select value={selectedStudentId} onValueChange={handleStudentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="학생을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name} ({student.school || '-'} {student.grade || ''})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 학습 이력 날짜 선택 */}
                {loadingDates && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-gray-500">학습 이력 조회 중...</span>
                  </div>
                )}

                {!loadingDates && learningDates.length > 0 && (
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      학습 이력 (최근 3일)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {learningDates.map((date) => (
                        <Button
                          key={date}
                          variant={selectedDate === date ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => fetchLearningData(date)}
                          disabled={loadingData}
                          className="cursor-pointer"
                        >
                          {formatDate(date)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {!loadingDates && selectedStudentId && learningDates.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    학습 이력이 없습니다.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 학습 통계 */}
            {loadingData && (
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-500">학습 데이터 조회 중...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {!loadingData && learningData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {learningData.student.name}의 학습 현황
                  </CardTitle>
                  <p className="text-sm text-gray-500">{learningData.date}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 단어팡 */}
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-600" />
                      <span className="font-medium">단어팡!</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-700">
                        {learningData.stats.wordPang.totalItems}단어
                      </p>
                      <p className="text-sm text-amber-600">
                        정답률 {learningData.stats.wordPang.accuracy}%
                      </p>
                    </div>
                  </div>

                  {/* 문장클리닉 */}
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BookText className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium">문장클리닉</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-700">
                        {learningData.stats.sentenceLearning.totalItems}문장
                      </p>
                      <p className="text-sm text-emerald-600">
                        정답률 {learningData.stats.sentenceLearning.accuracy}%
                      </p>
                    </div>
                  </div>

                  {/* 보물찾기 */}
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Search className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">보물찾기</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-700">
                        {learningData.stats.passageQuiz.totalItems}문장
                      </p>
                      <p className="text-sm text-purple-600">
                        정답률 {learningData.stats.passageQuiz.accuracy}%
                      </p>
                    </div>
                  </div>

                  {!learningData.hasData && (
                    <p className="text-center text-gray-500 py-4">
                      해당 날짜에 학습 기록이 없습니다.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 우측: 메시지 미리보기 및 발송 */}
          <div className="space-y-4">
            {/* 메시지 미리보기 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  카카오톡 메시지
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 메시지 내용 */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={10}
                    className="bg-white border-yellow-300 focus:border-yellow-500"
                    placeholder="학생을 선택하고 학습 이력 날짜를 클릭하면 메시지가 자동 생성됩니다."
                  />
                </div>

                {/* 코멘트 추가 */}
                <div className="space-y-2">
                  <Label>추가 코멘트</Label>
                  <div className="flex gap-2">
                    <Input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="추가할 메시지를 입력하세요"
                      onKeyDown={(e) => e.key === 'Enter' && addComment()}
                    />
                    <Button variant="outline" onClick={addComment} className="cursor-pointer">
                      추가
                    </Button>
                  </div>
                </div>

                {/* 수신자 정보 */}
                {learningData && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">수신자:</span> {learningData.student.name} 학부모
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">연락처:</span>{' '}
                      {learningData.student.parent_phone || '미등록'}
                    </p>
                  </div>
                )}

                {/* 발송 버튼 */}
                <Button
                  onClick={sendMessage}
                  disabled={!learningData || !message || sending}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  카카오톡 발송
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
