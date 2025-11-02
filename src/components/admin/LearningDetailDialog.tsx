'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles } from 'lucide-react';

interface Passage {
  code: string;
  title: string;
  originalContent: string | null;
  aiContent: string | null;
}

interface LearningDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number | null;
  studentName: string;
  studyDate: string;
}

export function LearningDetailDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  studyDate
}: LearningDetailDialogProps) {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(false);
  // 각 지문별 선택된 버튼 상태 (지문 인덱스 -> 'original' | 'ai' | null)
  const [selectedButtons, setSelectedButtons] = useState<Record<number, 'original' | 'ai' | null>>({});

  useEffect(() => {
    if (!open || !studentId || !studyDate) return;

    // 모달이 열릴 때 선택 상태 초기화
    setSelectedButtons({});

    const loadDetail = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/learning/detail?studentId=${studentId}&studyDate=${studyDate}`
        );
        const result = await response.json();
        if (result.data) {
          setPassages(result.data);
        }
      } catch (error) {
        console.error('Error loading detail:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [open, studentId, studyDate]);

  const handlePrintContent = async (passageIndex: number, type: 'original' | 'ai') => {
    const passage = passages[passageIndex];
    const content = type === 'original' ? passage.originalContent : passage.aiContent;
    
    if (!content) return;

    // 선택된 버튼 상태 업데이트
    setSelectedButtons(prev => ({
      ...prev,
      [passageIndex]: type
    }));

    // 새 창에서 내용 표시 후 프린트
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${studentName} - ${studyDate} 학습 자료</title>
        </head>
        <body>
          <div>
            <span><strong>${studentName}</strong> ${studyDate} 지문${passageIndex + 1} ${type === 'original' ? '원문데이터' : 'AI콘텐츠'}</span>
          </div>
          ${content}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {studentName} - {studyDate} 학습 상세
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">데이터를 불러오는 중...</div>
        ) : passages.length === 0 ? (
          <div className="py-8 text-center text-gray-500">학습 데이터가 없습니다.</div>
        ) : (
          <div className="space-y-6">
            {passages.map((passage, index) => (
              <div key={passage.code} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-lg">
                  지문 {index + 1}: {passage.title} ({passage.code})
                </h3>
                
                <div className="flex gap-2">
                  <Button
                    variant={!passage.originalContent ? "secondary" : "outline"}
                    onClick={() => handlePrintContent(index, 'original')}
                    disabled={!passage.originalContent}
                    className={
                      !passage.originalContent 
                        ? "text-gray-500 cursor-not-allowed" 
                        : selectedButtons[index] === 'original'
                        ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                        : "cursor-pointer"
                    }
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    원문 데이터 출력
                  </Button>
                  
                  <Button
                    variant={!passage.aiContent ? "secondary" : "outline"}
                    onClick={() => handlePrintContent(index, 'ai')}
                    disabled={!passage.aiContent}
                    className={
                      !passage.aiContent 
                        ? "text-gray-500 cursor-not-allowed" 
                        : selectedButtons[index] === 'ai'
                        ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                        : "cursor-pointer"
                    }
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI 콘텐츠 출력
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

