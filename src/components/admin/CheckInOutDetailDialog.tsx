'use client';

import { useState, useEffect, type JSX } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Image, ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';

// 학습 데이터 타입
interface StudyData {
  wordPang?: { count: number; accuracy: number };
  sentenceClinic?: { count: number; accuracy: number };
  treasureHunt?: { count: number; accuracy: number };
  handwriting?: { count: number; accuracy: number };
}

interface KakaoMessage {
  id: string;
  check_in_out: string;
  has_today_study: boolean;
  today_study_data: StudyData | null;
  success: boolean;
  sent_at: string;
}

interface GalleryLink {
  token: string;
  isActive: boolean;
  validUntil: string | null;
  url: string;
}

interface CheckInOutDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number | null;
  studentName: string;
  checkInDate: string;
}

export function CheckInOutDetailDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  checkInDate
}: CheckInOutDetailDialogProps): JSX.Element {
  const [messages, setMessages] = useState<KakaoMessage[]>([]);
  const [galleryLink, setGalleryLink] = useState<GalleryLink | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !studentId) return;

    const loadDetail = async (): Promise<void> => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/checkinout/detail?studentId=${studentId}&date=${checkInDate}`
        );
        const result = await response.json();
        if (result.success && result.data) {
          setMessages(result.data.messages || []);
          setGalleryLink(result.data.galleryLink);
        }
      } catch (error) {
        console.error('Error loading detail:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [open, studentId, checkInDate]);

  // 시간 포맷 함수
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 갤러리 열기
  const handleOpenGallery = (): void => {
    if (galleryLink?.url) {
      window.open(galleryLink.url, '_blank');
    }
  };

  // 등/하원 배지
  const getCheckInOutBadge = (status: string): JSX.Element => {
    if (status === 'CheckIn') {
      return <Badge className="bg-green-500 text-white">등원</Badge>;
    }
    return <Badge className="bg-blue-500 text-white">하원</Badge>;
  };

  // 학습 데이터 렌더링
  const renderStudyData = (data: StudyData | null): JSX.Element | null => {
    if (!data) return null;

    const items = [];
    if (data.wordPang) {
      items.push({ label: '단어팡', count: data.wordPang.count, accuracy: data.wordPang.accuracy });
    }
    if (data.sentenceClinic) {
      items.push({ label: '문장클리닉', count: data.sentenceClinic.count, accuracy: data.sentenceClinic.accuracy });
    }
    if (data.treasureHunt) {
      items.push({ label: '보물찾기', count: data.treasureHunt.count, accuracy: data.treasureHunt.accuracy });
    }
    if (data.handwriting) {
      items.push({ label: '내손내줄', count: data.handwriting.count, accuracy: data.handwriting.accuracy });
    }

    if (items.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-medium">
              {item.count}개 (정답률 {item.accuracy}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {studentName} - {checkInDate} 상세 정보
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">데이터를 불러오는 중...</div>
        ) : (
          <div className="space-y-6">
            {/* 갤러리 섹션 */}
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Image className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800">갤러리</h3>
              </div>

              {galleryLink ? (
                <div className="space-y-2">
                  <Button
                    onClick={handleOpenGallery}
                    className="w-full bg-purple-600 hover:bg-purple-700 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    갤러리 바로가기
                  </Button>
                  {galleryLink.validUntil && (
                    <p className="text-sm text-purple-600 text-center">
                      유효기간: {new Date(galleryLink.validUntil).toLocaleDateString('ko-KR')}까지
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  활성화된 갤러리 링크가 없습니다.
                </p>
              )}
            </Card>

            {/* 카카오톡 발송 내역 섹션 */}
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">카카오톡 발송 내역</h3>
              </div>

              {messages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">
                  해당 날짜에 발송된 메시지가 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="bg-white rounded-lg p-3 border border-yellow-100"
                    >
                      {/* 헤더: 시간 + 상태 + 발송결과 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{formatTime(message.sent_at)}</span>
                          {getCheckInOutBadge(message.check_in_out)}
                        </div>
                        <div className="flex items-center gap-1">
                          {message.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-xs ${message.success ? 'text-green-600' : 'text-red-600'}`}>
                            {message.success ? '발송완료' : '발송실패'}
                          </span>
                        </div>
                      </div>

                      {/* 학습 데이터 */}
                      {message.has_today_study && message.today_study_data ? (
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-xs text-gray-500 mb-1">오늘의 학습</p>
                          {renderStudyData(message.today_study_data)}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">학습 데이터 없음</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
