'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClipboardList, Pencil, RefreshCw, BookOpenCheck, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

// 숙제 현황 항목 타입
interface HomeworkItem {
  id: number;
  student_id: number;
  student_name: string;
  school: string;
  grade: string;
  assigned_date: string;
  word_count: number;
  session_id: number | null;
  completed_at: string | null;
  is_completed: boolean;
  score: number | null;
}

// 단어수 편집 다이얼로그 상태 타입
interface WordCountEditTarget {
  studentId: number;
  studentName: string;
  currentCount: number;
}

export default function HomeworkPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // 오늘 날짜 (KST 기준)
  const todayKst = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });

  const [selectedDate, setSelectedDate] = useState(todayKst);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 숙제 배정 확인 다이얼로그
  const [assignConfirmOpen, setAssignConfirmOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // 단어수 편집 다이얼로그
  const [wordCountEditTarget, setWordCountEditTarget] = useState<WordCountEditTarget | null>(null);
  const [wordCountInput, setWordCountInput] = useState('');
  const [wordCountSaving, setWordCountSaving] = useState(false);

  // 삭제 확인 다이얼로그
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // 학생별 word_count 로컬 캐시 (편집 후 즉시 반영용)
  const [wordCountCache, setWordCountCache] = useState<Record<number, number>>({});

  // 숙제 현황 조회 (silent: true이면 로딩 표시 안 함)
  const fetchHomework = useCallback(async (silent = false) => {
    if (!user?.academy_id) return;

    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({
        academy_id: user.academy_id,
        date: selectedDate,
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/homework?${params.toString()}`);
      const result = await res.json();

      if (result.success) {
        setItems(result.data);
        // 단어수 캐시 초기화
        const cache: Record<number, number> = {};
        for (const item of result.data as HomeworkItem[]) {
          cache[item.student_id] = item.word_count;
        }
        setWordCountCache((prev) => ({ ...prev, ...cache }));
      } else {
        toastRef.current({ title: '오류', description: result.error, type: 'error' });
      }
    } catch {
      toastRef.current({ title: '오류', description: '숙제 현황을 불러오지 못했습니다.', type: 'error' });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.academy_id, selectedDate, statusFilter]);

  useEffect(() => {
    fetchHomework();
  }, [fetchHomework]);

  // 숙제 일괄 배정
  const handleAssign = async () => {
    if (!user?.academy_id) return;

    setAssigning(true);
    try {
      const res = await fetch('/api/admin/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academy_id: user.academy_id, date: selectedDate }),
      });
      const result = await res.json();

      if (result.success) {
        toast({ title: '배정 완료', description: result.message, type: 'success' });
        await fetchHomework(true);
      } else {
        toast({ title: '오류', description: result.error, type: 'error' });
      }
    } catch {
      toast({ title: '오류', description: '숙제 배정 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setAssigning(false);
      setAssignConfirmOpen(false);
    }
  };

  // 단어수 편집 다이얼로그 열기
  const openWordCountEdit = (item: HomeworkItem) => {
    const currentCount = wordCountCache[item.student_id] ?? item.word_count;
    setWordCountEditTarget({
      studentId: item.student_id,
      studentName: item.student_name,
      currentCount,
    });
    setWordCountInput(String(currentCount));
  };

  // 단어수 저장
  const handleWordCountSave = async () => {
    if (!wordCountEditTarget) return;

    const num = parseInt(wordCountInput, 10);
    if (isNaN(num) || num < 1 || num > 100) {
      toast({ title: '오류', description: '단어 수는 1~100 사이여야 합니다.', type: 'error' });
      return;
    }

    setWordCountSaving(true);
    try {
      const res = await fetch('/api/admin/homework/word-count', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: wordCountEditTarget.studentId,
          daily_word_count: num,
        }),
      });
      const result = await res.json();

      if (result.success) {
        // 캐시 및 테이블 즉시 반영
        setWordCountCache((prev) => ({ ...prev, [wordCountEditTarget.studentId]: num }));
        setItems((prev) =>
          prev.map((item) =>
            item.student_id === wordCountEditTarget.studentId
              ? { ...item, word_count: num }
              : item
          )
        );
        toast({ title: '저장됨', description: `${wordCountEditTarget.studentName}의 단어 수가 ${num}개로 변경되었습니다.`, type: 'success' });
        setWordCountEditTarget(null);
      } else {
        toast({ title: '오류', description: result.error, type: 'error' });
      }
    } catch {
      toast({ title: '오류', description: '단어 수 업데이트 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setWordCountSaving(false);
    }
  };

  // 개별 삭제
  const handleDeleteOne = async (item: HomeworkItem) => {
    setDeletingIds((prev) => new Set(prev).add(item.id));
    try {
      const res = await fetch(`/api/admin/homework?id=${item.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        toast({ title: '오류', description: result.error, type: 'error' });
      }
    } catch {
      toast({ title: '오류', description: '삭제 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  // 전체 삭제
  const handleDeleteAll = async () => {
    if (!user?.academy_id) return;
    setDeletingAll(true);
    try {
      const params = new URLSearchParams({ date: selectedDate, academy_id: user.academy_id });
      const res = await fetch(`/api/admin/homework?${params.toString()}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        toast({ title: '삭제 완료', description: result.message, type: 'success' });
        setItems([]);
      } else {
        toast({ title: '오류', description: result.error, type: 'error' });
      }
    } catch {
      toast({ title: '오류', description: '전체 삭제 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setDeletingAll(false);
      setDeleteAllConfirmOpen(false);
    }
  };

  // 완료/미완료 건수 계산
  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* 페이지 헤더 */}
        <div className="flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">단어팡 숙제 현황</h1>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-gray-500 font-medium">전체 배정</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-gray-900">{totalCount}명</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-gray-500 font-medium">완료</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-green-600">{completedCount}명</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-gray-500 font-medium">미완료</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-yellow-600">{totalCount - completedCount}명</p>
            </CardContent>
          </Card>
        </div>

        {/* 필터 바 */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* 날짜 선택 */}
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40 h-9 text-sm cursor-pointer"
          />

          {/* 상태 필터 */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as 'all' | 'pending' | 'completed')}
          >
            <SelectTrigger className="w-32 h-9 text-sm cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">미완료</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
            </SelectContent>
          </Select>

          {/* 새로고침 버튼 */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 cursor-pointer"
            onClick={() => fetchHomework()}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-1.5', loading && 'animate-spin')} />
            새로고침
          </Button>

          {/* 전체 삭제 버튼 */}
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 ml-auto cursor-pointer text-red-600 hover:text-red-700 hover:border-red-300"
              onClick={() => setDeleteAllConfirmOpen(true)}
              disabled={deletingAll}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              전체 삭제
            </Button>
          )}

          {/* 숙제 배정 버튼 */}
          <Button
            size="sm"
            className={cn('h-9 cursor-pointer', items.length === 0 && 'ml-auto')}
            onClick={() => setAssignConfirmOpen(true)}
            disabled={assigning}
          >
            <BookOpenCheck className="w-4 h-4 mr-1.5" />
            숙제 배정
          </Button>
        </div>

        {/* 숙제 현황 테이블 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">학생명</TableHead>
                  <TableHead className="w-[110px]">학교</TableHead>
                  <TableHead className="w-[80px]">학년</TableHead>
                  <TableHead className="w-[110px]">단어수</TableHead>
                  <TableHead className="w-[90px]">상태</TableHead>
                  <TableHead className="w-[90px]">정답률</TableHead>
                  <TableHead>완료시각</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                      불러오는 중...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                      {selectedDate} 날짜에 배정된 숙제가 없습니다.
                      <br />
                      <span className="text-xs">&apos;숙제 배정&apos; 버튼을 눌러 배정하세요.</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    // 정답률 80% 미만이면 행 하이라이트
                    const isLowScore =
                      item.is_completed && item.score !== null && item.score < 80;
                    const displayWordCount = wordCountCache[item.student_id] ?? item.word_count;

                    return (
                      <TableRow
                        key={item.id}
                        className={cn(isLowScore && 'bg-red-50')}
                      >
                        {/* 학생명 */}
                        <TableCell className="font-medium text-sm">
                          {item.student_name}
                        </TableCell>

                        {/* 학교 */}
                        <TableCell className="text-sm text-gray-600">
                          {item.school || '-'}
                        </TableCell>

                        {/* 학년 */}
                        <TableCell className="text-sm text-gray-600">
                          {item.grade || '-'}
                        </TableCell>

                        {/* 단어수 + 편집 아이콘 */}
                        <TableCell className="text-sm">
                          <span className="flex items-center gap-1">
                            {displayWordCount}개
                            <button
                              className="text-gray-400 hover:text-blue-600 cursor-pointer transition-colors"
                              title="단어 수 조정"
                              onClick={() => openWordCountEdit(item)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        </TableCell>

                        {/* 상태 뱃지 */}
                        <TableCell>
                          {item.is_completed ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                              완료
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs">
                              미완료
                            </Badge>
                          )}
                        </TableCell>

                        {/* 정답률 */}
                        <TableCell className="text-sm">
                          {item.score !== null ? (
                            <span
                              className={cn(
                                'font-semibold',
                                isLowScore ? 'text-red-600 font-bold' : 'text-gray-800'
                              )}
                            >
                              {item.score}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>

                        {/* 완료시각 */}
                        <TableCell className="text-sm text-gray-600">
                          {item.completed_at
                            ? new Date(item.completed_at).toLocaleTimeString('ko-KR', {
                                timeZone: 'Asia/Seoul',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </TableCell>

                        {/* 삭제 */}
                        <TableCell>
                          <button
                            className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors disabled:opacity-40"
                            title="삭제"
                            onClick={() => handleDeleteOne(item)}
                            disabled={deletingIds.has(item.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 숙제 배정 확인 다이얼로그 */}
      <Dialog open={assignConfirmOpen} onOpenChange={setAssignConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>숙제 배정</DialogTitle>
            <DialogDescription>
              {selectedDate} 날짜로 재원 학생 전체에게 단어팡 숙제를 배정합니다.
              이미 배정된 학생은 건너뜁니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setAssignConfirmOpen(false)}
              disabled={assigning}
            >
              취소
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleAssign}
              disabled={assigning}
            >
              {assigning ? '배정 중...' : '배정하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 전체 삭제 확인 다이얼로그 */}
      <Dialog open={deleteAllConfirmOpen} onOpenChange={setDeleteAllConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>전체 삭제</DialogTitle>
            <DialogDescription>
              {selectedDate} 날짜의 숙제 {totalCount}건을 모두 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDeleteAllConfirmOpen(false)}
              disabled={deletingAll}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={handleDeleteAll}
              disabled={deletingAll}
            >
              {deletingAll ? '삭제 중...' : '전체 삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 단어수 편집 다이얼로그 */}
      <Dialog
        open={wordCountEditTarget !== null}
        onOpenChange={(open) => { if (!open) setWordCountEditTarget(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>단어 수 조정</DialogTitle>
            <DialogDescription>
              {wordCountEditTarget?.studentName}의 일일 단어팡 단어 수를 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="word-count-input" className="text-sm mb-1.5 block">
              단어 수 (1~100)
            </Label>
            <Input
              id="word-count-input"
              type="number"
              min={1}
              max={100}
              value={wordCountInput}
              onChange={(e) => setWordCountInput(e.target.value)}
              className="h-9"
              onKeyDown={(e) => { if (e.key === 'Enter') handleWordCountSave(); }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setWordCountEditTarget(null)}
              disabled={wordCountSaving}
            >
              취소
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleWordCountSave}
              disabled={wordCountSaving}
            >
              {wordCountSaving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
