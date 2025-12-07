'use client';

import { useState, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

// 문장클리닉 타입
interface SentenceClinic {
  id: number;
  grade_level: string | null;
  structure_type: string | null;
  keyword: string;
  text: string;
  cloze_summary: string | null;
  cloze_option_1: string | null;
  cloze_option_2: string | null;
  cloze_option_3: string | null;
  cloze_option_4: string | null;
  cloze_answer: number | null;
  cloze_explanation: string | null;
  keyword_question: string | null;
  keyword_option_1: string | null;
  keyword_option_2: string | null;
  keyword_option_3: string | null;
  keyword_option_4: string | null;
  keyword_answer: number | null;
  keyword_explanation: string | null;
}

// 페이지네이션 타입
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SentenceClinicManagementPage(): React.ReactElement {
  const { toast } = useToast();

  // 상태
  const [clinics, setClinics] = useState<SentenceClinic[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);

  // 검색 상태
  const [searchKeyword, setSearchKeyword] = useState('');

  // 텍스트 펼치기/접기 상태
  const [expandedTexts, setExpandedTexts] = useState<Set<number>>(new Set());

  // 모달 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<SentenceClinic | null>(null);

  // 수정 폼 상태
  const [editForm, setEditForm] = useState({
    grade_level: '',
    structure_type: '',
    keyword: '',
    text: '',
    cloze_summary: '',
    cloze_option_1: '',
    cloze_option_2: '',
    cloze_option_3: '',
    cloze_option_4: '',
    cloze_answer: 1,
    cloze_explanation: '',
    keyword_question: '',
    keyword_option_1: '',
    keyword_option_2: '',
    keyword_option_3: '',
    keyword_option_4: '',
    keyword_answer: 1,
    keyword_explanation: ''
  });

  // 텍스트 펼치기/접기 토글
  const toggleTextExpand = (id: number): void => {
    setExpandedTexts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 검색 실행
  const handleSearch = useCallback(async (page = 1): Promise<void> => {
    if (!searchKeyword.trim()) {
      toast({ type: 'warning', description: '검색어를 입력해주세요.' });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        keyword: searchKeyword
      });

      const response = await fetch(`/api/admin/contents/sentence-clinic?${params}`);
      const result = await response.json();

      if (result.success) {
        setClinics(result.data || []);
        setPagination(result.pagination);

        if (result.data?.length === 0) {
          toast({ type: 'info', description: '검색 결과가 없습니다.' });
        }
      } else {
        toast({ type: 'error', description: result.error || '검색 실패' });
      }
    } catch (error) {
      console.error('검색 오류:', error);
      toast({ type: 'error', description: '검색 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, pagination.limit, toast]);

  // 페이지 변경
  const handlePageChange = (newPage: number): void => {
    handleSearch(newPage);
  };

  // 수정 다이얼로그 열기
  const openEditDialog = (clinic: SentenceClinic): void => {
    setSelectedClinic(clinic);
    setEditForm({
      grade_level: clinic.grade_level || '',
      structure_type: clinic.structure_type || '',
      keyword: clinic.keyword || '',
      text: clinic.text || '',
      cloze_summary: clinic.cloze_summary || '',
      cloze_option_1: clinic.cloze_option_1 || '',
      cloze_option_2: clinic.cloze_option_2 || '',
      cloze_option_3: clinic.cloze_option_3 || '',
      cloze_option_4: clinic.cloze_option_4 || '',
      cloze_answer: clinic.cloze_answer || 1,
      cloze_explanation: clinic.cloze_explanation || '',
      keyword_question: clinic.keyword_question || '',
      keyword_option_1: clinic.keyword_option_1 || '',
      keyword_option_2: clinic.keyword_option_2 || '',
      keyword_option_3: clinic.keyword_option_3 || '',
      keyword_option_4: clinic.keyword_option_4 || '',
      keyword_answer: clinic.keyword_answer || 1,
      keyword_explanation: clinic.keyword_explanation || ''
    });
    setEditDialogOpen(true);
  };

  // 수정 저장
  const handleSaveEdit = async (): Promise<void> => {
    if (!selectedClinic) return;

    try {
      const response = await fetch(`/api/admin/contents/sentence-clinic/${selectedClinic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const result = await response.json();

      if (result.success) {
        toast({ type: 'success', description: '문장클리닉이 수정되었습니다.' });
        setEditDialogOpen(false);
        handleSearch(pagination.page);
      } else {
        toast({ type: 'error', description: result.error || '수정 실패' });
      }
    } catch (error) {
      console.error('수정 오류:', error);
      toast({ type: 'error', description: '수정 중 오류가 발생했습니다.' });
    }
  };

  // 삭제 다이얼로그 열기
  const openDeleteDialog = (clinic: SentenceClinic): void => {
    setSelectedClinic(clinic);
    setDeleteDialogOpen(true);
  };

  // 삭제 실행
  const handleDelete = async (): Promise<void> => {
    if (!selectedClinic) return;

    try {
      const response = await fetch(`/api/admin/contents/sentence-clinic/${selectedClinic.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        toast({ type: 'success', description: '문장클리닉이 삭제되었습니다.' });
        setDeleteDialogOpen(false);
        handleSearch(pagination.page);
      } else {
        toast({ type: 'error', description: result.error || '삭제 실패' });
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      toast({ type: 'error', description: '삭제 중 오류가 발생했습니다.' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">문장클리닉 관리</h1>
        </div>

        {/* 검색 영역 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="searchKeyword">키워드 검색</Label>
                <Input
                  id="searchKeyword"
                  placeholder="키워드를 입력하세요"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={() => handleSearch()} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                검색
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 결과 목록 */}
        {clinics.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">검색 결과 ({pagination.total}건)</h2>
            </div>

            {/* 클리닉 카드 목록 */}
            <div className="space-y-4">
              {clinics.map((clinic) => (
                <Card key={clinic.id}>
                  <CardContent className="p-4">
                    {/* 헤더 */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                            ID: {clinic.id}
                          </span>
                          {clinic.grade_level && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {clinic.grade_level}
                            </span>
                          )}
                          {clinic.structure_type && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {clinic.structure_type}
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-gray-900">{clinic.keyword}</p>
                      </div>

                      {/* 작업 버튼 */}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(clinic)}
                          className="cursor-pointer"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(clinic)}
                          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </div>

                    {/* 지문 텍스트 */}
                    <div className="mb-4">
                      <div
                        className="p-3 bg-gray-50 rounded border cursor-pointer"
                        onClick={() => toggleTextExpand(clinic.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-500">지문</span>
                          {expandedTexts.has(clinic.id) ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <p className={`text-sm text-gray-700 ${expandedTexts.has(clinic.id) ? '' : 'line-clamp-2'}`}>
                          {clinic.text}
                        </p>
                      </div>
                    </div>

                    {/* 빈칸 문제 */}
                    {clinic.cloze_option_1 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs font-semibold text-blue-700 mb-2">빈칸 문제</p>
                        {clinic.cloze_summary && (
                          <p className="text-sm text-blue-800 mb-2">{clinic.cloze_summary}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {[clinic.cloze_option_1, clinic.cloze_option_2, clinic.cloze_option_3, clinic.cloze_option_4].map((option, idx) => (
                            option && (
                              <div
                                key={idx}
                                className={`p-2 rounded border text-sm ${
                                  clinic.cloze_answer === idx + 1
                                    ? 'bg-green-50 border-green-300 text-green-800'
                                    : 'bg-white border-gray-200 text-gray-700'
                                }`}
                              >
                                <span className={`font-semibold mr-2 ${
                                  clinic.cloze_answer === idx + 1 ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                  {idx + 1}.
                                </span>
                                {option}
                                {clinic.cloze_answer === idx + 1 && (
                                  <span className="ml-2 text-green-600 font-semibold">(정답)</span>
                                )}
                              </div>
                            )
                          ))}
                        </div>
                        {clinic.cloze_explanation && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <span className="font-semibold">해설:</span> {clinic.cloze_explanation}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 핵심어 문제 */}
                    {clinic.keyword_option_1 && (
                      <div className="p-3 bg-purple-50 rounded border border-purple-200">
                        <p className="text-xs font-semibold text-purple-700 mb-2">핵심어 문제</p>
                        {clinic.keyword_question && (
                          <p className="text-sm text-purple-800 mb-2">{clinic.keyword_question}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {[clinic.keyword_option_1, clinic.keyword_option_2, clinic.keyword_option_3, clinic.keyword_option_4].map((option, idx) => (
                            option && (
                              <div
                                key={idx}
                                className={`p-2 rounded border text-sm ${
                                  clinic.keyword_answer === idx + 1
                                    ? 'bg-green-50 border-green-300 text-green-800'
                                    : 'bg-white border-gray-200 text-gray-700'
                                }`}
                              >
                                <span className={`font-semibold mr-2 ${
                                  clinic.keyword_answer === idx + 1 ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                  {idx + 1}.
                                </span>
                                {option}
                                {clinic.keyword_answer === idx + 1 && (
                                  <span className="ml-2 text-green-600 font-semibold">(정답)</span>
                                )}
                              </div>
                            )
                          ))}
                        </div>
                        {clinic.keyword_explanation && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <span className="font-semibold">해설:</span> {clinic.keyword_explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  이전
                </Button>
                <span className="text-sm text-gray-600">
                  {pagination.page} / {pagination.totalPages} 페이지
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="cursor-pointer"
                >
                  다음
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 수정 다이얼로그 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>문장클리닉 수정</DialogTitle>
              <DialogDescription>
                {selectedClinic && (
                  <span className="font-semibold text-blue-600">
                    [{selectedClinic.id}] {selectedClinic.keyword}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="keyword">키워드</Label>
                  <Input
                    id="keyword"
                    value={editForm.keyword}
                    onChange={(e) => setEditForm({ ...editForm, keyword: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="grade_level">학년 레벨</Label>
                  <Input
                    id="grade_level"
                    value={editForm.grade_level}
                    onChange={(e) => setEditForm({ ...editForm, grade_level: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="structure_type">구조 유형</Label>
                  <Input
                    id="structure_type"
                    value={editForm.structure_type}
                    onChange={(e) => setEditForm({ ...editForm, structure_type: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="text">지문</Label>
                <Textarea
                  id="text"
                  value={editForm.text}
                  onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                  rows={4}
                />
              </div>

              {/* 빈칸 문제 */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-700 mb-3">빈칸 문제</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="cloze_summary">빈칸 문제 요약</Label>
                    <Textarea
                      id="cloze_summary"
                      value={editForm.cloze_summary}
                      onChange={(e) => setEditForm({ ...editForm, cloze_summary: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="cloze_option_1">선택지 1</Label>
                      <Input
                        id="cloze_option_1"
                        value={editForm.cloze_option_1}
                        onChange={(e) => setEditForm({ ...editForm, cloze_option_1: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cloze_option_2">선택지 2</Label>
                      <Input
                        id="cloze_option_2"
                        value={editForm.cloze_option_2}
                        onChange={(e) => setEditForm({ ...editForm, cloze_option_2: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cloze_option_3">선택지 3</Label>
                      <Input
                        id="cloze_option_3"
                        value={editForm.cloze_option_3}
                        onChange={(e) => setEditForm({ ...editForm, cloze_option_3: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cloze_option_4">선택지 4</Label>
                      <Input
                        id="cloze_option_4"
                        value={editForm.cloze_option_4}
                        onChange={(e) => setEditForm({ ...editForm, cloze_option_4: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="cloze_answer">정답 (1-4)</Label>
                      <Select
                        value={editForm.cloze_answer.toString()}
                        onValueChange={(v) => setEditForm({ ...editForm, cloze_answer: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1번</SelectItem>
                          <SelectItem value="2">2번</SelectItem>
                          <SelectItem value="3">3번</SelectItem>
                          <SelectItem value="4">4번</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cloze_explanation">해설</Label>
                    <Textarea
                      id="cloze_explanation"
                      value={editForm.cloze_explanation}
                      onChange={(e) => setEditForm({ ...editForm, cloze_explanation: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* 핵심어 문제 */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-700 mb-3">핵심어 문제</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="keyword_question">핵심어 질문</Label>
                    <Textarea
                      id="keyword_question"
                      value={editForm.keyword_question}
                      onChange={(e) => setEditForm({ ...editForm, keyword_question: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="keyword_option_1">선택지 1</Label>
                      <Input
                        id="keyword_option_1"
                        value={editForm.keyword_option_1}
                        onChange={(e) => setEditForm({ ...editForm, keyword_option_1: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="keyword_option_2">선택지 2</Label>
                      <Input
                        id="keyword_option_2"
                        value={editForm.keyword_option_2}
                        onChange={(e) => setEditForm({ ...editForm, keyword_option_2: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="keyword_option_3">선택지 3</Label>
                      <Input
                        id="keyword_option_3"
                        value={editForm.keyword_option_3}
                        onChange={(e) => setEditForm({ ...editForm, keyword_option_3: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="keyword_option_4">선택지 4</Label>
                      <Input
                        id="keyword_option_4"
                        value={editForm.keyword_option_4}
                        onChange={(e) => setEditForm({ ...editForm, keyword_option_4: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="keyword_answer">정답 (1-4)</Label>
                      <Select
                        value={editForm.keyword_answer.toString()}
                        onValueChange={(v) => setEditForm({ ...editForm, keyword_answer: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1번</SelectItem>
                          <SelectItem value="2">2번</SelectItem>
                          <SelectItem value="3">3번</SelectItem>
                          <SelectItem value="4">4번</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="keyword_explanation">해설</Label>
                    <Textarea
                      id="keyword_explanation"
                      value={editForm.keyword_explanation}
                      onChange={(e) => setEditForm({ ...editForm, keyword_explanation: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="cursor-pointer">
                취소
              </Button>
              <Button onClick={handleSaveEdit} className="cursor-pointer">
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 삭제 확인 다이얼로그 */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>문장클리닉 삭제</DialogTitle>
              <DialogDescription>
                {selectedClinic && (
                  <>
                    <span className="font-semibold text-red-600">
                      [{selectedClinic.id}] {selectedClinic.keyword}
                    </span>
                    {' '}항목을 삭제하시겠습니까?
                    <br />
                    <span className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="cursor-pointer">
                취소
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="cursor-pointer">
                삭제
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
