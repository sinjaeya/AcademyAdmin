'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface PassageListItem {
  code_id: string | null;
  rubric_grade_level: string | null;
  rubric_difficulty_level: string | null;
  keyword_list: string[] | string | null;
  content: string | null;
  qa_status: string | null;
  char_count: number | null;
  paragraph_count: number | null;
}

type PassageDetail = Record<string, unknown> | null;

type StatusFilter = 'all' | 'pending' | 'reviewed' | 'approved' | 'rejected' | 'length_overflow';
type StatusKey = Exclude<StatusFilter, 'all'>;

type StatusCounts = Record<StatusKey, number>;

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  reviewed: 'bg-purple-100 text-purple-700',
  length_overflow: 'bg-orange-100 text-orange-700'
};

const STATUS_FILTERS: StatusFilter[] = ['all', 'pending', 'reviewed', 'approved', 'rejected', 'length_overflow'];

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: '전체',
  pending: '검수대기',
  reviewed: '리뷰했음',
  approved: '승인됨',
  rejected: '거절됨',
  length_overflow: '글자수 넘침'
};

const snippet = (value: string | null) => {
  if (!value) return '';
  return value.length > 20 ? `${value.slice(0, 20)}…` : value;
};

const keywordSnippet = (value: string[] | string | null) => {
  if (!value) return '';
  const asString = Array.isArray(value) ? value.join(', ') : value;
  return asString.length > 30 ? `${asString.slice(0, 30)}…` : asString;
};

const resolveContent = (detail: PassageDetail) => {
  if (!detail) return '';
  return (
    (detail.content as string | undefined) ??
    (detail.body as string | undefined) ??
    (detail.text as string | undefined) ??
    (detail.summary as string | undefined) ??
    ''
  );
};

const resolveStatusKey = (value: unknown): StatusKey | null => {
  if (!value) return null;
  const lower = String(value).toLowerCase();
  if (lower === 'all') {
    return null;
  }
  return STATUS_FILTERS.includes(lower as StatusFilter) ? (lower as StatusKey) : null;
};

export default function PassagesManagementPage() {
  const { toast } = useToast();
  const toastRef = useRef(toast);

  const [passages, setPassages] = useState<PassageListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    reviewed: 0,
    approved: 0,
    rejected: 0,
    length_overflow: 0
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PassageDetail>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [savingContent, setSavingContent] = useState(false);

  const lastFetchKeyRef = useRef<string | null>(null);
  const requestKey = `${statusFilter}:${currentPage}`;
  const isContentDirty = useMemo(() => editingContent !== originalContent, [editingContent, originalContent]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setDetail(null);
      setSelectedCodeId(null);
      setDetailLoading(false);
      setUpdatingStatus(false);
      setEditingContent('');
      setOriginalContent('');
      setSavingContent(false);
    }

    setDialogOpen(open);
  }, []);

  const loadPassages = useCallback(async () => {
    const key = `${statusFilter}:${currentPage}`;

    setLoadingList(true);
    setListError(null);
    lastFetchKeyRef.current = key;

    try {
      const offset = (currentPage - 1) * PAGE_SIZE;
      const searchParams = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset)
      });
      if (statusFilter !== 'all') {
        searchParams.set('status', statusFilter);
      }

      const response = await fetch(`/api/admin/contents/passages?${searchParams.toString()}`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '지문 목록을 가져오는 중 오류가 발생했습니다.');
      }

      const result = await response.json();
      const data = (result.data ?? []) as PassageListItem[];
      const count = typeof result.count === 'number' ? result.count : data.length;
      const countsPayload = result.statusCounts as Partial<Record<string, number>> | undefined;

      setPassages(data);
      setTotalCount(count);
      setStatusCounts({
        pending: countsPayload?.pending ?? 0,
        reviewed: countsPayload?.reviewed ?? 0,
        approved: countsPayload?.approved ?? 0,
        rejected: countsPayload?.rejected ?? 0,
        length_overflow: countsPayload?.length_overflow ?? 0
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '지문 목록을 가져오는 중 오류가 발생했습니다.';
      setListError(message);
      const toastFn = toastRef.current;
      toastFn?.({ type: 'error', description: message });
    } finally {
      setLoadingList(false);
    }
  }, [currentPage, statusFilter]);

  const loadDetail = useCallback(async (codeId: string) => {
    setDetail(null);
    setDetailLoading(true);

    try {
      const response = await fetch(`/api/admin/contents/passages/${encodeURIComponent(codeId)}`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '지문 상세를 가져오는 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setDetail(data);
      const content = resolveContent(data);
      setEditingContent(content);
      setOriginalContent(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : '지문 상세를 가져오는 중 오류가 발생했습니다.';
      const toastFn = toastRef.current;
      toastFn?.({ type: 'error', description: message });
      setDetail(null);
      setEditingContent('');
      setOriginalContent('');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (lastFetchKeyRef.current === requestKey) {
      return;
    }

    lastFetchKeyRef.current = requestKey;
    void loadPassages();
  }, [requestKey, loadPassages]);

  const totalPages = useMemo(() => {
    if (totalCount === 0) return 1;
    return Math.ceil(totalCount / PAGE_SIZE);
  }, [totalCount]);

  const totalStatusCount = useMemo(
    () => Object.values(statusCounts).reduce((sum, value) => sum + value, 0),
    [statusCounts]
  );

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    }
  };

  const handleStatusChange = (nextStatus: StatusFilter) => {
    if (statusFilter === nextStatus) return;
    setStatusFilter(nextStatus);
    setCurrentPage(1);
  };

  const statusCountLabel = (status: StatusFilter) => {
    if (status === 'all') {
      return totalStatusCount;
    }
    return statusCounts[status as StatusKey] ?? 0;
  };

  const handleRowClick = (codeId: string | null) => {
    if (!codeId) {
      const toastFn = toastRef.current;
      toastFn?.({ type: 'error', description: 'code_id가 없는 지문입니다.' });
      return;
    }
    setSelectedCodeId(codeId);
    handleDialogOpenChange(true);
    void loadDetail(codeId);
  };

  const handleSaveContent = useCallback(async () => {
    if (!selectedCodeId || !detail || !isContentDirty) {
      return;
    }

    try {
      setSavingContent(true);
      const response = await fetch(`/api/admin/contents/passages/${encodeURIComponent(selectedCodeId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editingContent, contentField: 'content' })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '본문을 저장하는 중 오류가 발생했습니다.');
      }

      const updatedRow = await response.json();
      const newContent = resolveContent(updatedRow);

      setDetail(updatedRow);
      setEditingContent(newContent);
      setOriginalContent(newContent);

      setPassages((prev) =>
        prev.map((item) =>
          item.code_id === selectedCodeId
            ? {
                ...item,
                content: newContent,
                char_count: (updatedRow?.char_count as number | null | undefined) ?? item.char_count,
                paragraph_count:
                  (updatedRow?.paragraph_count as number | null | undefined) ?? item.paragraph_count,
              }
            : item
        )
      );

      toastRef.current?.({ type: 'success', description: '본문이 저장되었습니다.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '본문을 저장하는 중 오류가 발생했습니다.';
      toastRef.current?.({ type: 'error', description: message });
    } finally {
      setSavingContent(false);
    }
  }, [detail, editingContent, isContentDirty, selectedCodeId]);

  const handleStatusUpdate = useCallback(
    async (nextStatus: 'approved' | 'rejected') => {
      if (!selectedCodeId) return;

      const previousStatusKey = resolveStatusKey(detail?.qa_status);

      if (isContentDirty) {
        toastRef.current?.({ type: 'warning', description: '본문 수정 내용을 먼저 저장해주세요.' });
        return;
      }

      try {
        setUpdatingStatus(true);
        const response = await fetch(`/api/admin/contents/passages/${encodeURIComponent(selectedCodeId)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: nextStatus })
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || '지문 상태를 업데이트하는 중 오류가 발생했습니다.');
        }

        const updatedRow = await response.json();
        const nextStatusKey = resolveStatusKey(updatedRow?.qa_status ?? nextStatus);
        const nextStatusString =
          typeof updatedRow?.qa_status === 'string' ? updatedRow.qa_status : nextStatus;

        toastRef.current?.({
          type: 'success',
          description: nextStatus === 'approved' ? '지문이 승인되었습니다.' : '지문이 거절되었습니다.'
        });

        setStatusCounts((prev) => {
          const nextCounts = { ...prev };

          if (previousStatusKey && previousStatusKey !== nextStatusKey) {
            nextCounts[previousStatusKey] = Math.max(0, (nextCounts[previousStatusKey] ?? 0) - 1);
          }

          if (nextStatusKey) {
            if (previousStatusKey !== nextStatusKey) {
              nextCounts[nextStatusKey] = (nextCounts[nextStatusKey] ?? 0) + 1;
            }
          }

          return nextCounts;
        });

        if (statusFilter !== 'all') {
          setTotalCount((prevTotal) => {
            if (previousStatusKey === statusFilter && nextStatusKey !== statusFilter) {
              return Math.max(0, prevTotal - 1);
            }
            if (previousStatusKey !== statusFilter && nextStatusKey === statusFilter) {
              return prevTotal + 1;
            }
            return prevTotal;
          });
        }

        setPassages((prev) => {
          const updatedList = prev.map((item) =>
            item.code_id === selectedCodeId ? { ...item, qa_status: nextStatusString } : item
          );

          const shouldKeep =
            statusFilter === 'all' || (nextStatusKey !== null && statusFilter === nextStatusKey);

          if (!shouldKeep) {
            return updatedList.filter((item) => item.code_id !== selectedCodeId);
          }

          return updatedList;
        });
        handleDialogOpenChange(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : '지문 상태를 업데이트하는 중 오류가 발생했습니다.';
        toastRef.current?.({ type: 'error', description: message });
      } finally {
        setUpdatingStatus(false);
      }
    },
    [detail, selectedCodeId, statusFilter, handleDialogOpenChange, isContentDirty]
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">지문관리</h1>
            <p className="mt-1 text-gray-600">
              passage 테이블의 지문 목록을 확인하고 상태를 검토합니다.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="self-start sm:self-auto"
            onClick={() => {
              lastFetchKeyRef.current = null;
              void loadPassages();
            }}
          >
            새로고침
          </Button>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>지문 목록</CardTitle>
            <CardDescription>
              {statusFilter === 'all'
                ? 'passage 테이블에서 조회한 전체 지문입니다.'
                : `${STATUS_LABELS[statusFilter]} 지문만 표시합니다.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
              {STATUS_FILTERS.map((status) => {
                const isActive = statusFilter === status;
                return (
                  <Button
                    key={status}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                    className="flex items-center gap-1 capitalize"
                  >
                    <span>{STATUS_LABELS[status]}</span>
                    <span className={`text-xs ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                      ({statusCountLabel(status)})
                    </span>
                  </Button>
                );
              })}
            </div>

            {loadingList ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <p>지문 목록을 불러오는 중입니다...</p>
              </div>
            ) : listError ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
                <p>{listError}</p>
                <button
                  type="button"
                  onClick={() => {
                    lastFetchKeyRef.current = null;
                    void loadPassages();
                  }}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  다시 시도
                </button>
              </div>
            ) : passages.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-500">지문 데이터가 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[110px]">code_id</TableHead>
                      <TableHead>학년</TableHead>
                      <TableHead>난이도</TableHead>
                      <TableHead>키워드</TableHead>
                      <TableHead>본문 미리보기</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-right">문자 수</TableHead>
                      <TableHead className="text-right">문단 수</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passages.map((item) => {
                      const statusClass =
                        STATUS_STYLES[item.qa_status?.toLowerCase() ?? ''] ?? 'bg-gray-100 text-gray-700';
                      const isSelected = dialogOpen && selectedCodeId === item.code_id;

                      return (
                        <TableRow
                          key={item.code_id ?? Math.random().toString(36)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleRowClick(item.code_id)}
                        >
                          <TableCell className="font-medium text-gray-900">
                            {item.code_id ?? '-'}
                          </TableCell>
                          <TableCell>{item.rubric_grade_level ?? '-'}</TableCell>
                          <TableCell>{item.rubric_difficulty_level ?? '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">{keywordSnippet(item.keyword_list)}</TableCell>
                          <TableCell className="text-sm text-gray-600">{snippet(item.content)}</TableCell>
                          <TableCell>
                            <Badge className={statusClass}>{item.qa_status ?? '-'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.char_count ?? '-'}</TableCell>
                          <TableCell className="text-right">{item.paragraph_count ?? '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-sm text-gray-600">
                  <div>
                    총 {totalCount.toLocaleString()}건 · 페이지 {currentPage} / {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={!canGoPrev}
                      className={`rounded px-3 py-1 font-medium transition-colors ${
                        canGoPrev
                          ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      이전
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canGoNext}
                      className={`rounded px-3 py-1 font-medium transition-colors ${
                        canGoNext
                          ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      다음
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-10 sm:max-w-5xl">
          <div className="flex h-full flex-col gap-6">
            <DialogHeader>
              <DialogTitle>지문 상세</DialogTitle>
              <DialogDescription>
                {selectedCodeId ? `code_id: ${selectedCodeId}` : '지문을 선택하면 상세 정보를 확인할 수 있습니다.'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              {detailLoading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-500">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  <p>지문 상세를 불러오는 중입니다...</p>
                </div>
              ) : !detail ? (
                <div className="flex h-full items-center justify-center py-6 text-sm text-gray-500">
                  지문 상세 정보를 가져올 수 없습니다.
                </div>
              ) : (
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-600">현재 상태</span>
                    <Badge className={STATUS_STYLES[String(detail.qa_status).toLowerCase()] ?? 'bg-gray-100 text-gray-700'}>
                      {String(detail.qa_status ?? '-')}
                    </Badge>
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700" htmlFor="passage-content">
                      본문
                    </label>
                    <Textarea
                      id="passage-content"
                      value={editingContent}
                      onChange={(event) => setEditingContent(event.target.value)}
                      disabled={detailLoading || updatingStatus || savingContent}
                      className="flex-1 min-h-[360px] resize-none"
                      placeholder="본문 내용이 없습니다."
                    />
                    {savingContent && (
                      <p className="text-right text-xs text-muted-foreground">저장 중...</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="destructive"
                disabled={detailLoading || updatingStatus || !detail}
                onClick={() => handleStatusUpdate('rejected')}
                className="sm:w-auto"
              >
                거절
              </Button>
              <Button
                variant="outline"
                disabled={!detail || detailLoading || savingContent || updatingStatus || !isContentDirty}
                onClick={handleSaveContent}
                className="sm:w-auto"
              >
                저장
              </Button>
              <Button
                disabled={detailLoading || updatingStatus || !detail}
                onClick={() => handleStatusUpdate('approved')}
                className="sm:w-auto"
              >
                승인
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

