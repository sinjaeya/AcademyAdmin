'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Wifi, WifiOff, AlertCircle, X, Circle } from 'lucide-react';
import { useRealtimeKorean, ConnectionStatus } from '@/hooks/useRealtimeKorean';
import { useStudentPresence, type StudentPresenceState } from '@/hooks/useStudentPresence';
import { useAuthStore } from '@/store/auth';
import type { LearningRecord, StudentSummary } from '@/types/realtime-korean';
import { WordPangDetailDialog } from '@/components/admin/WordPangDetailDialog';

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

// 소요 시간 계산 (startedAt, completedAt)
const formatDuration = (startedAt: string, completedAt: string | null): string => {
  if (!completedAt) {
    // 진행 중: 현재 시간과 비교
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const diffMs = now - start;
    if (diffMs < 0) return '0초';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}초`;
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin}분`;
  }

  // 완료됨: 시작-종료 시간 차이
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;
  if (diffMs < 0) return '0초';

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}초`;
  const diffMin = Math.floor(diffSec / 60);
  const remainSec = diffSec % 60;
  if (diffMin < 60) {
    return remainSec > 0 ? `${diffMin}분 ${remainSec}초` : `${diffMin}분`;
  }
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return `${hours}시간 ${mins}분`;
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

// 단어팡 결과 배지 (순서 유지)
function WordPangBadges({ record, onWordClick, deletedVocaIds }: {
  record: LearningRecord;
  onWordClick?: (vocaId: number, word: string) => void;
  deletedVocaIds?: Set<number>; // 삭제된 단어 목록
}) {
  // wordResults가 있으면 순서대로 표시
  if (record.wordResults?.length) {
    return (
      <div className="flex flex-wrap gap-1">
        {record.wordResults.map((result) => {
          const isDeleted = deletedVocaIds?.has(result.vocaId);
          return (
            <Badge
              key={`${result.vocaId}-${result.word}`}
              onClick={() => !isDeleted && onWordClick?.(result.vocaId, result.word)}
              className={`text-xs px-1.5 py-0 ${
                isDeleted
                  ? 'bg-gray-200 text-gray-400 line-through cursor-not-allowed' // 삭제된 단어 스타일
                  : `cursor-pointer hover:opacity-80 ${
                      result.isCorrect
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`
              }`}
            >
              {result.word}
            </Badge>
          );
        })}
      </div>
    );
  }

  // 기존 방식 (하위 호환)
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

// 경과 시간 표시 컴포넌트 (1분마다 업데이트)
const ElapsedTime = React.memo(function ElapsedTime({ onlineAt }: { onlineAt: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    // 경과 시간 계산 함수
    const calcElapsed = (): string => {
      // check_in_time이 KST를 UTC로 잘못 저장되어 있어 보정 필요
      // DB에 저장된 시간을 그대로 로컬 시간으로 해석
      // "2026-01-15 13:36:15.708108+00" → "2026-01-15T13:36:15" (ISO 형식으로 변환)
      const timeStr = onlineAt
        .replace(/\+00:00$/, '')  // +00:00 제거
        .replace(/\+00$/, '')     // +00 제거
        .replace(/Z$/, '')        // Z 제거
        .replace(/\.\d+/, '')     // 밀리초 제거
        .replace(' ', 'T');       // 공백을 T로 변환
      const start = new Date(timeStr).getTime();
      const now = Date.now();
      const diffMs = now - start;

      if (isNaN(start)) return '시간오류';
      if (diffMs < 0) return '0분';

      const diffMin = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMin / 60);
      const mins = diffMin % 60;

      if (hours > 0) {
        return `${hours}시간 ${mins}분`;
      }
      return `${mins}분`;
    };

    // 초기 계산
    setElapsed(calcElapsed());

    // 1분마다 업데이트
    const interval = setInterval(() => {
      setElapsed(calcElapsed());
    }, 60000);

    return () => clearInterval(interval);
  }, [onlineAt]);

  return <span className="text-xs text-green-600 font-medium">{elapsed}</span>;
});

// 소요 시간 표시 컴포넌트 (1초마다 업데이트)
const DurationDisplay = React.memo(function DurationDisplay({
  startedAt,
  completedAt
}: {
  startedAt: string;
  completedAt: string | null;
}) {
  const [duration, setDuration] = useState(() => formatDuration(startedAt, completedAt));

  useEffect(() => {
    if (completedAt) return; // 완료된 세션은 업데이트 불필요

    const interval = setInterval(() => {
      setDuration(formatDuration(startedAt, completedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, completedAt]);

  const isInProgress = !completedAt;
  return (
    <span className={isInProgress ? 'text-blue-600 font-medium' : 'text-gray-600'}>
      {duration}
    </span>
  );
});

// 학생 로우 컴포넌트
const StudentRow = React.memo(function StudentRow({ summary, onDeleteOrphanSessions, presence, checkInTime, onWordClick, deletedVocaIds }: {
  summary: StudentSummary;
  onDeleteOrphanSessions: (records: { id: string; learningType: string }[]) => Promise<void>;
  presence?: StudentPresenceState;
  checkInTime?: string; // 체크인 시간 (등원 후 경과 시간 표시용)
  onWordClick?: (vocaId: number, word: string) => void;
  deletedVocaIds?: Set<number>; // 삭제된 단어 목록
}) {
  const isActive = summary.currentActivity !== null;
  const isOnline = !!presence;
  const isCheckedIn = !!checkInTime; // 체크인 상태 (등원 중)

  // 미완료(고아) 세션 목록
  const orphanRecords = summary.records.filter(r => r.completedAt === null);
  const hasOrphans = orphanRecords.length > 0;

  // 고아 세션 전체 삭제
  const handleDeleteOrphans = async (): Promise<void> => {
    if (!hasOrphans) return;
    await onDeleteOrphanSessions(orphanRecords.map(r => ({ id: r.id, learningType: r.learningType })));
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
          {/* 체크인 상태: 등원 후 경과 시간 표시 */}
          {isCheckedIn && (
            <ElapsedTime onlineAt={checkInTime} />
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
                      <span className="w-16">
                        <DurationDisplay startedAt={record.startedAt} completedAt={record.completedAt} />
                      </span>
                      <WordPangBadges record={record} onWordClick={onWordClick} deletedVocaIds={deletedVocaIds} />
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
                      <span className="w-16">
                        <DurationDisplay startedAt={record.startedAt} completedAt={record.completedAt} />
                      </span>
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
                        <span className={`w-16 ${record.completedAt ? 'text-gray-400' : 'text-blue-500 animate-pulse'}`}>
                          {formatDuration(record.startedAt, record.completedAt)}
                        </span>
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
                      <span className="w-16">
                        <DurationDisplay startedAt={record.startedAt} completedAt={record.completedAt} />
                      </span>
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
});

// 메인 컴포넌트
export function RealtimeKoreanV2() {
  const { academyId } = useAuthStore();
  const { records, wordCounts, historicalAccuracy, reviewCounts, checkInInfo, loading, connectionStatus, lastUpdate, deleteSession } = useRealtimeKorean(academyId);
  // Presence 훅 (academyId 그대로 전달 - UUID 문자열)
  const { getPresence, connectionStatus: presenceStatus } = useStudentPresence(academyId);

  // 숨긴 학생 목록
  const [hiddenStudents, setHiddenStudents] = useState<Set<number>>(new Set());
  const prevRecordsMapRef = useRef<Map<string, LearningRecord>>(new Map());

  // 삭제된 단어 목록 (vocaId 기반)
  const [deletedVocaIds, setDeletedVocaIds] = useState<Set<number>>(new Set());

  // 단어팡 상세 Dialog 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVocaId, setSelectedVocaId] = useState(0);
  const [selectedWord, setSelectedWord] = useState('');

  // 레코드 변경 감지 - 새 업데이트가 있는 학생은 다시 표시
  useEffect(() => {
    const prevMap = prevRecordsMapRef.current;
    const updatedStudentIds = new Set<number>();

    for (const record of records) {
      const prevRecord = prevMap.get(record.id);
      // 주요 필드만 비교 (JSON.stringify 대신)
      if (!prevRecord ||
          prevRecord.completedAt !== record.completedAt ||
          prevRecord.correctCount !== record.correctCount ||
          prevRecord.totalItems !== record.totalItems) {
        updatedStudentIds.add(record.studentId);
      }
    }

    if (updatedStudentIds.size > 0 && prevMap.size > 0) {
      setHiddenStudents(prev => {
        const newSet = new Set(prev);
        updatedStudentIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }

    // Map 업데이트
    const newMap = new Map<string, LearningRecord>();
    records.forEach(r => newMap.set(r.id, r));
    prevRecordsMapRef.current = newMap;
  }, [records]);

  // 학생의 고아 세션 전체 삭제
  const deleteOrphanSessions = useCallback(async (orphanRecords: { id: string; learningType: string }[]): Promise<void> => {
    for (const record of orphanRecords) {
      await deleteSession(record.id, record.learningType);
    }
  }, [deleteSession]);

  // 단어 클릭 핸들러
  const handleWordClick = useCallback((vocaId: number, word: string): void => {
    setSelectedVocaId(vocaId);
    setSelectedWord(word);
    setDialogOpen(true);
  }, []);

  // 단어 삭제 핸들러
  const handleWordDelete = useCallback((vocaId: number): void => {
    setDeletedVocaIds(prev => new Set([...prev, vocaId]));
  }, []);

  // checkInInfo Map의 내용을 문자열 시그니처로 변환 (Map 참조 변경 감지용)
  const checkInInfoSignature = useMemo(
    () => Array.from(checkInInfo.entries())
      .map(([id, info]) => `${id}:${info.hasCheckOut}:${info.checkInTime}`)
      .join('|'),
    [checkInInfo]
  );

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

    // 체크인/체크아웃 기준 정렬 (안정화 버전 - currentActivity 제거)
    // 1순위: 체크인만 있고 체크아웃 없음 (학원에서 공부 중) → 상단
    // 2순위: 체크아웃 있음 (하원 완료) → 하단
    // 각 그룹 내에서는 등원 시간순으로 고정하여 순서 깜빡임 방지
    summaries.sort((a, b) => {
      const aInfo = checkInInfo.get(a.studentId);
      const bInfo = checkInInfo.get(b.studentId);

      // 1차: 체크아웃 여부 (체크인중 = 상단)
      const aCheckedOut = aInfo?.hasCheckOut ?? true;
      const bCheckedOut = bInfo?.hasCheckOut ?? true;

      if (!aCheckedOut && bCheckedOut) return -1;
      if (aCheckedOut && !bCheckedOut) return 1;

      // 2차: 등원 시간순 (최근 등원 = 위, 오래된 등원 = 아래)
      const aCheckIn = aInfo?.checkInTime || '';
      const bCheckIn = bInfo?.checkInTime || '';
      if (aCheckIn && bCheckIn) {
        const timeDiff = new Date(bCheckIn).getTime() - new Date(aCheckIn).getTime();
        if (timeDiff !== 0) return timeDiff;
      } else if (aCheckIn && !bCheckIn) {
        return -1;
      } else if (!aCheckIn && bCheckIn) {
        return 1;
      }

      // 3차: 이름순
      const nameCompare = a.studentName.localeCompare(b.studentName);
      if (nameCompare !== 0) return nameCompare;

      // 4차: studentId로 최종 안정화 (절대 같을 수 없음)
      return a.studentId - b.studentId;
    });

    return summaries;
  }, [records, wordCounts, historicalAccuracy, reviewCounts, checkInInfoSignature]);

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
              checkInTime={checkInInfo.get(summary.studentId)?.checkInTime}
              onWordClick={handleWordClick}
              deletedVocaIds={deletedVocaIds}
            />
          ))}
        </div>
      )}

      {/* 단어팡 상세 Dialog */}
      <WordPangDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vocaId={selectedVocaId}
        word={selectedWord}
        onDelete={handleWordDelete}
      />
    </div>
  );
}
