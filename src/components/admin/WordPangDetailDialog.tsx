'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/components/ui/toast';
import { Loader2, Edit, Trash2, X } from 'lucide-react';

interface HanjaDetail {
  id: number;
  hanja_sequence: number;
  hanja_char: string;
  hanja_pronunciation: string;
  contextual_meaning: string;
}

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
  korean_voca: {
    word: string;
    meaning: string;
    grade: string;
    part_of_speech: string;
    original_word: string | null;
  };
  korean_voca_hanja?: HanjaDetail[];
}

interface WordPangDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vocaId: number;
  word: string;
  onUpdate?: () => void;
}

export function WordPangDetailDialog({
  open,
  onOpenChange,
  vocaId,
  word,
  onUpdate
}: WordPangDetailDialogProps): React.ReactElement {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<WordPangQuiz | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // 수정 폼 상태
  const [editForm, setEditForm] = useState({
    option_1: '',
    option_2: '',
    option_3: '',
    option_4: '',
    correct_answer: 1,
    explanation: '',
    qa_score: 0,
    original_word: '',
    hanjaDetails: [] as HanjaDetail[]
  });

  // 퀴즈 데이터 로드
  useEffect(() => {
    if (open && vocaId) {
      loadQuizData();
    }
  }, [open, vocaId]);

  const loadQuizData = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/contents/word-pang?voca_id=${vocaId}`);
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const quizData = result.data[0];
        setQuiz(quizData);
        setEditForm({
          option_1: quizData.option_1,
          option_2: quizData.option_2,
          option_3: quizData.option_3,
          option_4: quizData.option_4,
          correct_answer: quizData.correct_answer,
          explanation: quizData.explanation || '',
          qa_score: quizData.qa_score || 0,
          original_word: quizData.korean_voca?.original_word || '',
          hanjaDetails: quizData.korean_voca_hanja || []
        });
      } else {
        toast({ type: 'error', description: '퀴즈 데이터를 찾을 수 없습니다.' });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('퀴즈 조회 오류:', error);
      toast({ type: 'error', description: '퀴즈 조회 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 수정 저장
  const handleSave = async (): Promise<void> => {
    if (!quiz) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/contents/word-pang/${quiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, voca_id: quiz.voca_id, hanjaDetails: editForm.hanjaDetails })
      });

      const result = await response.json();

      if (result.success) {
        toast({ type: 'success', description: '퀴즈가 수정되었습니다.' });
        setIsEditMode(false);
        await loadQuizData();
        onUpdate?.();
      } else {
        toast({ type: 'error', description: result.error || '수정 실패' });
      }
    } catch (error) {
      console.error('수정 오류:', error);
      toast({ type: 'error', description: '수정 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 삭제 실행
  const handleDelete = async (): Promise<void> => {
    if (!quiz) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/contents/word-pang/${quiz.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        toast({ type: 'success', description: '퀴즈가 삭제되었습니다.' });
        setDeleteConfirmOpen(false);
        onOpenChange(false);
        onUpdate?.();
      } else {
        toast({ type: 'error', description: result.error || '삭제 실패' });
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      toast({ type: 'error', description: '삭제 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  if (!quiz && !loading) return <></>;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>단어팡 상세</DialogTitle>
            <DialogDescription>
              {quiz && (
                <span className="font-semibold text-blue-600">
                  [{quiz.voca_id}] {quiz.korean_voca.word} - {quiz.korean_voca.meaning}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : quiz && (
            <div className="space-y-4 py-4">
              {!isEditMode ? (
                // 조회 모드
                <>
                  {/* 한자 카드들 */}
                  {quiz.korean_voca_hanja && quiz.korean_voca_hanja.length > 0 && (
                    <div>
                      <Label className="mb-2 block">한자 정보</Label>
                      <div className="flex flex-wrap gap-2">
                        {quiz.korean_voca_hanja.map((hanja) => (
                          <div key={hanja.id} className="border rounded p-3 text-center bg-gray-50 min-w-[100px]">
                            <div className="text-2xl font-bold mb-1">{hanja.hanja_char}</div>
                            <div className="text-sm text-gray-600">{hanja.hanja_pronunciation}</div>
                            <div className="text-xs text-gray-500 mt-1">{hanja.contextual_meaning}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 선택지 표시 */}
                  <div className="grid grid-cols-2 gap-2">
                    {[quiz.option_1, quiz.option_2, quiz.option_3, quiz.option_4].map((option, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded border ${
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
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <span className="font-semibold text-yellow-800">해설: </span>
                      <span className="text-yellow-800">{quiz.explanation}</span>
                    </div>
                  )}

                  {/* QA 점수 */}
                  {quiz.qa_score !== null && (
                    <div className="text-sm text-gray-600">
                      QA 점수: <span className="font-semibold">{quiz.qa_score}점</span>
                    </div>
                  )}

                  {/* 하단 버튼 */}
                  <DialogFooter className="justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditMode(true)}
                      className="cursor-pointer"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      삭제
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                // 수정 모드
                <>
                  {/* 한자 정보 수정 */}
                  {editForm.hanjaDetails.length > 0 && (
                    <div className="space-y-2">
                      <Label>한자 정보</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {editForm.hanjaDetails.map((hanja, idx) => (
                          <div key={hanja.id} className="border rounded p-3 space-y-2 bg-gray-50">
                            <div className="text-xl font-bold text-center mb-2">{hanja.hanja_char}</div>
                            <Input
                              placeholder="발음"
                              value={hanja.hanja_pronunciation}
                              onChange={(e) => {
                                const updated = [...editForm.hanjaDetails];
                                updated[idx] = { ...updated[idx], hanja_pronunciation: e.target.value };
                                setEditForm({ ...editForm, hanjaDetails: updated });
                              }}
                            />
                            <Input
                              placeholder="의미"
                              value={hanja.contextual_meaning}
                              onChange={(e) => {
                                const updated = [...editForm.hanjaDetails];
                                updated[idx] = { ...updated[idx], contextual_meaning: e.target.value };
                                setEditForm({ ...editForm, hanjaDetails: updated });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_option_1">선택지 1</Label>
                      <Input
                        id="edit_option_1"
                        value={editForm.option_1}
                        onChange={(e) => setEditForm({ ...editForm, option_1: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_option_2">선택지 2</Label>
                      <Input
                        id="edit_option_2"
                        value={editForm.option_2}
                        onChange={(e) => setEditForm({ ...editForm, option_2: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_option_3">선택지 3</Label>
                      <Input
                        id="edit_option_3"
                        value={editForm.option_3}
                        onChange={(e) => setEditForm({ ...editForm, option_3: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_option_4">선택지 4</Label>
                      <Input
                        id="edit_option_4"
                        value={editForm.option_4}
                        onChange={(e) => setEditForm({ ...editForm, option_4: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_correct_answer">정답 (1-4)</Label>
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
                      <Label htmlFor="edit_qa_score">QA 점수 (1-10)</Label>
                      <Input
                        id="edit_qa_score"
                        type="number"
                        min={1}
                        max={10}
                        value={editForm.qa_score || ''}
                        onChange={(e) => setEditForm({ ...editForm, qa_score: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit_explanation">해설</Label>
                    <Textarea
                      id="edit_explanation"
                      value={editForm.explanation}
                      onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <DialogFooter className="justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditMode(false)}
                      className="cursor-pointer"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="cursor-pointer"
                    >
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      저장
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>퀴즈 삭제</DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-red-600">{word}</span> 퀴즈를 삭제하시겠습니까?
              <br />
              <span className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="cursor-pointer"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
