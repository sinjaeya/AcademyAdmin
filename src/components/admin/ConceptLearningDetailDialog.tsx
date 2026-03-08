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

// 개념 트리 노드 타입
interface TreeNode {
  id: string;
  title: string;
  depth: number;
  is_quizzable: boolean;
  leitner_box: number | null;
  total_reviews: number;
  correct_reviews: number;
  children: TreeNode[];
}

// 학습 이력 항목 타입
interface HistoryItem {
  id: string;
  created_at: string;
  total_items: number;
  correct_count: number;
  duration_seconds: number;
}

// 요약 정보 타입
interface Summary {
  totalConcepts: number;
  learnedConcepts: number;
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

// 라이트너 박스 번호에 따른 색상 반환
function getLeitnerColor(box: number | null): string {
  if (box === null) return '#D1D5DB'; // 회색 - 미학습
  if (box === 1) return '#F97316';    // 주황 - 약함
  if (box === 2) return '#EAB308';    // 노랑 - 보통
  if (box === 3) return '#22C55E';    // 녹색 - 양호
  return '#3B82F6';                    // 파랑 - 마스터
}

// 라이트너 박스 번호에 따른 라벨 반환
function getLeitnerLabel(box: number | null): string {
  if (box === null) return '미학습';
  if (box === 1) return '약함';
  if (box === 2) return '보통';
  if (box === 3) return '양호';
  return '마스터';
}

// 초를 "Xm Ys" 형식으로 변환
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

// created_at을 KST YYYY-MM-DD HH:mm 형식으로 변환
function formatKst(isoString: string): string {
  return new Date(isoString).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(/\. /g, '-').replace('.', '').replace(',', '');
}

// 개념 트리 노드를 재귀적으로 렌더링하는 컴포넌트
function TreeNodeItem({ node }: { node: TreeNode }) {
  // depth별 들여쓰기 (Tailwind JIT 이슈 방지를 위해 inline style 사용)
  const paddingLeft = node.depth * 24;

  // depth별 폰트 스타일
  let fontClass = 'text-sm text-gray-700';
  if (node.depth === 0) fontClass = 'font-bold text-base';
  else if (node.depth === 1) fontClass = 'font-semibold text-sm';

  return (
    <>
      <div
        className="flex items-center gap-2 py-1"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {/* 퀴즈 가능한 노드에만 신호등 닷 표시 */}
        {node.is_quizzable && (
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: getLeitnerColor(node.leitner_box) }}
            title={getLeitnerLabel(node.leitner_box)}
          />
        )}
        <span className={fontClass}>{node.title}</span>
      </div>

      {/* 자식 노드 재귀 렌더링 */}
      {node.children.map((child) => (
        <TreeNodeItem key={child.id} node={child} />
      ))}
    </>
  );
}

// 범례에 사용할 상태 목록
const LEITNER_LEGEND = [
  { box: null, label: '미학습' },
  { box: 1, label: '약함' },
  { box: 2, label: '보통' },
  { box: 3, label: '양호' },
  { box: 4, label: '마스터' },
] as const;

export function ConceptLearningDetailDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  textbookId,
  textbookLabel,
}: Props) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
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
          fetch(`/api/admin/concept-learning/${studentId}/tree?textbook_id=${textbookId}`),
          fetch(`/api/admin/concept-learning/${studentId}/history?textbook_id=${textbookId}`),
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
                      총 개념 {summary.totalConcepts}개
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                      학습 완료 {summary.learnedConcepts}개
                    </span>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                      평균 점수 {summary.averageScore}%
                    </span>
                  </div>
                )}

                {/* 신호등 범례 */}
                <div className="flex items-center gap-3 flex-wrap ml-auto">
                  {LEITNER_LEGEND.map(({ box, label }) => (
                    <span key={label} className="flex items-center gap-1 text-xs text-gray-600">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getLeitnerColor(box) }}
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* 개념 트리 */}
              <div className="border rounded-lg p-3 bg-gray-50">
                {treeData.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    개념 트리 데이터가 없습니다.
                  </p>
                ) : (
                  treeData.map((node) => (
                    <TreeNodeItem key={node.id} node={node} />
                  ))
                )}
              </div>

              <hr className="my-4" />

              {/* 학습 이력 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">학습 이력</h3>
                {historyData.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    학습 이력이 없습니다.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>날짜</TableHead>
                        <TableHead className="text-right">문항수</TableHead>
                        <TableHead className="text-right">정답수</TableHead>
                        <TableHead className="text-right">정답률</TableHead>
                        <TableHead className="text-right">소요시간</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyData.map((item) => {
                        const accuracy =
                          item.total_items > 0
                            ? Math.round((item.correct_count / item.total_items) * 100)
                            : 0;
                        const isLow = accuracy < 80;

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm text-gray-700">
                              {formatKst(item.created_at)}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {item.total_items}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {item.correct_count}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              <span className={isLow ? 'text-red-600 font-semibold' : 'text-gray-800'}>
                                {accuracy}%
                              </span>
                            </TableCell>
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
