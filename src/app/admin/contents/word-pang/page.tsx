'use client';

import { useState, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// 단어 정보 타입
interface KoreanVoca {
  id: number;
  word: string;
  meaning: string;
  grade: string;
  part_of_speech: string;
  original_word: string | null;
}

// 퀴즈 타입
interface WordPangQuiz {
  id: number;
  voca_id: number;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_answer: number;
  explanation: string | null;
  qa_score: number | null;
  created_at: string;
  updated_at: string;
  korean_voca: KoreanVoca;
}

// 페이지네이션 타입
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function WordPangManagementPage(): React.ReactElement {
  const { toast } = useToast();

  // 상태
  const [quizzes, setQuizzes] = useState<WordPangQuiz[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);

  // 검색 상태
  const [searchType, setSearchType] = useState<'voca_id' | 'word'>('voca_id');
  const [searchValue, setSearchValue] = useState('');

  // 모달 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<WordPangQuiz | null>(null);

  // 수정 폼 상태
  const [editForm, setEditForm] = useState({
    option_1: '',
    option_2: '',
    option_3: '',
    option_4: '',
    correct_answer: 1,
    explanation: '',
    qa_score: 0
  });

  // 검색 실행
  const handleSearch = useCallback(async (page = 1): Promise<void> => {
    if (!searchValue.trim()) {
      toast({ type: 'warning', description: '검색어를 입력해주세요.' });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (searchType === 'voca_id') {
        params.set('voca_id', searchValue);
      } else {
        params.set('word', searchValue);
      }

      const response = await fetch(`/api/admin/contents/word-pang?${params}`);
      const result = await response.json();

      if (result.success) {
        setQuizzes(result.data || []);
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
  }, [searchType, searchValue, pagination.limit, toast]);

  // 페이지 변경
  const handlePageChange = (newPage: number): void => {
    handleSearch(newPage);
  };

  // 수정 다이얼로그 열기
  const openEditDialog = (quiz: WordPangQuiz): void => {
    setSelectedQuiz(quiz);
    setEditForm({
      option_1: quiz.option_1,
      option_2: quiz.option_2,
      option_3: quiz.option_3,
      option_4: quiz.option_4,
      correct_answer: quiz.correct_answer,
      explanation: quiz.explanation || '',
      qa_score: quiz.qa_score || 0
    });
    setEditDialogOpen(true);
  };

  // 수정 저장
  const handleSaveEdit = async (): Promise<void> => {
    if (!selectedQuiz) return;

    try {
      const response = await fetch(`/api/admin/contents/word-pang/${selectedQuiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const result = await response.json();

      if (result.success) {
        toast({ type: 'success', description: '퀴즈가 수정되었습니다.' });
        setEditDialogOpen(false);
        // 목록 갱신
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
  const openDeleteDialog = (quiz: WordPangQuiz): void => {
    setSelectedQuiz(quiz);
    setDeleteDialogOpen(true);
  };

  // 삭제 실행
  const handleDelete = async (): Promise<void> => {
    if (!selectedQuiz) return;

    try {
      const response = await fetch(`/api/admin/contents/word-pang/${selectedQuiz.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        toast({ type: 'success', description: '퀴즈가 삭제되었습니다.' });
        setDeleteDialogOpen(false);
        // 목록 갱신
        handleSearch(pagination.page);
      } else {
        toast({ type: 'error', description: result.error || '삭제 실패' });
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      toast({ type: 'error', description: '삭제 중 오류가 발생했습니다.' });
    }
  };

  // 정답 번호를 선택지 텍스트로 변환
  const getCorrectAnswerText = (quiz: WordPangQuiz): string => {
    const options = [quiz.option_1, quiz.option_2, quiz.option_3, quiz.option_4];
    return options[quiz.correct_answer - 1] || '';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">단어팡 관리</h1>
        </div>

        {/* 검색 영역 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">퀴즈 검색</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="w-40">
                <Label htmlFor="searchType">검색 유형</Label>
                <Select value={searchType} onValueChange={(v) => setSearchType(v as 'voca_id' | 'word')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voca_id">Voca ID</SelectItem>
                    <SelectItem value="word">단어</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="searchValue">검색어</Label>
                <Input
                  id="searchValue"
                  placeholder={searchType === 'voca_id' ? 'Voca ID를 입력하세요' : '단어를 입력하세요'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
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
        {quizzes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">검색 결과 ({pagination.total}건)</h2>
            </div>

            {/* 퀴즈 카드 목록 */}
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <Card key={quiz.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      {/* 단어 정보 */}
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                            ID: {quiz.voca_id}
                          </span>
                          <span className="text-xl font-bold text-gray-900">{quiz.korean_voca.word}</span>
                          {quiz.korean_voca.original_word && (
                            <span className="text-sm text-gray-500">({quiz.korean_voca.original_word})</span>
                          )}
                          {quiz.qa_score && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              QA: {quiz.qa_score}점
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{quiz.korean_voca.meaning}</p>
                      </div>

                      {/* 작업 버튼 */}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(quiz)}
                          className="cursor-pointer"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(quiz)}
                          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </div>

                    {/* 선택지 목록 */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {[quiz.option_1, quiz.option_2, quiz.option_3, quiz.option_4].map((option, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded border ${
                            quiz.correct_answer === idx + 1
                              ? 'bg-green-50 border-green-300 text-green-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                        >
                          <span className={`font-semibold mr-2 ${
                            quiz.correct_answer === idx + 1 ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {idx + 1}.
                          </span>
                          {option}
                          {quiz.correct_answer === idx + 1 && (
                            <span className="ml-2 text-green-600 font-semibold">(정답)</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 해설 */}
                    {quiz.explanation && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        <span className="font-semibold">해설:</span> {quiz.explanation}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>퀴즈 수정</DialogTitle>
              <DialogDescription>
                {selectedQuiz && (
                  <span className="font-semibold text-blue-600">
                    [{selectedQuiz.voca_id}] {selectedQuiz.korean_voca.word} - {selectedQuiz.korean_voca.meaning}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="option_1">선택지 1</Label>
                  <Input
                    id="option_1"
                    value={editForm.option_1}
                    onChange={(e) => setEditForm({ ...editForm, option_1: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="option_2">선택지 2</Label>
                  <Input
                    id="option_2"
                    value={editForm.option_2}
                    onChange={(e) => setEditForm({ ...editForm, option_2: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="option_3">선택지 3</Label>
                  <Input
                    id="option_3"
                    value={editForm.option_3}
                    onChange={(e) => setEditForm({ ...editForm, option_3: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="option_4">선택지 4</Label>
                  <Input
                    id="option_4"
                    value={editForm.option_4}
                    onChange={(e) => setEditForm({ ...editForm, option_4: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="correct_answer">정답 (1-4)</Label>
                  <Select
                    value={editForm.correct_answer.toString()}
                    onValueChange={(v) => setEditForm({ ...editForm, correct_answer: parseInt(v) })}
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
                <div>
                  <Label htmlFor="qa_score">QA 점수 (1-10)</Label>
                  <Input
                    id="qa_score"
                    type="number"
                    min={1}
                    max={10}
                    value={editForm.qa_score || ''}
                    onChange={(e) => setEditForm({ ...editForm, qa_score: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="explanation">해설</Label>
                <Textarea
                  id="explanation"
                  value={editForm.explanation}
                  onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                  rows={3}
                />
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
              <DialogTitle>퀴즈 삭제</DialogTitle>
              <DialogDescription>
                {selectedQuiz && (
                  <>
                    <span className="font-semibold text-red-600">
                      [{selectedQuiz.voca_id}] {selectedQuiz.korean_voca.word}
                    </span>
                    {' '}퀴즈를 삭제하시겠습니까?
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
