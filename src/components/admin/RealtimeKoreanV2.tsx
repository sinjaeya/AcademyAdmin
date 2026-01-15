'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Wifi, WifiOff, AlertCircle, X, Circle } from 'lucide-react';
import { useRealtimeKorean, ConnectionStatus } from '@/hooks/useRealtimeKorean';
import { useStudentPresence, type StudentPresenceState } from '@/hooks/useStudentPresence';
import { useAuthStore } from '@/store/auth';
import type { LearningRecord, StudentSummary } from '@/types/realtime-korean';

// 학습 유형 한글 변환
const getLearningTypeLabel = (type: string): string => {
  switch (type) {
    case 'word_pang': return '단어팡';
    case 'passage_quiz': return '보물찾기';
    case 'sentence_clinic': return '문장클리닉';
    case 'handwriting': return '내손내줄';
    default: return type;
  }
};

// 시간 포맷팅
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// 연결 상태 아이콘
function ConnectionStatusIndicator({ status }: { status: ConnectionStatus }) {
  switch (status) {
    case 'connected':
      return (
        <div className="flex items-center gap-2 text-green-600">
          <Wifi className="w-4 h-4" />
          <span className="text-sm">실시간 연결됨</span>
        </div>
      );
    case 'connecting':
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <Radio className="w-4 h-4 animate-pulse" />
          <span className="text-sm">연결 중...</span>
        </div>
      );
    case 'disconnected':
      return (
        <div className="flex items-center gap-2 text-orange-600">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm">재연결 중...</span>
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">연결 오류</span>
        </div>
      );
  }
}

// 단어팡 결과 배지
function WordPangBadges({ record }: { record: LearningRecord }) {
  if (!record.correctWords?.length && !record.wrongWords?.length) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {record.correctWords?.map((word, idx) => (
        <Badge key={`c-${idx}`} className="bg-green-100 text-green-700 border-green-200 text-xs px-1.5 py-0">
          {word}
        </Badge>
      ))}
      {record.wrongWords?.map((word, idx) => (
        <Badge key={`w-${idx}`} className="bg-red-100 text-red-700 border-red-200 text-xs px-1.5 py-0">
          {word}
        </Badge>
      ))}
    </div>
  );
}

// 보물찾기 결과 배지
function PassageQuizBadges({ record }: { record: LearningRecord }) {
  if (!record.passageQuizDetails?.length) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {record.passageQuizDetails.map((detail, idx) => (
        <Badge
          key={idx}
          className={`text-xs px-1.5 py-0 ${
            detail.isCorrect
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-red-100 text-red-700 border-red-200'
          }`}
          title={`${detail.statement}\n정답: ${detail.answer}`}
        >
          {detail.isCorrect ? '○' : '✗'} {detail.statement.length > 10 ? detail.statement.slice(0, 10) + '...' : detail.statement}
        </Badge>
      ))}
    </div>
  );
}

// 문장클리닉 결과 배지
function SentenceClinicBadges({ record }: { record: LearningRecord }) {
  const detail = record.sentenceClinicDetail;
  if (!detail) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  // 정답 상태 렌더링 (null=미응답, true=정답, false=오답)
  const renderResult = (isCorrect: boolean | null): React.ReactNode => {
    if (isCorrect === null) return <span className="text-gray-400">-</span>;
    if (isCorrect) return <span className="text-green-600">○</span>;
    return <span className="text-red-600">✗</span>;
  };

  return (
    <div className="flex items-center gap-2">
      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
        {detail.keyword || '키워드'}
      </Badge>
      <span className="text-xs text-gray-500">
        빈칸: {renderResult(detail.clozeIsCorrect)}
        {' / '}
        키워드: {renderResult(detail.keywordIsCorrect)}
      </span>
    </div>
  );
}

// 내손내줄 결과 배지
function HandwritingBadges({ record }: { record: LearningRecord }) {
  const detail = record.handwritingDetail;

  return (
    <div className="flex items-center gap-2">
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
        {detail?.passageCode || '-'}
      </Badge>
      <span className="text-xs text-gray-500">
        {record.correctCount}/{record.totalItems}문제
        {record.totalItems > 0 && (
          <span className={`ml-1 ${
            record.accuracyRate >= 80 ? 'text-green-600' :
            record.accuracyRate >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            ({record.accuracyRate.toFixed(0)}%)
          </span>
        )}
      </span>
    </div>
  );
}

// 학생 로우 컴포넌트
function StudentRow({ summary, onDeleteOrphanSessions, presence }: {
  summary: StudentSummary;
  onDeleteOrphanSessions: (records: { id: string; learningType: string }[]) => Promise<void>;
  presence?: StudentPresenceState;
}) {
  const isActive = summary.currentActivity !== null;
  const isOnline = !!presence;

  // 미완료(고아) 세션 목록
  const orphanRecords = summary.records.filter(r => r.completedAt === null);
  const hasOrphans = orphanRecords.length > 0;

  // 고아 세션 전체 삭제
  const handleDeleteOrphans = async (): Promise<void> => {
    console.log('[handleDeleteOrphans] 클릭됨, orphanRecords:', orphanRecords.length);
    if (!hasOrphans) {
      console.log('[handleDeleteOrphans] hasOrphans가 false');
      return;
    }
    console.log('[handleDeleteOrphans] 삭제 시작:', orphanRecords.map(r => r.id));
    await onDeleteOrphanSessions(orphanRecords.map(r => ({ id: r.id, learningType: r.learningType })));
    console.log('[handleDeleteOrphans] 삭제 완료');
  };

  return (
    <div className={`border rounded-lg p-4 ${isActive ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
      {/* 헤더: 학생 이름 + 상태 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* 온라인 상태 표시 */}
          <Circle
            className={`w-3 h-3 ${isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-300 text-gray-300'}`}
          />
          <h3 className="font-bold text-lg text-gray-900">{summary.studentName}</h3>
          {/* 현재 접속 위치 (온라인인 경우) */}
          {isOnline && presence && (
            <span className="text-sm text-gray-500">
              @ {presence.current_page_name}
            </span>
          )}
          {isActive && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 animate-pulse">
              {getLearningTypeLabel(summary.currentActivity!)} 진행중
            </Badge>
          )}
        </div>
        {hasOrphans && (
          <button
            type="button"
            onClick={() => {
              console.log('[삭제버튼] 클릭!');
              handleDeleteOrphans();
            }}
            className="text-red-400 hover:text-red-600 text-sm flex items-center gap-1 cursor-pointer"
            title={`미완료 세션 ${orphanRecords.length}개 삭제`}
          >
            <X className="w-4 h-4" />
            삭제
          </button>
        )}
      </div>

      {/* 학습 기록들 */}
      <div className="space-y-2">
        {/* 단어팡 */}
        {summary.wordPang.count > 0 && (
          <div className="flex items-start gap-3 py-2 border-b border-gray-100">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 shrink-0 w-20 justify-center">
              단어팡
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {summary.wordPang.count}개
                </span>
                <span className={`text-sm font-medium ${
                  summary.wordPang.accuracyRate >= 80 ? 'text-green-600' :
                  summary.wordPang.accuracyRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  ({summary.wordPang.accuracyRate.toFixed(0)}%)
                </span>
                {summary.historicalAccuracy && summary.historicalAccuracy.wordPangTotal > 0 && (
                  <span className="text-xs text-gray-400">
                    누적: {summary.historicalAccuracy.wordPangTotal}개/{summary.historicalAccuracy.wordPangAccuracyRate?.toFixed(0)}%
                  </span>
                )}
              </div>
              {/* 개별 세션 기록 */}
              <div className="space-y-1">
                {summary.records
                  .filter(r => r.learningType === 'word_pang')
                  .map(record => (
                    <div key={record.id} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-12">{formatTime(record.startedAt)}</span>
                      <WordPangBadges record={record} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 보물찾기 */}
        {summary.passageQuiz.count > 0 && (
          <div className="flex items-start gap-3 py-2 border-b border-gray-100">
            <Badge className="bg-green-100 text-green-800 border-green-200 shrink-0 w-20 justify-center">
              보물찾기
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {summary.passageQuiz.sessionCount}지문 / {summary.passageQuiz.count}문제
                </span>
                <span className={`text-sm font-medium ${
                  summary.passageQuiz.accuracyRate >= 80 ? 'text-green-600' :
                  summary.passageQuiz.accuracyRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  ({summary.passageQuiz.accuracyRate.toFixed(0)}%)
                </span>
              </div>
              {/* 개별 세션 기록 */}
              <div className="space-y-1">
                {summary.records
                  .filter(r => r.learningType === 'passage_quiz')
                  .map(record => (
                    <div key={record.id} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-12">{formatTime(record.startedAt)}</span>
                      <PassageQuizBadges record={record} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 문장클리닉 */}
        {(summary.sentenceClinic.count > 0 || summary.sentenceClinic.reviewCount > 0) && (
          <div className="flex items-start gap-3 py-2 border-b border-gray-100">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 shrink-0 w-20 justify-center">
              문장클리닉
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {summary.sentenceClinic.count > 0 && (
                  <>
                    <span className="text-sm font-medium text-gray-700">
                      {summary.sentenceClinic.count}개
                    </span>
                    <span className={`text-sm font-medium ${
                      summary.sentenceClinic.accuracyRate >= 80 ? 'text-green-600' :
                      summary.sentenceClinic.accuracyRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      ({summary.sentenceClinic.accuracyRate.toFixed(0)}%)
                    </span>
                  </>
                )}
                {summary.sentenceClinic.reviewCount > 0 && (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                    복습대기 {summary.sentenceClinic.reviewCount}개
                  </Badge>
                )}
              </div>
              {/* 개별 세션 기록 */}
              {summary.sentenceClinic.count > 0 && (
                <div className="space-y-1">
                  {summary.records
                    .filter(r => r.learningType === 'sentence_clinic')
                    .map(record => (
                      <div key={record.id} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400 w-12">{formatTime(record.startedAt)}</span>
                        <SentenceClinicBadges record={record} />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 내손내줄 */}
        {summary.handwriting.count > 0 && (
          <div className="flex items-start gap-3 py-2">
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 shrink-0 w-20 justify-center">
              내손내줄
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {summary.handwriting.sessionCount}지문 / {summary.handwriting.count}문제
                </span>
                <span className={`text-sm font-medium ${
                  summary.handwriting.accuracyRate >= 80 ? 'text-green-600' :
                  summary.handwriting.accuracyRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  ({summary.handwriting.accuracyRate.toFixed(0)}%)
                </span>
              </div>
              {/* 개별 세션 기록 */}
              <div className="space-y-1">
                {summary.records
                  .filter(r => r.learningType === 'handwriting')
                  .map(record => (
                    <div key={record.id} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-12">{formatTime(record.startedAt)}</span>
                      <HandwritingBadges record={record} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 학습 기록 없음 */}
        {summary.wordPang.count === 0 && summary.passageQuiz.count === 0 && summary.sentenceClinic.count === 0 && summary.handwriting.count === 0 && (
          <div className="text-center text-gray-400 py-4">
            학습 기록이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}

// 메인 컴포넌트
export function RealtimeKoreanV2() {
  const { academyId } = useAuthStore();
  const { records, wordCounts, historicalAccuracy, reviewCounts, loading, connectionStatus, lastUpdate, deleteSession } = useRealtimeKorean(academyId);
  // Presence 훅 (academyId를 숫자로 변환)
  const numericAcademyId = academyId ? parseInt(academyId, 10) : null;
  const { getPresence, connectionStatus: presenceStatus } = useStudentPresence(numericAcademyId);

  // 숨긴 학생 목록
  const [hiddenStudents, setHiddenStudents] = useState<Set<number>>(new Set());
  const prevRecordsRef = useRef<LearningRecord[]>([]);

  // 학생 순서 고정 (초기 로드 시 결정, 이후 유지)
  const studentOrderRef = useRef<number[]>([]);

  // 레코드 변경 감지 - 새 업데이트가 있는 학생은 다시 표시
  useEffect(() => {
    const prevRecords = prevRecordsRef.current;
    const updatedStudentIds = new Set<number>();

    for (const record of records) {
      const prevRecord = prevRecords.find(r => r.id === record.id);
      // 새 레코드이거나 업데이트된 레코드
      if (!prevRecord || JSON.stringify(prevRecord) !== JSON.stringify(record)) {
        updatedStudentIds.add(record.studentId);
      }
    }

    if (updatedStudentIds.size > 0 && prevRecords.length > 0) {
      setHiddenStudents(prev => {
        const newSet = new Set(prev);
        updatedStudentIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }

    prevRecordsRef.current = records;
  }, [records]);

  // 학생의 고아 세션 전체 삭제
  const deleteOrphanSessions = useCallback(async (orphanRecords: { id: string; learningType: string }[]): Promise<void> => {
    for (const record of orphanRecords) {
      await deleteSession(record.id, record.learningType);
    }
  }, [deleteSession]);

  // 학생별 요약 데이터 생성
  const studentSummaries = useMemo((): StudentSummary[] => {
    const summaryMap = new Map<number, StudentSummary>();

    for (const record of records) {
      if (!summaryMap.has(record.studentId)) {
        summaryMap.set(record.studentId, {
          studentId: record.studentId,
          studentName: record.studentName,
          currentActivity: null,
          wordPang: { count: 0, correctCount: 0, accuracyRate: 0 },
          passageQuiz: { sessionCount: 0, count: 0, correctCount: 0, accuracyRate: 0 },
          sentenceClinic: { count: 0, correctCount: 0, accuracyRate: 0, reviewCount: reviewCounts.get(record.studentId) || 0 },
          handwriting: { sessionCount: 0, count: 0, correctCount: 0, accuracyRate: 0 },
          records: [],
          historicalAccuracy: historicalAccuracy.get(record.studentId)
        });
      }

      const summary = summaryMap.get(record.studentId)!;
      summary.records.push(record);

      // 진행 중인 활동 체크
      if (!record.completedAt && !summary.currentActivity) {
        summary.currentActivity = record.learningType;
      }

      // 세션 카운트 (보물찾기)
      if (record.completedAt && record.learningType === 'passage_quiz') {
        summary.passageQuiz.sessionCount += 1;
      }

      // 세션 카운트 (내손내줄)
      if (record.completedAt && record.learningType === 'handwriting') {
        summary.handwriting.sessionCount += 1;
      }

      // 문장클리닉 통계
      if (record.completedAt && record.learningType === 'sentence_clinic') {
        summary.sentenceClinic.count += 1;
        summary.sentenceClinic.correctCount += record.correctCount;
      }
    }

    // 레코드에서 직접 개수 계산 (세션별 단어/문제 배열 기반 - wordCounts와 동기화 문제 해결)
    summaryMap.forEach((summary) => {
      // 단어팡: 세션별 correctWords + wrongWords 합산
      for (const record of summary.records) {
        if (record.learningType === 'word_pang') {
          const correctCount = record.correctWords?.length || 0;
          const wrongCount = record.wrongWords?.length || 0;
          summary.wordPang.count += correctCount + wrongCount;
          summary.wordPang.correctCount += correctCount;
        } else if (record.learningType === 'passage_quiz') {
          // 보물찾기: passageQuizDetails 배열 기반
          const details = record.passageQuizDetails || [];
          summary.passageQuiz.count += details.length;
          summary.passageQuiz.correctCount += details.filter(d => d.isCorrect).length;
        } else if (record.learningType === 'handwriting') {
          // 내손내줄: record의 totalItems, correctCount 사용
          summary.handwriting.count += record.totalItems || 0;
          summary.handwriting.correctCount += record.correctCount || 0;
        }
      }

      // 정답률 계산
      if (summary.wordPang.count > 0) {
        summary.wordPang.accuracyRate = (summary.wordPang.correctCount / summary.wordPang.count) * 100;
      }
      if (summary.passageQuiz.count > 0) {
        summary.passageQuiz.accuracyRate = (summary.passageQuiz.correctCount / summary.passageQuiz.count) * 100;
      }
      if (summary.sentenceClinic.count > 0) {
        summary.sentenceClinic.accuracyRate = (summary.sentenceClinic.correctCount / (summary.sentenceClinic.count * 2)) * 100;
      }
      if (summary.handwriting.count > 0) {
        summary.handwriting.accuracyRate = (summary.handwriting.correctCount / summary.handwriting.count) * 100;
      }

      // 레코드 정렬
      summary.records.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    });

    const summaries = Array.from(summaryMap.values());

    // 초기 로드 시에만 정렬하고 순서 저장
    if (studentOrderRef.current.length === 0 && summaries.length > 0) {
      // 진행중 학생 먼저, 그 다음 이름순
      summaries.sort((a, b) => {
        if (a.currentActivity && !b.currentActivity) return -1;
        if (!a.currentActivity && b.currentActivity) return 1;
        return a.studentName.localeCompare(b.studentName);
      });
      studentOrderRef.current = summaries.map(s => s.studentId);
      return summaries;
    }

    // 이후 업데이트에서는 기존 순서 유지, 새 학생은 맨 뒤에 추가
    const orderedSummaries: StudentSummary[] = [];
    const existingIds = new Set(studentOrderRef.current);

    // 기존 순서대로 정렬
    for (const studentId of studentOrderRef.current) {
      const summary = summaries.find(s => s.studentId === studentId);
      if (summary) {
        orderedSummaries.push(summary);
      }
    }

    // 새로 추가된 학생은 맨 뒤에
    for (const summary of summaries) {
      if (!existingIds.has(summary.studentId)) {
        orderedSummaries.push(summary);
        studentOrderRef.current.push(summary.studentId);
      }
    }

    return orderedSummaries;
  }, [records, wordCounts, historicalAccuracy, reviewCounts]);

  // 숨긴 학생 제외
  const visibleSummaries = useMemo(() => {
    return studentSummaries.filter(s => !hiddenStudents.has(s.studentId));
  }, [studentSummaries, hiddenStudents]);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">실시간 국어 (v2)</h1>
          <p className="text-gray-600 text-sm">학생들의 오늘 학습 현황을 실시간으로 확인합니다</p>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionStatusIndicator status={connectionStatus} />
          {/* Presence 연결 상태 */}
          {presenceStatus === 'connected' && (
            <div className="flex items-center gap-1 text-green-600">
              <Circle className="w-2 h-2 fill-green-500" />
              <span className="text-xs">접속현황</span>
            </div>
          )}
          <Badge variant="outline" className="text-gray-600">
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Badge>
          {lastUpdate && (
            <span className="text-xs text-gray-400">
              마지막 업데이트: {formatTime(lastUpdate.toISOString())}
            </span>
          )}
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <Card className="p-8 text-center text-gray-500">
          데이터를 불러오는 중...
        </Card>
      )}

      {/* 학생 목록 */}
      {!loading && visibleSummaries.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          {studentSummaries.length === 0
            ? '오늘 학습 기록이 없습니다.'
            : '모든 학생을 닫았습니다. 새 업데이트가 있으면 다시 표시됩니다.'}
        </Card>
      )}

      {!loading && visibleSummaries.length > 0 && (
        <div className="space-y-3">
          {visibleSummaries.map((summary) => (
            <StudentRow
              key={summary.studentId}
              summary={summary}
              onDeleteOrphanSessions={deleteOrphanSessions}
              presence={getPresence(summary.studentId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
