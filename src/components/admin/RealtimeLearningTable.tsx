'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Radio } from 'lucide-react';

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

interface SentenceClinicPayload {
  id: string;
  student_id: number;
  started_at: string;
  completed_at: string | null;
  cloze_is_correct: boolean;
  keyword_is_correct: boolean;
}

interface RealtimeLearningTableProps {
  initialData: LearningRecord[];
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

export function RealtimeLearningTable({ initialData }: RealtimeLearningTableProps) {
  const [records, setRecords] = useState<LearningRecord[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [newRecordIds, setNewRecordIds] = useState<Set<string>>(new Set());

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

  // 데이터 새로고침
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/learning/realtime');
      const result = await response.json();
      if (result.data) {
        setRecords(result.data);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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

            // 오늘 날짜인지 확인
            const today = new Date().toISOString().split('T')[0];
            const recordDate = new Date(newRecord.started_at).toISOString().split('T')[0];

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
              // 기존 레코드 업데이트 또는 새 레코드 추가
              const existingIndex = prev.findIndex(r => r.id === record.id);
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = record;
                return updated;
              } else {
                // 새 레코드는 맨 앞에 추가
                setNewRecordIds(ids => new Set(ids).add(record.id));
                setTimeout(() => {
                  setNewRecordIds(ids => {
                    const newIds = new Set(ids);
                    newIds.delete(record.id);
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

            // 오늘 날짜인지 확인
            const today = new Date().toISOString().split('T')[0];
            const recordDate = new Date(newRecord.started_at).toISOString().split('T')[0];

            if (recordDate !== today) return;

            const studentName = await fetchStudentName(newRecord.student_id);

            // 문장클리닉은 2문제 (빈칸채우기 + 키워드)
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
                setNewRecordIds(ids => new Set(ids).add(record.id));
                setTimeout(() => {
                  setNewRecordIds(ids => {
                    const newIds = new Set(ids);
                    newIds.delete(record.id);
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

    // 클린업
    return () => {
      if (supabase) {
        supabase.removeChannel(testSessionChannel);
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

      {/* 학습 데이터 테이블 */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 border-b">학생이름</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 border-b">학습유형</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-b">시작시간</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-b">문제수</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-b">정답수</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-b">정답률</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 border-b">상태</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    오늘 학습 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record.id}
                    className={`border-b hover:bg-gray-50 transition-all duration-300 ${
                      newRecordIds.has(record.id) ? 'bg-yellow-50 animate-pulse' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {record.studentName}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={getLearningTypeBadgeClass(record.learningType)}
                      >
                        {getLearningTypeLabel(record.learningType)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {formatTime(record.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {record.totalItems}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {record.correctCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`font-medium ${
                        record.accuracyRate >= 80 ? 'text-green-600' :
                        record.accuracyRate >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {record.accuracyRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 통계 요약 */}
      {records.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500">총 학습 횟수</div>
            <div className="text-2xl font-bold text-gray-900">{records.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">완료</div>
            <div className="text-2xl font-bold text-green-600">
              {records.filter(r => r.completedAt).length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">진행중</div>
            <div className="text-2xl font-bold text-blue-600">
              {records.filter(r => !r.completedAt).length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">평균 정답률</div>
            <div className="text-2xl font-bold text-gray-900">
              {records.length > 0
                ? (records.reduce((acc, r) => acc + r.accuracyRate, 0) / records.length).toFixed(0)
                : 0}%
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
