'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { School, Plus, Edit, Trash2, BookOpen, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// 학교 데이터 타입
interface SchoolData {
  id: number;
  full_name: string;
  short_name: string;
  created_at: string;
  mapping_summary: Record<string, number>; // 학년별 매핑 건수
}

// 교재 데이터 타입
interface Textbook {
  id: string; // UUID
  publisher?: string | null;
  level?: string | null;
  grade?: number | null;
  semester?: number | null;
  curriculum_year?: number | null;
  label: string;
}

// 학년별 교재 매핑 타입
interface GradeMapping {
  school_id: number;
  grade: string;
  textbook_id: string; // UUID
  textbooks?: Textbook;
}

// 학년 목록
const GRADES = ['중1', '중2', '중3', '고1', '고2', '고3'];

// 학교 폼 초기값
const EMPTY_FORM = { full_name: '', short_name: '' };

export default function SchoolsPage() {
  const { toast } = useToast();

  // 학교 목록
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 학교 추가/수정 다이얼로그
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolData | null>(null);
  const [schoolForm, setSchoolForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // 삭제 확인 다이얼로그
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSchool, setDeletingSchool] = useState<SchoolData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 교재 매핑 다이얼로그
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [mappingSchool, setMappingSchool] = useState<SchoolData | null>(null);
  const [mappings, setMappings] = useState<GradeMapping[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  // 학년별 드롭다운 선택값 (추가할 교재 임시 상태)
  const [gradeAddSelections, setGradeAddSelections] = useState<Record<string, string>>({});
  const [isMappingLoading, setIsMappingLoading] = useState(false);
  // 학년별 개별 로딩 상태 (추가/삭제 중)
  const [pendingOps, setPendingOps] = useState<Set<string>>(new Set());

  // 학교 목록 조회
  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/schools');
      const json = await res.json();
      if (json.success) {
        setSchools(json.data);
      } else {
        toast({ type: 'error', description: json.error });
      }
    } catch {
      toast({ type: 'error', description: '학교 목록을 가져오는 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // 학교 추가 다이얼로그 열기
  const openAddDialog = () => {
    setEditingSchool(null);
    setSchoolForm(EMPTY_FORM);
    setSchoolDialogOpen(true);
  };

  // 학교 수정 다이얼로그 열기
  const openEditDialog = (school: SchoolData) => {
    setEditingSchool(school);
    setSchoolForm({ full_name: school.full_name, short_name: school.short_name });
    setSchoolDialogOpen(true);
  };

  // 학교 저장 (추가 or 수정)
  const handleSaveSchool = async () => {
    if (!schoolForm.full_name.trim() || !schoolForm.short_name.trim()) {
      toast({ type: 'error', description: '학교 이름과 약칭을 모두 입력해주세요.' });
      return;
    }

    setIsSaving(true);
    try {
      const url = editingSchool
        ? `/api/admin/schools/${editingSchool.id}`
        : '/api/admin/schools';
      const method = editingSchool ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolForm),
      });
      const json = await res.json();

      if (json.success) {
        toast({ type: 'success', description: editingSchool ? '학교 정보가 수정되었습니다.' : '학교가 추가되었습니다.' });
        setSchoolDialogOpen(false);
        fetchSchools();
      } else {
        toast({ type: 'error', description: json.error });
      }
    } catch {
      toast({ type: 'error', description: '저장 중 오류가 발생했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  // 삭제 다이얼로그 열기
  const openDeleteDialog = (school: SchoolData) => {
    setDeletingSchool(school);
    setDeleteDialogOpen(true);
  };

  // 학교 삭제
  const handleDeleteSchool = async () => {
    if (!deletingSchool) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/schools/${deletingSchool.id}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.success) {
        toast({ type: 'success', description: '학교가 삭제되었습니다.' });
        setDeleteDialogOpen(false);
        fetchSchools();
      } else {
        toast({ type: 'error', description: json.error });
        setDeleteDialogOpen(false);
      }
    } catch {
      toast({ type: 'error', description: '삭제 중 오류가 발생했습니다.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // 교재 매핑 다이얼로그 열기
  const openMappingDialog = async (school: SchoolData) => {
    setMappingSchool(school);
    setMappingDialogOpen(true);
    setIsMappingLoading(true);
    setGradeAddSelections({});
    setPendingOps(new Set());

    try {
      const res = await fetch(`/api/admin/schools/${school.id}/textbook-mapping`);
      const json = await res.json();

      if (json.success) {
        const { mappings: fetchedMappings, textbooks: fetchedTextbooks } = json.data;
        setMappings(fetchedMappings);
        setTextbooks(fetchedTextbooks);
      } else {
        toast({ type: 'error', description: json.error });
        setMappingDialogOpen(false);
      }
    } catch {
      toast({ type: 'error', description: '교재 매핑 정보를 가져오는 중 오류가 발생했습니다.' });
      setMappingDialogOpen(false);
    } finally {
      setIsMappingLoading(false);
    }
  };

  // 특정 학년에 교재 추가 (즉시 API 호출)
  const handleAddTextbook = async (grade: string, textbookIdStr: string) => {
    if (!mappingSchool || !textbookIdStr) return;

    const textbookId = textbookIdStr; // UUID string, Number 변환 금지
    const opKey = `add-${grade}-${textbookId}`;
    setPendingOps((prev) => new Set(prev).add(opKey));

    try {
      const res = await fetch(`/api/admin/schools/${mappingSchool.id}/textbook-mapping`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, textbook_id: textbookId }),
      });
      const json = await res.json();

      if (json.success) {
        // 로컬 상태에 추가 (전체 재조회 없이)
        const addedTextbook = textbooks.find((tb) => tb.id === textbookId);
        const newMapping: GradeMapping = {
          school_id: mappingSchool.id,
          grade,
          textbook_id: textbookId,
          textbooks: addedTextbook,
        };
        setMappings((prev) => [...prev, newMapping]);
        // 학교 목록 mapping_summary 갱신
        setSchools((prev) =>
          prev.map((s) =>
            s.id === mappingSchool.id
              ? { ...s, mapping_summary: { ...s.mapping_summary, [grade]: (s.mapping_summary[grade] || 0) + 1 } }
              : s
          )
        );
        // 드롭다운 초기화
        setGradeAddSelections((prev) => ({ ...prev, [grade]: '' }));
      } else if (res.status === 409) {
        toast({ type: 'error', description: '이미 추가된 교재입니다.' });
        setGradeAddSelections((prev) => ({ ...prev, [grade]: '' }));
      } else {
        toast({ type: 'error', description: json.error });
      }
    } catch {
      toast({ type: 'error', description: '교재 추가 중 오류가 발생했습니다.' });
    } finally {
      setPendingOps((prev) => {
        const next = new Set(prev);
        next.delete(opKey);
        return next;
      });
    }
  };

  // 특정 학년-교재 매핑 삭제 (즉시 API 호출)
  const handleRemoveTextbook = async (grade: string, textbookId: string) => {
    if (!mappingSchool) return;

    const opKey = `del-${grade}-${textbookId}`;
    setPendingOps((prev) => new Set(prev).add(opKey));

    try {
      const res = await fetch(
        `/api/admin/schools/${mappingSchool.id}/textbook-mapping?grade=${encodeURIComponent(grade)}&textbook_id=${textbookId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();

      if (json.success) {
        // 로컬 상태에서 제거
        setMappings((prev) =>
          prev.filter((m) => !(m.grade === grade && m.textbook_id === textbookId))
        );
        // 학교 목록 mapping_summary 갱신
        setSchools((prev) =>
          prev.map((s) =>
            s.id === mappingSchool!.id
              ? { ...s, mapping_summary: { ...s.mapping_summary, [grade]: Math.max((s.mapping_summary[grade] || 0) - 1, 0) } }
              : s
          )
        );
      } else {
        toast({ type: 'error', description: json.error });
      }
    } catch {
      toast({ type: 'error', description: '교재 삭제 중 오류가 발생했습니다.' });
    } finally {
      setPendingOps((prev) => {
        const next = new Set(prev);
        next.delete(opKey);
        return next;
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <School className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">학교 관리</h1>
              <p className="text-sm text-gray-500">학교 정보 및 학년별 교재 매핑 관리</p>
            </div>
          </div>
          <Button onClick={openAddDialog} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            학교 추가
          </Button>
        </div>

        {/* 학교 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>학교 목록</CardTitle>
            <CardDescription>
              총 {schools.length}개 학교 (가나다순)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                불러오는 중...
              </div>
            ) : schools.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                등록된 학교가 없습니다. 학교를 추가해주세요.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학교명</TableHead>
                    <TableHead>약칭</TableHead>
                    <TableHead>교재 매핑</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.full_name}</TableCell>
                      <TableCell className="text-gray-600">{school.short_name}</TableCell>
                      <TableCell>
                        {(() => {
                          const name = school.full_name;
                          const grades = name.includes('중학교')
                            ? ['중1', '중2', '중3']
                            : name.includes('고등학교')
                              ? ['고1', '고2', '고3']
                              : [];
                          if (grades.length === 0) return <span className="text-xs text-gray-400">-</span>;
                          const summary = school.mapping_summary || {};
                          return (
                            <div className="flex flex-wrap gap-1">
                              {grades.map((g) => {
                                const count = summary[g] || 0;
                                return (
                                  <span
                                    key={g}
                                    className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded ${
                                      count > 0
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'bg-red-50 text-red-500'
                                    }`}
                                  >
                                    {g}:{count}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMappingDialog(school)}
                            className="cursor-pointer"
                          >
                            <BookOpen className="h-4 w-4 mr-1" />
                            교재 매핑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(school)}
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(school)}
                            className="cursor-pointer text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 학교 추가/수정 다이얼로그 */}
      <Dialog open={schoolDialogOpen} onOpenChange={setSchoolDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSchool ? '학교 수정' : '학교 추가'}</DialogTitle>
            <DialogDescription>
              {editingSchool ? '학교 정보를 수정합니다.' : '새 학교를 추가합니다.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">학교 전체 이름</Label>
              <Input
                id="full_name"
                placeholder="예) 부산중학교"
                value={schoolForm.full_name}
                onChange={(e) => setSchoolForm((prev) => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="short_name">약칭</Label>
              <Input
                id="short_name"
                placeholder="예) 부산중"
                value={schoolForm.short_name}
                onChange={(e) => setSchoolForm((prev) => ({ ...prev, short_name: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSchoolDialogOpen(false)} className="cursor-pointer">
              취소
            </Button>
            <Button onClick={handleSaveSchool} disabled={isSaving} className="cursor-pointer">
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>학교 삭제</DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-gray-900">{deletingSchool?.full_name}</span>을(를) 삭제하시겠습니까?
              <br />
              이 학교에 배정된 학생이 있으면 삭제할 수 없습니다.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="cursor-pointer">
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSchool}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 교재 매핑 다이얼로그 */}
      <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>교재 매핑</DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-gray-900">{mappingSchool?.full_name}</span>의 학년별 교재를 설정합니다.
              교재를 선택하면 즉시 저장됩니다.
            </DialogDescription>
          </DialogHeader>

          {isMappingLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              불러오는 중...
            </div>
          ) : (
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
              {/* 학교 유형에 따라 표시할 학년 필터링 */}
              {(() => {
                const name = mappingSchool?.full_name ?? '';
                const filteredGrades = GRADES.filter((g) => {
                  if (name.includes('중학교')) return g.startsWith('중');
                  if (name.includes('고등학교')) return g.startsWith('고');
                  return true;
                });
                const lastGrade = filteredGrades[filteredGrades.length - 1];
                return filteredGrades.map((grade) => {
                // 해당 학년에 이미 매핑된 교재 목록
                const gradeMappings = mappings.filter((m) => m.grade === grade);
                // 이미 추가된 교재 ID 목록 (드롭다운 제외용)
                const addedTextbookIds = new Set(gradeMappings.map((m) => m.textbook_id));
                // 학년 → 레벨 매핑 (중1~중3 → 중등, 고1~고3 → 고등)
                const gradeLevel = grade.startsWith('중') ? '중등' : '고등';
                // 추가 가능한 교재만 필터링 (이미 추가 안 된 것 + 해당 레벨)
                const availableTextbooks = textbooks.filter(
                  (tb) => !addedTextbookIds.has(tb.id) && tb.level === gradeLevel
                );

                return (
                  <div key={grade} className="space-y-2">
                    {/* 학년 라벨 */}
                    <span className="text-sm font-semibold text-gray-700">{grade}</span>

                    {/* 기존 교재 칩 목록 */}
                    <div className="flex flex-wrap gap-2 min-h-[32px]">
                      {gradeMappings.length === 0 ? (
                        <span className="text-xs text-gray-400 self-center">매핑된 교재 없음</span>
                      ) : (
                        gradeMappings.map((m) => {
                          const opKey = `del-${grade}-${m.textbook_id}`;
                          const isDeleting = pendingOps.has(opKey);
                          // textbooks state(label 포함)에서 먼저 찾고, 없으면 JOIN된 raw 데이터 조합
                          const label =
                            textbooks.find((tb) => tb.id === m.textbook_id)?.label ||
                            m.textbooks?.label ||
                            `교재 #${m.textbook_id}`;
                          return (
                            <span
                              key={m.textbook_id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                            >
                              {label}
                              <button
                                type="button"
                                onClick={() => handleRemoveTextbook(grade, m.textbook_id)}
                                disabled={isDeleting}
                                className="cursor-pointer text-blue-400 hover:text-red-500 disabled:opacity-40 ml-0.5"
                                aria-label={`${label} 제거`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>

                    {/* 교재 추가 드롭다운 */}
                    {availableTextbooks.length > 0 && (
                      <Select
                        value={gradeAddSelections[grade] || ''}
                        onValueChange={(val) => {
                          setGradeAddSelections((prev) => ({ ...prev, [grade]: val }));
                          handleAddTextbook(grade, val);
                        }}
                        disabled={pendingOps.has(`add-${grade}-${gradeAddSelections[grade]}`)}
                      >
                        <SelectTrigger className="w-full cursor-pointer text-sm text-gray-500">
                          <SelectValue placeholder="+ 교재 추가" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTextbooks.map((tb) => (
                            <SelectItem key={tb.id} value={String(tb.id)}>
                              {tb.label || `교재 #${tb.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* 모든 교재가 추가된 경우 */}
                    {availableTextbooks.length === 0 && gradeMappings.length > 0 && (
                      <p className="text-xs text-gray-400">추가 가능한 교재 없음</p>
                    )}

                    {/* 학년 구분선 (마지막 제외) */}
                    {grade !== lastGrade && (
                      <hr className="mt-2 border-gray-100" />
                    )}
                  </div>
                );
              });
              })()}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMappingDialogOpen(false)}
              className="cursor-pointer"
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
