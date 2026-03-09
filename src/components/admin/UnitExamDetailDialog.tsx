'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// 세트 응시 상태 타입
interface SetStatus {
  set_id: string;
  set_number: number;
  score: number | null;     // null=미응시
  completed_at: string | null;
  duration_seconds: number | null;
}

// 단원 트리 노드 타입
interface UnitTreeNode {
  id: string;
  unit_code: string | null;
  title: string;
  depth: number;            // 0=대단원, 1=소단원
  children: UnitTreeNode[];
  sets?: SetStatus[];       // 소단원에만 존재
}

// 응시 이력 항목 타입
interface HistoryItem {
  id: number;
  created_at: string;
  completed_at: string | null;
  unit_range: string;
  unit_title: string;
  set_number: number;
  total_items: number;
  correct_count: number;
  score: number | null;
  duration_seconds: number | null;
}

// 요약 정보 타입
interface Summary {
  totalSets: number;
  attemptedSets: number;
  averageScore: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number;
  studentName: string;
  textbookId: string;
  textbookLabel: string;
}

// 점수에 따른 Badge 스타일 반환 (미응시/80점+/80점 미만)
function getScoreBadgeClass(score: number | null): string {
  if (score === null) return 'bg-gray-100 text-gray-400';
  if (score >= 80) return 'bg-green-100 text-green-700';
  return 'bg-orange-100 text-orange-700';
}

// 점수 표시 텍스트
function getScoreText(score: number | null): string {
  if (score === null) return '-';
  return `${Math.round(score)}점`;
}

// 초를 "Xm Ys" 형식으로 변환
function formatDuration(seconds: number | null): string {
  if (seconds === null) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

// created_at을 KST YYYY-MM-DD HH:mm 형식으로 변환
function formatKst(isoString: string): string {
  return new Date(isoString)
    .toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(/\. /g, '-')
    .replace('.', '')
    .replace(',', '');
}

// 범례 항목
const SCORE_LEGEND = [
  { label: '미응시', className: 'bg-gray-100 text-gray-400' },
  { label: '80점+', className: 'bg-green-100 text-green-700' },
  { label: '80점 미만', className: 'bg-orange-100 text-orange-700' },
] as const;

// 대단원 노드 렌더링 (내부에 소단원 포함)
function UnitSection({ node }: { node: UnitTreeNode }) {
  return (
    <div className="mb-3">
      {/* 대단원 제목 */}
      <div className="font-bold text-base text-gray-900 py-1.5 px-2 bg-gray-50 rounded mb-1">
        {node.title}
      </div>

      {/* 소단원 목록 */}
      {node.children.map((child) => (
        <SubUnitRow key={child.id} node={child} />
      ))}
    </div>
  );
}

// 소단원 행 렌더링 (세트 뱃지 가로 배열)
function SubUnitRow({ node }: { node: UnitTreeNode }) {
  const sets = node.sets ?? [];

  return (
    <div className="flex items-center gap-3 py-1.5 px-3 hover:bg-gray-50 rounded">
      {/* 소단원명 */}
      <span className="text-sm text-gray-700 w-44 flex-shrink-0">
        {node.unit_code && (
          <span className="text-xs text-gray-400 mr-1">{node.unit_code}</span>
        )}
        {node.title}
      </span>

      {/* 세트 뱃지 가로 배열 */}
      <div className="flex gap-1.5 flex-wrap">
        {sets.length === 0 ? (
          <span className="text-xs text-gray-400">세트 없음</span>
        ) : (
          sets.map((set) => (
            <span
              key={set.set_id}
              className={`inline-flex items-center justify-center text-xs font-medium px-2.5 py-0.5 rounded-full ${getScoreBadgeClass(set.score)}`}
              title={set.completed_at ? `응시: ${formatKst(set.completed_at)}` : '미응시'}
            >
              {set.set_number}세트 {getScoreText(set.score)}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

export function UnitExamDetailDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  textbookId,
  textbookLabel,
}: Props) {
  const [treeData, setTreeData] = useState<UnitTreeNode[]>([]);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  // 다이얼로그가 열리고 studentId/textbookId가 변경될 때 데이터 조회
  useEffect(() => {
    if (!open || !studentId || !textbookId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 트리와 이력을 병렬로 조회
        const [treeRes, historyRes] = await Promise.all([
          fetch(`/api/admin/unit-exam/${studentId}/tree?textbook_id=${textbookId}`),
          fetch(`/api/admin/unit-exam/${studentId}/history?textbook_id=${textbookId}`),
        ]);

        const [treeResult, historyResult] = await Promise.all([
          treeRes.json(),
          historyRes.json(),
        ]);

        if (treeResult.success) {
          setTreeData(treeResult.data.tree ?? []);
          setSummary(treeResult.data.summary ?? null);
        }
        if (historyResult.success) {
          setHistoryData(historyResult.data ?? []);
        }
      } catch {
        // 네트워크 오류 - 빈 상태로 유지
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, studentId, textbookId]);

  // 다이얼로그 닫힐 때 상태 초기화
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setTreeData([]);
      setHistoryData([]);
      setSummary(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {studentName} — {textbookLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[80vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
          ) : (
            <>
              {/* 요약 + 범례 영역 */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {/* 요약 뱃지 */}
                {summary && (
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      전체 세트 {summary.totalSets}개
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                      응시 {summary.attemptedSets}개
                    </span>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                      평균 점수 {summary.averageScore}점
                    </span>
                  </div>
                )}

                {/* 점수 범례 */}
                <div className="flex items-center gap-2 flex-wrap ml-auto">
                  {SCORE_LEGEND.map(({ label, className }) => (
                    <span
                      key={label}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* 단원 트리 영역 */}
              <div className="border rounded-lg p-3 bg-white">
                {treeData.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    단원 데이터가 없습니다.
                  </p>
                ) : (
                  treeData.map((node) => (
                    <UnitSection key={node.id} node={node} />
                  ))
                )}
              </div>

              <hr className="my-4" />

              {/* 응시 이력 테이블 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">응시 이력</h3>
                {historyData.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    응시 이력이 없습니다.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>날짜</TableHead>
                        <TableHead>소단원</TableHead>
                        <TableHead className="text-center">세트</TableHead>
                        <TableHead className="text-right">점수</TableHead>
                        <TableHead className="text-right">소요시간</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyData.map((item) => {
                        const isLow = item.score !== null && item.score < 80;
                        const isCompleted = item.completed_at !== null;

                        return (
                          <TableRow key={item.id}>
                            {/* 날짜 */}
                            <TableCell className="text-sm text-gray-700">
                              {formatKst(item.created_at)}
                            </TableCell>

                            {/* 소단원명 */}
                            <TableCell className="text-sm text-gray-700">
                              {item.unit_range && (
                                <span className="text-xs text-gray-400 mr-1">{item.unit_range}</span>
                              )}
                              {item.unit_title || '-'}
                            </TableCell>

                            {/* 세트 번호 */}
                            <TableCell className="text-center text-sm text-gray-600">
                              {item.set_number}세트
                            </TableCell>

                            {/* 점수 */}
                            <TableCell className="text-right text-sm">
                              {!isCompleted ? (
                                <span className="text-gray-400">미완료</span>
                              ) : item.score !== null ? (
                                <span className={isLow ? 'text-orange-500 font-semibold' : 'text-green-600 font-semibold'}>
                                  {Math.round(item.score)}점
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>

                            {/* 소요시간 */}
                            <TableCell className="text-right text-sm text-gray-600">
                              {formatDuration(item.duration_seconds)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
