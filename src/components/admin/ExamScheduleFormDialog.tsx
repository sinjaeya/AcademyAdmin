'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UnitTreeCheckbox } from '@/components/admin/UnitTreeCheckbox';
import { useToast } from '@/components/ui/toast';
import type { ExamScheduleItem } from '@/app/api/admin/exam-schedule/route';

// 학교 정보 타입
interface School {
  id: number;
  full_name: string;
  short_name: string;
}

// 교재 항목 타입
interface TextbookOption {
  id: string;
  label: string;
}

// 학교 full_name에서 학년 옵션 생성
function getGradeOptions(schoolFullName: string): string[] {
  if (schoolFullName.includes('중학교')) {
    return ['중1', '중2', '중3'];
  }
  if (schoolFullName.includes('고등학교')) {
    return ['고1', '고2', '고3'];
  }
  // 기타 (초등학교 등)
  return ['초1', '초2', '초3', '초4', '초5', '초6'];
}

interface ExamScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: ExamScheduleItem | null; // null이면 등록 모드
  onSaved: () => void; // 저장 후 목록 새로고침
}

export function ExamScheduleFormDialog({
  open,
  onOpenChange,
  editData,
  onSaved,
}: ExamScheduleFormDialogProps) {
  const { toast } = useToast();

  // 폼 상태
  const [schoolId, setSchoolId] = useState<string>('');
  const [grade, setGrade] = useState('');
  const [examType, setExamType] = useState<'midterm' | 'final' | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [textbookId, setTextbookId] = useState('');
  const [scopeUnitIds, setScopeUnitIds] = useState<string[]>([]);

  // 옵션 데이터
  const [schools, setSchools] = useState<School[]>([]);
  const [textbooks, setTextbooks] = useState<TextbookOption[]>([]);

  // 로딩/제출 상태
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingTextbooks, setLoadingTextbooks] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = !!editData;
  const selectedSchool = schools.find((s) => s.id === Number(schoolId));
  const gradeOptions = selectedSchool ? getGradeOptions(selectedSchool.full_name) : [];

  // 학교 목록 조회 (다이얼로그 열릴 때)
  useEffect(() => {
    if (!open) return;

    const fetchSchools = async () => {
      setLoadingSchools(true);
      try {
        const res = await fetch('/api/admin/schools');
        const result = await res.json();
        if (result.success) {
          setSchools(result.data ?? []);
        }
      } catch {
        // 학교 목록 조회 실패 — 빈 상태 유지
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchools();
  }, [open]);

  // 수정 모드: editData prefill
  useEffect(() => {
    if (!open) return;

    if (editData) {
      setSchoolId(String(editData.school_id));
      setGrade(editData.grade);
      setExamType(editData.exam_type);
      setStartDate(editData.start_date);
      setEndDate(editData.end_date);
      setTextbookId(editData.textbook_id);
      setScopeUnitIds(editData.scope_unit_ids ?? []);
    } else {
      // 등록 모드 초기화
      setSchoolId('');
      setGrade('');
      setExamType('');
      setStartDate('');
      setEndDate('');
      setTextbookId('');
      setScopeUnitIds([]);
    }
  }, [open, editData]);

  // 학교+학년 변경 시 교재 목록 재조회
  useEffect(() => {
    if (!schoolId || !grade) {
      setTextbooks([]);
      // 수정 모드가 아니면 교재 초기화
      if (!editData) setTextbookId('');
      return;
    }

    const fetchTextbooks = async () => {
      setLoadingTextbooks(true);
      try {
        const res = await fetch(
          `/api/admin/exam-schedule/textbooks?school_id=${schoolId}&grade=${encodeURIComponent(grade)}`
        );
        const result = await res.json();
        if (result.success) {
          setTextbooks(result.data ?? []);
          // 수정 모드가 아니면 교재 초기화 (학교/학년 변경 시)
          if (!editData) setTextbookId('');
        }
      } catch {
        setTextbooks([]);
      } finally {
        setLoadingTextbooks(false);
      }
    };

    fetchTextbooks();
    // editData 의존성 제외: 수정 모드 여부 판단에만 사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, grade]);

  // 저장 처리
  const handleSubmit = async () => {
    // 필수 입력값 검증
    if (!schoolId || !grade || !examType || !startDate || !endDate || !textbookId) {
      toast({ title: '입력 오류', description: '모든 필수 항목을 입력해주세요.', type: 'error' });
      return;
    }
    if (startDate > endDate) {
      toast({ title: '입력 오류', description: '시작일은 종료일보다 이전이어야 합니다.', type: 'error' });
      return;
    }
    if (scopeUnitIds.length === 0) {
      toast({ title: '입력 오류', description: '시험 범위 단원을 1개 이상 선택해주세요.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        school_id: Number(schoolId),
        grade,
        exam_type: examType,
        start_date: startDate,
        end_date: endDate,
        scope_unit_ids: scopeUnitIds,
        textbook_id: textbookId,
      };

      const url = isEditMode
        ? `/api/admin/exam-schedule/${editData!.id}`
        : '/api/admin/exam-schedule';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        toast({
          title: isEditMode ? '수정 완료' : '등록 완료',
          description: isEditMode ? '시험기간이 수정되었습니다.' : '시험기간이 등록되었습니다.',
          type: 'success',
        });
        onSaved();
        onOpenChange(false);
      } else {
        toast({ title: '저장 실패', description: result.error, type: 'error' });
      }
    } catch {
      toast({ title: '오류', description: '저장 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? '시험기간 수정' : '시험기간 등록'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* 학교 선택 */}
          <div className="space-y-1.5">
            <Label>학교 *</Label>
            <Select
              value={schoolId}
              onValueChange={(val) => {
                setSchoolId(val);
                setGrade(''); // 학교 변경 시 학년 초기화
              }}
              disabled={loadingSchools}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder={loadingSchools ? '불러오는 중...' : '학교 선택'} />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={String(school.id)} className="cursor-pointer">
                    {school.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 학년 선택 */}
          <div className="space-y-1.5">
            <Label>학년 *</Label>
            <Select
              value={grade}
              onValueChange={setGrade}
              disabled={!schoolId || gradeOptions.length === 0}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="학년 선택" />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map((g) => (
                  <SelectItem key={g} value={g} className="cursor-pointer">
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 교재 선택 */}
          <div className="space-y-1.5">
            <Label>교재 *</Label>
            <Select
              value={textbookId}
              onValueChange={(val) => {
                setTextbookId(val);
                setScopeUnitIds([]); // 교재 변경 시 범위 초기화
              }}
              disabled={!schoolId || !grade || loadingTextbooks}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue
                  placeholder={
                    loadingTextbooks
                      ? '불러오는 중...'
                      : !schoolId || !grade
                      ? '학교/학년 먼저 선택'
                      : textbooks.length === 0
                      ? '매핑된 교재 없음'
                      : '교재 선택'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {textbooks.map((tb) => (
                  <SelectItem key={tb.id} value={tb.id} className="cursor-pointer">
                    {tb.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 시험유형 선택 */}
          <div className="space-y-1.5">
            <Label>시험유형 *</Label>
            <Select
              value={examType}
              onValueChange={(val) => setExamType(val as 'midterm' | 'final')}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="시험유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="midterm" className="cursor-pointer">중간고사</SelectItem>
                <SelectItem value="final" className="cursor-pointer">기말고사</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 시험 기간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>시작일 *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <Label>종료일 *</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="cursor-pointer"
              />
            </div>
          </div>

          {/* 시험 범위 — 교재 선택 후 표시 */}
          <div className="space-y-1.5">
            <Label>시험 범위 *</Label>
            {textbookId ? (
              <UnitTreeCheckbox
                textbookId={textbookId}
                selectedIds={scopeUnitIds}
                onChange={setScopeUnitIds}
              />
            ) : (
              <div className="border rounded-lg p-3 bg-gray-50 text-center text-sm text-gray-400">
                교재를 선택하면 단원 목록이 표시됩니다.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="cursor-pointer"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="cursor-pointer"
          >
            {submitting ? '저장 중...' : isEditMode ? '수정' : '등록'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
