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

// 퀴즈 타입
interface Quiz {
  id?: string;
  quiz_order: number;
  quiz_type: 'cloze' | 'comprehension' | 'inference' | 'relation';
  question: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_answer: number;
  explanation: string | null;
  sentence_a?: string | null;
  sentence_b?: string | null;
}

// 문장클리닉 v2 타입
interface SentenceClinic {
  id: string;
  keyword: string;
  grade_level: string | null;
  text: string;
  char_count: number;
  qa_status: string | null;
  created_at: string;
  updated_at: string;
  quizzes: Quiz[];
}

// 페이지네이션 타입
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 퀴즈 타입 라벨
const QUIZ_TYPE_LABELS: Record<string, string> = {
  cloze: '빈칸',
  comprehension: '이해',
  inference: '추론',
  relation: '관계'
};

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
  const [expandedTexts, setExpandedTexts] = useState<Set<string>>(new Set());

  // 모달 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<SentenceClinic | null>(null);

  // 수정 폼 상태
  const [editForm, setEditForm] = useState({
    keyword: '',
    grade_level: '',
    text: '',
    quizzes: [] as Quiz[]
  });

  // 텍스트 펼치기/접기 토글
  const toggleTextExpand = (id: string): void => {
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
      keyword: clinic.keyword || '',
      grade_level: clinic.grade_level || '',
      text: clinic.text || '',
      quizzes: clinic.quizzes?.map(q => ({
        id: q.id,
        quiz_order: q.quiz_order,
        quiz_type: q.quiz_type,
        question: q.question,
        option_1: q.option_1,
        option_2: q.option_2,
        option_3: q.option_3,
        option_4: q.option_4,
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        sentence_a: q.sentence_a || '',
        sentence_b: q.sentence_b || ''
      })) || []
    });
    setEditDialogOpen(true);
  };

  // 퀴즈 필드 업데이트
  const updateQuizField = (index: number, field: keyof Quiz, value: any): void => {
    setEditForm(prev => ({
      ...prev,
      quizzes: prev.quizzes.map((q, i) => i === index ? { ...q, [field]: value } : q)
    }));
  };

  // 수정 저장
  const handleSaveEdit = async (): Promise<void> => {
    if (!selectedClinic) return;

    // 필수 필드 검증
    if (!editForm.keyword.trim() || !editForm.text.trim()) {
      toast({ type: 'warning', description: '키워드와 지문은 필수입니다.' });
      return;
    }

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
          <h1 className="text-2xl font-bold">문장클리닉 관리 (v2)</h1>
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
                            {clinic.id.substring(0, 8)}
                          </span>
                          {clinic.grade_level && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {clinic.grade_level}
                            </span>
                          )}
                          {clinic.qa_status && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              {clinic.qa_status}
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
                          <span className="text-xs font-semibold text-gray-500">지문 ({clinic.char_count}자)</span>
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

                    {/* 퀴즈 4개 미리보기 */}
                    {clinic.quizzes && clinic.quizzes.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {clinic.quizzes
                          .sort((a, b) => a.quiz_order - b.quiz_order)
                          .map((quiz, idx) => {
                            // Tailwind CSS 정적 클래스명 매핑
                            const bgColor = quiz.quiz_type === 'cloze' ? 'bg-blue-50' :
                                          quiz.quiz_type === 'comprehension' ? 'bg-purple-50' :
                                          quiz.quiz_type === 'inference' ? 'bg-green-50' :
                                          quiz.quiz_type === 'relation' ? 'bg-orange-50' : 'bg-gray-50';
                            const borderColor = quiz.quiz_type === 'cloze' ? 'border-blue-200' :
                                              quiz.quiz_type === 'comprehension' ? 'border-purple-200' :
                                              quiz.quiz_type === 'inference' ? 'border-green-200' :
                                              quiz.quiz_type === 'relation' ? 'border-orange-200' : 'border-gray-200';
                            const textColor = quiz.quiz_type === 'cloze' ? 'text-blue-700' :
                                            quiz.quiz_type === 'comprehension' ? 'text-purple-700' :
                                            quiz.quiz_type === 'inference' ? 'text-green-700' :
                                            quiz.quiz_type === 'relation' ? 'text-orange-700' : 'text-gray-700';
                            return (
                              <div
                                key={idx}
                                className={`p-3 ${bgColor} rounded border ${borderColor}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-xs font-semibold ${textColor}`}>
                                    {quiz.quiz_order}. {QUIZ_TYPE_LABELS[quiz.quiz_type] || quiz.quiz_type}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-800 mb-2 line-clamp-2">{quiz.question}</p>
                                <div className="grid grid-cols-2 gap-1">
                                  {[quiz.option_1, quiz.option_2, quiz.option_3, quiz.option_4].map((option, optIdx) => (
                                    <div
                                      key={optIdx}
                                      className={`p-1 rounded text-xs ${
                                        quiz.correct_answer === optIdx + 1
                                          ? 'bg-green-100 border border-green-300 text-green-800 font-semibold'
                                          : 'bg-white border border-gray-200 text-gray-600'
                                      }`}
                                    >
                                      {optIdx + 1}. {option.substring(0, 20)}{option.length > 20 ? '...' : ''}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
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
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>문장클리닉 수정 (v2)</DialogTitle>
              <DialogDescription>
                {selectedClinic && (
                  <span className="font-semibold text-blue-600">
                    {selectedClinic.keyword}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="keyword">키워드 *</Label>
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
              </div>

              <div>
                <Label htmlFor="text">지문 *</Label>
                <Textarea
                  id="text"
                  value={editForm.text}
                  onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                  rows={5}
                />
              </div>

              {/* 퀴즈 4개 편집 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">퀴즈 ({editForm.quizzes.length}개)</h3>
                {editForm.quizzes
                  .sort((a, b) => a.quiz_order - b.quiz_order)
                  .map((quiz, idx) => {
                    // Tailwind CSS 정적 클래스명 매핑
                    const bgColor = quiz.quiz_type === 'cloze' ? 'bg-blue-50' :
                                  quiz.quiz_type === 'comprehension' ? 'bg-purple-50' :
                                  quiz.quiz_type === 'inference' ? 'bg-green-50' :
                                  quiz.quiz_type === 'relation' ? 'bg-orange-50' : 'bg-gray-50';
                    const borderColor = quiz.quiz_type === 'cloze' ? 'border-blue-200' :
                                      quiz.quiz_type === 'comprehension' ? 'border-purple-200' :
                                      quiz.quiz_type === 'inference' ? 'border-green-200' :
                                      quiz.quiz_type === 'relation' ? 'border-orange-200' : 'border-gray-200';
                    const textColor = quiz.quiz_type === 'cloze' ? 'text-blue-700' :
                                    quiz.quiz_type === 'comprehension' ? 'text-purple-700' :
                                    quiz.quiz_type === 'inference' ? 'text-green-700' :
                                    quiz.quiz_type === 'relation' ? 'text-orange-700' : 'text-gray-700';
                    return (
                      <div key={idx} className={`p-4 ${bgColor} rounded-lg border ${borderColor}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className={`font-semibold ${textColor}`}>
                            {quiz.quiz_order}. {QUIZ_TYPE_LABELS[quiz.quiz_type] || quiz.quiz_type}
                          </h4>
                          <div className="flex gap-2">
                            <Select
                              value={quiz.quiz_type}
                              onValueChange={(v) => updateQuizField(idx, 'quiz_type', v)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cloze">빈칸</SelectItem>
                                <SelectItem value="comprehension">이해</SelectItem>
                                <SelectItem value="inference">추론</SelectItem>
                                <SelectItem value="relation">관계</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`question_${idx}`}>문제</Label>
                            <Textarea
                              id={`question_${idx}`}
                              value={quiz.question}
                              onChange={(e) => updateQuizField(idx, 'question', e.target.value)}
                              rows={2}
                            />
                          </div>

                          {/* relation 타입인 경우 sentence_a, sentence_b */}
                          {quiz.quiz_type === 'relation' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`sentence_a_${idx}`}>문장 A</Label>
                                <Input
                                  id={`sentence_a_${idx}`}
                                  value={quiz.sentence_a || ''}
                                  onChange={(e) => updateQuizField(idx, 'sentence_a', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`sentence_b_${idx}`}>문장 B</Label>
                                <Input
                                  id={`sentence_b_${idx}`}
                                  value={quiz.sentence_b || ''}
                                  onChange={(e) => updateQuizField(idx, 'sentence_b', e.target.value)}
                                />
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`option_1_${idx}`}>선택지 1</Label>
                              <Input
                                id={`option_1_${idx}`}
                                value={quiz.option_1}
                                onChange={(e) => updateQuizField(idx, 'option_1', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`option_2_${idx}`}>선택지 2</Label>
                              <Input
                                id={`option_2_${idx}`}
                                value={quiz.option_2}
                                onChange={(e) => updateQuizField(idx, 'option_2', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`option_3_${idx}`}>선택지 3</Label>
                              <Input
                                id={`option_3_${idx}`}
                                value={quiz.option_3}
                                onChange={(e) => updateQuizField(idx, 'option_3', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`option_4_${idx}`}>선택지 4</Label>
                              <Input
                                id={`option_4_${idx}`}
                                value={quiz.option_4}
                                onChange={(e) => updateQuizField(idx, 'option_4', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`correct_answer_${idx}`}>정답 (1-4)</Label>
                              <Select
                                value={quiz.correct_answer.toString()}
                                onValueChange={(v) => updateQuizField(idx, 'correct_answer', parseInt(v))}
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
                            <Label htmlFor={`explanation_${idx}`}>해설</Label>
                            <Textarea
                              id={`explanation_${idx}`}
                              value={quiz.explanation || ''}
                              onChange={(e) => updateQuizField(idx, 'explanation', e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                      {selectedClinic.keyword}
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
