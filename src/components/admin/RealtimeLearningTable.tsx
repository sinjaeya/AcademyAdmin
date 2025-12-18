'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Radio, X, Trash2 } from 'lucide-react';

// 학습 기록 타입
interface LearningRecord {
  id: string;
  studentId: number;
  studentName: string;
  learningType: 'word_pang' | 'passage_quiz' | 'sentence_clinic';
  startedAt: string;
  completedAt: string | null;
  totalItems: number;
  correctCount: number;
  accuracyRate: number;
  correctWords?: string[]; // 단어팡 맞은 단어들
  wrongWords?: string[]; // 단어팡 틀린 단어들
}

// 학생별 요약 타입
interface StudentSummary {
  studentId: number;
  studentName: string;
  wordPang: { count: number; totalItems: number; correctCount: number; accuracyRate: number };
  passageQuiz: { count: number; sessionCount: number; totalItems: number; correctCount: number; accuracyRate: number };
  sentenceClinic: { count: number; totalItems: number; correctCount: number; accuracyRate: number };
  currentActivity: 'word_pang' | 'passage_quiz' | 'sentence_clinic' | null;
  records: LearningRecord[];
}

// Supabase Realtime payload 타입
interface TestSessionPayload {
  id: number;
  student_id: number;
  test_type: 'word_pang' | 'passage_quiz';
  started_at: string;
  completed_at: string | null;
  total_items: number;
  correct_count: number;
  accuracy_rate: number;
}

// test_result payload 타입 (개별 문제 결과)
interface TestResultPayload {
  id: number;
  session_id: number;
  student_id: number;
  test_type: 'word_pang' | 'passage_quiz';
  is_correct: boolean;
  answered_at: string;
}

interface SentenceClinicPayload {
  id: string;
  student_id: number;
  started_at: string;
  completed_at: string | null;
  cloze_is_correct: boolean;
  keyword_is_correct: boolean;
}

// 학생별 개별 문제 수 타입 (외부용)
interface StudentWordCountRecord {
  wordPangCount: number;
  wordPangCorrect: number;
  passageQuizCount: number;
  passageQuizCorrect: number;
}

// 학생별 누적 정답률 (오늘 이전)
interface StudentHistoricalAccuracy {
  wordPangTotal: number;
  wordPangCorrect: number;
  wordPangAccuracyRate: number | null;
}

interface RealtimeLearningTableProps {
  initialData: LearningRecord[];
  initialWordCounts?: Record<number, StudentWordCountRecord>;
  initialHistoricalAccuracy?: Record<number, StudentHistoricalAccuracy>;
}

// 학습 유형 한글 변환
const getLearningTypeLabel = (type: string) => {
  switch (type) {
    case 'word_pang':
      return '단어팡';
    case 'passage_quiz':
      return '보물찾기';
    case 'sentence_clinic':
      return '문장클리닉';
    default:
      return type;
  }
};

// 학습 유형별 배지 색상
const getLearningTypeBadgeClass = (type: string) => {
  switch (type) {
    case 'word_pang':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'passage_quiz':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'sentence_clinic':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// 시간 포맷팅
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// KST 기준 날짜 문자열 반환 (YYYY-MM-DD)
const getKSTDateString = (date: Date): string => {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kstDate.toISOString().split('T')[0];
};

// 학생별 개별 문제 수 타입
interface StudentWordCount {
  wordPangCount: number;
  wordPangCorrect: number;
  passageQuizCount: number;
  passageQuizCorrect: number;
}

export function RealtimeLearningTable({ initialData, initialWordCounts, initialHistoricalAccuracy }: RealtimeLearningTableProps) {
  const [records, setRecords] = useState<LearningRecord[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [newStudentIds, setNewStudentIds] = useState<Set<number>>(new Set());
  // 학생별 개별 문제 수 (실시간 업데이트용)
  const [studentWordCounts, setStudentWordCounts] = useState<Map<number, StudentWordCount>>(() => {
    const map = new Map<number, StudentWordCount>();
    if (initialWordCounts) {
      for (const [studentId, counts] of Object.entries(initialWordCounts)) {
        map.set(Number(studentId), counts);
      }
    }
    return map;
  });
  // 학생별 누적 정답률 (오늘 이전)
  const [historicalAccuracy] = useState<Map<number, StudentHistoricalAccuracy>>(() => {
    const map = new Map<number, StudentHistoricalAccuracy>();
    if (initialHistoricalAccuracy) {
      for (const [studentId, data] of Object.entries(initialHistoricalAccuracy)) {
        map.set(Number(studentId), data);
      }
    }
    return map;
  });

  // 학생 이름 조회 함수
  const fetchStudentName = useCallback(async (studentId: number): Promise<string> => {
    if (!supabase) return `학생 ${studentId}`;

    const { data } = await supabase
      .from('student')
      .select('name')
      .eq('id', studentId)
      .single();

    return data?.name || `학생 ${studentId}`;
  }, []);

  // 학생별 요약 데이터 생성
  const studentSummaries = useMemo(() => {
    const summaryMap = new Map<number, StudentSummary>();

    for (const record of records) {
      if (!summaryMap.has(record.studentId)) {
        summaryMap.set(record.studentId, {
          studentId: record.studentId,
          studentName: record.studentName,
          wordPang: { count: 0, totalItems: 0, correctCount: 0, accuracyRate: 0 },
          passageQuiz: { count: 0, sessionCount: 0, totalItems: 0, correctCount: 0, accuracyRate: 0 },
          sentenceClinic: { count: 0, totalItems: 0, correctCount: 0, accuracyRate: 0 },
          currentActivity: null,
          records: []
        });
      }

      const summary = summaryMap.get(record.studentId)!;
      summary.records.push(record);

      // 진행 중인 활동 체크 (completedAt이 null인 가장 최근 활동)
      if (!record.completedAt && !summary.currentActivity) {
        summary.currentActivity = record.learningType;
      }

      // 보물찾기 지문 수 (세션 수) 계산 - 완료된 세션만
      if (record.completedAt && record.learningType === 'passage_quiz') {
        summary.passageQuiz.sessionCount += 1;
      }

      // 문장클리닉만 레코드 기반으로 통계 (완료된 학습만)
      if (record.completedAt && record.learningType === 'sentence_clinic') {
        summary.sentenceClinic.count += 1;
        summary.sentenceClinic.totalItems += record.totalItems;
        summary.sentenceClinic.correctCount += record.correctCount;
      }
    }

    // studentWordCounts에서 단어팡/보물찾기 개별 문제 수 가져오기
    summaryMap.forEach((summary, studentId) => {
      const wordCount = studentWordCounts.get(studentId);
      if (wordCount) {
        // 단어팡: 개별 문제 수
        summary.wordPang.count = wordCount.wordPangCount;
        summary.wordPang.totalItems = wordCount.wordPangCount;
        summary.wordPang.correctCount = wordCount.wordPangCorrect;

        // 보물찾기: 개별 문제 수
        summary.passageQuiz.count = wordCount.passageQuizCount;
        summary.passageQuiz.totalItems = wordCount.passageQuizCount;
        summary.passageQuiz.correctCount = wordCount.passageQuizCorrect;
      }
    });

    // 정답률 계산
    summaryMap.forEach(summary => {
      if (summary.wordPang.totalItems > 0) {
        summary.wordPang.accuracyRate = (summary.wordPang.correctCount / summary.wordPang.totalItems) * 100;
      }
      if (summary.passageQuiz.totalItems > 0) {
        summary.passageQuiz.accuracyRate = (summary.passageQuiz.correctCount / summary.passageQuiz.totalItems) * 100;
      }
      if (summary.sentenceClinic.totalItems > 0) {
        summary.sentenceClinic.accuracyRate = (summary.sentenceClinic.correctCount / summary.sentenceClinic.totalItems) * 100;
      }
      // 시작시간 기준 내림차순 정렬
      summary.records.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    });

    return Array.from(summaryMap.values()).sort((a, b) => {
      // 현재 활동 중인 학생 먼저
      if (a.currentActivity && !b.currentActivity) return -1;
      if (!a.currentActivity && b.currentActivity) return 1;
      // 그 다음 이름순
      return a.studentName.localeCompare(b.studentName);
    });
  }, [records, studentWordCounts]);

  // 데이터 새로고침
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/learning/realtime');
      const result = await response.json();
      if (result.data) {
        setRecords(result.data);
      }
      // 개별 문제 수 데이터도 가져오기
      if (result.wordCounts) {
        const newWordCounts = new Map<number, StudentWordCount>();
        for (const [studentId, counts] of Object.entries(result.wordCounts)) {
          newWordCounts.set(Number(studentId), counts as StudentWordCount);
        }
        setStudentWordCounts(newWordCounts);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 진행 중인 학습 삭제
  const handleDeleteRecord = useCallback(async (recordId: string) => {
    if (!confirm('진행 중인 학습을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/learning/realtime/${recordId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // 로컬 상태에서 제거
        setRecords(prev => prev.filter(r => r.id !== recordId));
        // 선택된 학생의 records도 업데이트
        if (selectedStudent) {
          const updatedRecords = selectedStudent.records.filter(r => r.id !== recordId);
          if (updatedRecords.length === 0) {
            setSelectedStudent(null);
          } else {
            setSelectedStudent({
              ...selectedStudent,
              records: updatedRecords
            });
          }
        }
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  }, [selectedStudent]);

  // Realtime 구독 설정
  useEffect(() => {
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    // test_session 채널 구독 (단어팡, 보물찾기)
    const testSessionChannel = supabase
      .channel('test_session_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_session',
          filter: `test_type=in.(word_pang,passage_quiz)`
        },
        async (payload) => {
          console.log('test_session change:', payload);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newRecord = payload.new as TestSessionPayload;

            // KST 기준 오늘 날짜인지 확인
            const today = getKSTDateString(new Date());
            const recordDate = getKSTDateString(new Date(newRecord.started_at));

            if (recordDate !== today) return;

            const studentName = await fetchStudentName(newRecord.student_id);

            const record: LearningRecord = {
              id: `ts_${newRecord.id}`,
              studentId: newRecord.student_id,
              studentName,
              learningType: newRecord.test_type,
              startedAt: newRecord.started_at,
              completedAt: newRecord.completed_at,
              totalItems: newRecord.total_items || 0,
              correctCount: newRecord.correct_count || 0,
              accuracyRate: newRecord.accuracy_rate || 0
            };

            setRecords(prev => {
              const existingIndex = prev.findIndex(r => r.id === record.id);
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = record;
                return updated;
              } else {
                // 새 학생 하이라이트
                setNewStudentIds(ids => new Set(ids).add(record.studentId));
                setTimeout(() => {
                  setNewStudentIds(ids => {
                    const newIds = new Set(ids);
                    newIds.delete(record.studentId);
                    return newIds;
                  });
                }, 3000);
                return [record, ...prev];
              }
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('test_session subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    // short_passage_learning_history 채널 구독 (문장클리닉)
    const sentenceClinicChannel = supabase
      .channel('sentence_clinic_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'short_passage_learning_history'
        },
        async (payload) => {
          console.log('sentence_clinic change:', payload);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newRecord = payload.new as SentenceClinicPayload;

            // KST 기준 오늘 날짜인지 확인
            const today = getKSTDateString(new Date());
            const recordDate = getKSTDateString(new Date(newRecord.started_at));

            if (recordDate !== today) return;

            const studentName = await fetchStudentName(newRecord.student_id);

            const clozeCorrect = newRecord.cloze_is_correct ? 1 : 0;
            const keywordCorrect = newRecord.keyword_is_correct ? 1 : 0;
            const correctCount = clozeCorrect + keywordCorrect;
            const accuracyRate = (correctCount / 2) * 100;

            const record: LearningRecord = {
              id: `sc_${newRecord.id}`,
              studentId: newRecord.student_id,
              studentName,
              learningType: 'sentence_clinic',
              startedAt: newRecord.started_at,
              completedAt: newRecord.completed_at,
              totalItems: 2,
              correctCount,
              accuracyRate
            };

            setRecords(prev => {
              const existingIndex = prev.findIndex(r => r.id === record.id);
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = record;
                return updated;
              } else {
                setNewStudentIds(ids => new Set(ids).add(record.studentId));
                setTimeout(() => {
                  setNewStudentIds(ids => {
                    const newIds = new Set(ids);
                    newIds.delete(record.studentId);
                    return newIds;
                  });
                }, 3000);
                return [record, ...prev];
              }
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('sentence_clinic subscription status:', status);
      });

    // test_result 채널 구독 (개별 문제 결과 - 단어 1개씩 업데이트)
    const testResultChannel = supabase
      .channel('test_result_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'test_result',
          filter: `test_type=in.(word_pang,passage_quiz)`
        },
        async (payload) => {
          console.log('test_result change:', payload);

          const newResult = payload.new as TestResultPayload;

          // KST 기준 오늘 날짜인지 확인
          const today = getKSTDateString(new Date());
          const resultDate = getKSTDateString(new Date(newResult.answered_at));

          if (resultDate !== today) return;

          const studentId = newResult.student_id;
          const testType = newResult.test_type;
          const isCorrect = newResult.is_correct;

          // 학생별 문제 수 업데이트
          setStudentWordCounts(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(studentId) || {
              wordPangCount: 0,
              wordPangCorrect: 0,
              passageQuizCount: 0,
              passageQuizCorrect: 0
            };

            if (testType === 'word_pang') {
              current.wordPangCount += 1;
              if (isCorrect) current.wordPangCorrect += 1;
            } else if (testType === 'passage_quiz') {
              current.passageQuizCount += 1;
              if (isCorrect) current.passageQuizCorrect += 1;
            }

            newMap.set(studentId, { ...current });
            return newMap;
          });

          // 새 학생 하이라이트
          setNewStudentIds(ids => new Set(ids).add(studentId));
          setTimeout(() => {
            setNewStudentIds(ids => {
              const newIds = new Set(ids);
              newIds.delete(studentId);
              return newIds;
            });
          }, 1000);
        }
      )
      .subscribe((status) => {
        console.log('test_result subscription status:', status);
      });

    // 클린업
    return () => {
      if (supabase) {
        supabase.removeChannel(testSessionChannel);
        supabase.removeChannel(testResultChannel);
        supabase.removeChannel(sentenceClinicChannel);
      }
      setIsConnected(false);
    };
  }, [fetchStudentName]);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">실시간 풀스택-국어</h1>
        <p className="text-gray-600 mt-1">학생들의 오늘 학습 현황을 실시간으로 확인할 수 있습니다</p>
      </div>

      {/* 컨트롤 영역 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 연결 상태 표시 */}
            <div className="flex items-center gap-2">
              <Radio className={`w-4 h-4 ${isConnected ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
              <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                {isConnected ? '실시간 연결됨' : '연결 중...'}
              </span>
            </div>

            {/* 오늘 날짜 표시 */}
            <Badge variant="outline" className="text-gray-600">
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </Card>

      {loading && (
        <div className="text-center py-4 text-gray-500">
          데이터를 불러오는 중...
        </div>
      )}

      {/* 학생별 카드 그리드 */}
      {studentSummaries.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          오늘 학습 기록이 없습니다.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {studentSummaries.map((summary) => (
            <Card
              key={summary.studentId}
              className={`p-4 cursor-pointer hover:shadow-lg transition-all duration-300 ${
                newStudentIds.has(summary.studentId) ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''
              } ${summary.currentActivity ? 'border-2 border-blue-400' : ''}`}
              onClick={() => setSelectedStudent(summary)}
            >
              {/* 학생 이름 & 실시간 상태 */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-900">{summary.studentName}</h3>
                {summary.currentActivity && (
                  <Badge className={`${getLearningTypeBadgeClass(summary.currentActivity)} animate-pulse`}>
                    {getLearningTypeLabel(summary.currentActivity)} 중
                  </Badge>
                )}
              </div>

              {/* 학습 현황 */}
              <div className="space-y-2">
                {/* 단어팡 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600 font-medium">
                    단어팡
                    {(() => {
                      const historical = historicalAccuracy.get(summary.studentId);
                      if (historical && historical.wordPangTotal > 0) {
                        return (
                          <span className="text-blue-500 font-normal ml-1">
                            ({historical.wordPangTotal}개/{historical.wordPangAccuracyRate?.toFixed(0)}%)
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </span>
                  <span className="text-gray-700">
                    {summary.wordPang.count}개
                    {summary.wordPang.count > 0 && (
                      <span className="text-gray-500 ml-1">
                        ({summary.wordPang.accuracyRate.toFixed(0)}%)
                      </span>
                    )}
                  </span>
                </div>

                {/* 보물찾기 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 font-medium">보물찾기</span>
                  <span className="text-gray-700">
                    {summary.passageQuiz.sessionCount}지문 / {summary.passageQuiz.count}개
                    {summary.passageQuiz.count > 0 && (
                      <span className="text-gray-500 ml-1">
                        ({summary.passageQuiz.accuracyRate.toFixed(0)}%)
                      </span>
                    )}
                  </span>
                </div>

                {/* 문장클리닉 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-600 font-medium">문장클리닉</span>
                  <span className="text-gray-700">
                    {summary.sentenceClinic.count}개
                    {summary.sentenceClinic.count > 0 && (
                      <span className="text-gray-500 ml-1">
                        ({summary.sentenceClinic.accuracyRate.toFixed(0)}%)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* 총 학습 수 */}
              <div className="mt-3 pt-3 border-t text-xs text-gray-500 text-right">
                총 {summary.wordPang.count + summary.passageQuiz.count + summary.sentenceClinic.count}개 완료
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">{selectedStudent.studentName} - 오늘 학습 상세</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* 요약 카드 */}
            <div className="p-4 bg-gray-50 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-blue-600 font-bold text-lg">
                  {selectedStudent.wordPang.count}개
                </div>
                <div className="text-sm text-gray-600">단어팡</div>
                {selectedStudent.wordPang.count > 0 && (
                  <div className="text-xs text-gray-500">
                    정답률 {selectedStudent.wordPang.accuracyRate.toFixed(0)}%
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-green-600 font-bold text-lg">
                  {selectedStudent.passageQuiz.count}개
                </div>
                <div className="text-sm text-gray-600">보물찾기</div>
                {selectedStudent.passageQuiz.count > 0 && (
                  <div className="text-xs text-gray-500">
                    정답률 {selectedStudent.passageQuiz.accuracyRate.toFixed(0)}%
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-purple-600 font-bold text-lg">
                  {selectedStudent.sentenceClinic.count}개
                </div>
                <div className="text-sm text-gray-600">문장클리닉</div>
                {selectedStudent.sentenceClinic.count > 0 && (
                  <div className="text-xs text-gray-500">
                    정답률 {selectedStudent.sentenceClinic.accuracyRate.toFixed(0)}%
                  </div>
                )}
              </div>
            </div>

            {/* 상세 테이블 */}
            <div className="overflow-auto max-h-[50vh]">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">학습유형</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">시작시간</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">문제수</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">정답수</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">정답률</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">상태</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.records.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <Badge className={getLearningTypeBadgeClass(record.learningType)}>
                          {getLearningTypeLabel(record.learningType)}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-center text-sm text-gray-600">
                        {formatTime(record.startedAt)}
                      </td>
                      <td className="px-4 py-2 text-center text-sm text-gray-600">
                        {record.totalItems}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {record.learningType === 'word_pang' && (record.correctWords || record.wrongWords) ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {record.correctWords?.map((word, idx) => (
                              <Badge key={`c-${idx}`} className="bg-green-100 text-green-700 border-green-200 text-xs">
                                {word}
                              </Badge>
                            ))}
                            {record.wrongWords?.map((word, idx) => (
                              <Badge key={`w-${idx}`} className="bg-red-100 text-red-700 border-red-200 text-xs">
                                {word}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center">{record.correctCount}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center text-sm">
                        <span className={`font-medium ${
                          record.accuracyRate >= 80 ? 'text-green-600' :
                          record.accuracyRate >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {record.accuracyRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {record.completedAt ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            완료
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 animate-pulse">
                            진행중
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {!record.completedAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteRecord(record.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
