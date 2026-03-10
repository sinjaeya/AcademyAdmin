'use client';

import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CalendarCheck, Pencil, Trash2, Ban } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth';
import { ExamScheduleFormDialog } from '@/components/admin/ExamScheduleFormDialog';
import type { ExamScheduleItem } from '@/app/api/admin/exam-schedule/route';

// D-day 표시 색상 클래스 반환
function getDdayColorClass(item: ExamScheduleItem): string {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });

  // 시험 종료 여부
  if (item.end_date < today) return 'text-gray-400';

  // 시험 진행 중 (start_date <= today <= end_date)
  if (item.start_date <= today && today <= item.end_date) return 'text-blue-600 font-semibold';

  // 시험 시작 전
  const dDay = item.d_day ?? 0;
  if (dDay <= 7) return 'text-red-600 font-bold';
  if (dDay <= 14) return 'text-orange-500 font-semibold';
  return 'text-gray-700';
}

// D-day 텍스트 반환
function getDdayText(item: ExamScheduleItem): string {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });

  if (item.end_date < today) return '종료';
  if (item.start_date <= today && today <= item.end_date) return '진행중';
  if (item.d_day === 0) return 'D-Day';
  return `D-${item.d_day}`;
}

export default function ExamSchedulePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [schedules, setSchedules] = useState<ExamScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 등록/수정 다이얼로그 상태
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<ExamScheduleItem | null>(null);

  // 삭제 확인 다이얼로그 상태
  const [deleteTarget, setDeleteTarget] = useState<ExamScheduleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 숙제중단 확인 다이얼로그 상태
  const [suspendTarget, setSuspendTarget] = useState<ExamScheduleItem | null>(null);
  const [suspending, setSuspending] = useState(false);

  // 시험기간 목록 조회
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/exam-schedule');
      const result = await res.json();
      if (result.success) {
        setSchedules(result.data ?? []);
      } else {
        toastRef.current({ title: '오류', description: result.error, type: 'error' });
      }
    } catch {
      toastRef.current({ title: '오류', description: '시험기간 데이터를 불러오지 못했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  // user 의존성은 불필요 (auth-independent 목록)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 등록 버튼 클릭
  const handleOpenCreate = () => {
    setEditData(null);
    setFormOpen(true);
  };

  // 수정 버튼 클릭
  const handleOpenEdit = (item: ExamScheduleItem) => {
    setEditData(item);
    setFormOpen(true);
  };

  // 삭제 확인
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/exam-schedule/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        toastRef.current({ title: '삭제 완료', description: '시험기간이 삭제되었습니다.', type: 'success' });
        setDeleteTarget(null);
        fetchSchedules();
      } else {
        toastRef.current({ title: '삭제 실패', description: result.error, type: 'error' });
      }
    } catch {
      toastRef.current({ title: '오류', description: '삭제 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // 숙제중단 확인
  const handleSuspendConfirm = async () => {
    if (!suspendTarget) return;
    setSuspending(true);
    try {
      const res = await fetch('/api/admin/exam-schedule/suspend-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_schedule_id: suspendTarget.id, academy_id: user?.academy_id }),
      });
      const result = await res.json();
      if (result.success) {
        const count = result.data?.deleted_count ?? 0;
        toastRef.current({
          title: '숙제 중단 완료',
          description: `미완료 숙제 ${count}건이 삭제되었습니다.`,
          type: 'success',
        });
        setSuspendTarget(null);
      } else {
        toastRef.current({ title: '숙제 중단 실패', description: result.error, type: 'error' });
      }
    } catch {
      toastRef.current({ title: '오류', description: '숙제 중단 처리 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setSuspending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">시험기간 관리</h1>
          </div>
          <Button onClick={handleOpenCreate} className="cursor-pointer">
            + 시험기간 등록
          </Button>
        </div>

        {/* 시험기간 목록 테이블 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">학교</TableHead>
                  <TableHead className="w-[60px]">학년</TableHead>
                  <TableHead className="w-[90px]">시험유형</TableHead>
                  <TableHead className="w-[180px]">시험기간</TableHead>
                  <TableHead>교재</TableHead>
                  <TableHead className="w-[90px]">범위</TableHead>
                  <TableHead className="w-[70px]">D-day</TableHead>
                  <TableHead className="w-[120px]">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                      불러오는 중...
                    </TableCell>
                  </TableRow>
                ) : schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                      등록된 시험기간이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((item) => (
                    <TableRow key={item.id}>
                      {/* 학교명 */}
                      <TableCell className="text-sm font-medium">{item.school_name}</TableCell>

                      {/* 학년 */}
                      <TableCell className="text-sm text-gray-700">{item.grade}</TableCell>

                      {/* 시험유형 Badge */}
                      <TableCell>
                        <Badge
                          variant={item.exam_type === 'midterm' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {item.exam_type_label}
                        </Badge>
                      </TableCell>

                      {/* 시험기간 */}
                      <TableCell className="text-sm text-gray-700">
                        {item.start_date} ~ {item.end_date}
                      </TableCell>

                      {/* 교재 */}
                      <TableCell className="text-sm text-gray-700">{item.textbook_label}</TableCell>

                      {/* 범위 (N개 단원) */}
                      <TableCell className="text-sm text-gray-700">
                        {item.scope_count}개 단원
                      </TableCell>

                      {/* D-day */}
                      <TableCell>
                        <span className={`text-sm ${getDdayColorClass(item)}`}>
                          {getDdayText(item)}
                        </span>
                      </TableCell>

                      {/* 작업 버튼 */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {/* 수정 버튼 */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 cursor-pointer"
                            title="수정"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>

                          {/* 삭제 버튼 */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 cursor-pointer text-red-500 hover:text-red-700"
                            title="삭제"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>

                          {/* 숙제중단 버튼 — D-day ≤ 7일 때만 표시 */}
                          {item.d_day !== null && item.d_day <= 7 && item.d_day >= 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 cursor-pointer text-orange-500 hover:text-orange-700"
                              title="숙제 중단"
                              onClick={() => setSuspendTarget(item)}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 등록/수정 다이얼로그 */}
      <ExamScheduleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editData={editData}
        onSaved={fetchSchedules}
      />

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>시험기간 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            <strong>{deleteTarget?.school_name} {deleteTarget?.grade} {deleteTarget?.exam_type_label}</strong>
            을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="cursor-pointer"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="cursor-pointer"
            >
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 숙제중단 확인 다이얼로그 */}
      <Dialog open={!!suspendTarget} onOpenChange={(open) => !open && setSuspendTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>숙제 중단</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            <strong>{suspendTarget?.school_name} {suspendTarget?.grade}</strong> 학생들의
            미완료 숙제를 모두 삭제하시겠습니까?
          </p>
          <p className="text-xs text-orange-600 mt-1">
            시험기간이 가까워 진행 중인 숙제를 중단합니다.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendTarget(null)}
              disabled={suspending}
              className="cursor-pointer"
            >
              취소
            </Button>
            <Button
              onClick={handleSuspendConfirm}
              disabled={suspending}
              className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
            >
              {suspending ? '처리 중...' : '숙제 중단'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
