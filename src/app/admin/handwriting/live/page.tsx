'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase/client';
import { Wifi, WifiOff, User, Clock, BookOpen, X } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// 진행중 세션 타입
interface ProgressSession {
  id: string;
  studentId: number;
  studentName: string;
  passageId: string;
  passageCode: string;
  startedAt: string;
  updatedAt: string;
}

export default function HandwritingLivePage() {
  const { academyId } = useAuthStore();
  const { toast } = useToast();
  const [progressSessions, setProgressSessions] = useState<ProgressSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProgressSession | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 진행중 세션 로드
  const loadProgressSessions = useCallback(async () => {
    if (!supabase || !academyId) return;

    try {
      // handwriting_progress 조회 (student 조인)
      const { data: progressData, error } = await supabase
        .from('handwriting_progress')
        .select(`
          id,
          student_id,
          passage_id,
          passage_code,
          started_at,
          updated_at,
          student:student_id (id, name, academy_id)
        `)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Progress 조회 실패:', error);
        return;
      }

      if (!progressData || progressData.length === 0) {
        setProgressSessions([]);
        return;
      }

      // 해당 학원 학생만 필터링
      const sessionList: ProgressSession[] = [];

      for (const p of progressData) {
        // student는 단일 객체 또는 배열로 올 수 있음
        const studentData = Array.isArray(p.student) ? p.student[0] : p.student;

        if (studentData?.academy_id === academyId) {
          sessionList.push({
            id: p.id,
            studentId: p.student_id,
            studentName: studentData?.name || `학생 ${p.student_id}`,
            passageId: p.passage_id,
            passageCode: p.passage_code || '-',
            startedAt: p.started_at,
            updatedAt: p.updated_at
          });
        }
      }

      setProgressSessions(sessionList);
    } catch (error) {
      console.error('세션 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [academyId]);

  // 실시간 구독
  useEffect(() => {
    if (!supabase || !academyId) return;

    loadProgressSessions();

    // handwriting_progress 변경 감지
    const channel = supabase
      .channel('handwriting-progress-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'handwriting_progress'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // 새 학생 추가 - 학원 소속 확인 후 추가
            const newRecord = payload.new as {
              id: string;
              student_id: number;
              passage_id: string;
              passage_code: string;
              started_at: string;
              updated_at: string;
            };

            // 학생 정보 조회
            if (!supabase) return;
            const { data: student } = await supabase
              .from('student')
              .select('id, name, academy_id')
              .eq('id', newRecord.student_id)
              .single();

            if (student?.academy_id === academyId) {
              setProgressSessions(prev => [{
                id: newRecord.id,
                studentId: newRecord.student_id,
                studentName: student.name,
                passageId: newRecord.passage_id,
                passageCode: newRecord.passage_code || '-',
                startedAt: newRecord.started_at,
                updatedAt: newRecord.updated_at
              }, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // 업데이트 (updated_at 갱신)
            const updatedRecord = payload.new as {
              id: string;
              student_id: number;
              updated_at: string;
            };

            setProgressSessions(prev => prev.map(s =>
              s.id === updatedRecord.id
                ? { ...s, updatedAt: updatedRecord.updated_at }
                : s
            ));
          } else if (payload.eventType === 'DELETE') {
            // 학습 완료 - 목록에서 제거
            const deletedRecord = payload.old as { id: string; student_id: number };

            // setProgressSessions 콜백 내에서 삭제된 학생 찾기 (stale closure 방지)
            setProgressSessions(prev => {
              const deletedSession = prev.find(s => s.id === deletedRecord.id);
              if (deletedSession) {
                toast({
                  type: 'success',
                  description: `${deletedSession.studentName}님이 학습을 완료했습니다`
                });
              }
              return prev.filter(s => s.id !== deletedRecord.id);
            });
          }
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academyId, loadProgressSessions, toast]); // progressSessions 제거 - stale closure 및 무한 루프 방지

  // 시간 포맷
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  // 경과 시간
  const getElapsedTime = (startedAt: string): string => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000 / 60); // 분
    if (elapsed < 1) return '방금 시작';
    if (elapsed < 60) return `${elapsed}분 경과`;
    return `${Math.floor(elapsed / 60)}시간 ${elapsed % 60}분 경과`;
  };

  // 마지막 활동 시간
  const getLastActivity = (updatedAt: string): string => {
    const updated = new Date(updatedAt).getTime();
    const now = Date.now();
    const diff = Math.floor((now - updated) / 1000); // 초
    if (diff < 10) return '방금 활동';
    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    return formatTime(updatedAt);
  };

  // 세션 강제 삭제
  const handleForceDelete = async (): Promise<void> => {
    if (!supabase || !deleteTarget) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('handwriting_progress')
        .delete()
        .eq('student_id', deleteTarget.studentId);

      if (error) {
        toast({ type: 'error', description: '삭제에 실패했습니다' });
        console.error('삭제 실패:', error);
      } else {
        toast({ type: 'success', description: `${deleteTarget.studentName}님의 세션이 종료되었습니다` });
        setProgressSessions(prev => prev.filter(s => s.id !== deleteTarget.id));
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      toast({ type: 'error', description: '삭제 중 오류가 발생했습니다' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">내손내줄 실시간</h1>
            <p className="text-gray-600 text-sm">학생들의 손글씨 학습을 실시간으로 모니터링합니다</p>
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <Wifi className="w-3 h-3 mr-1" />
                연결됨
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-500 border-gray-200">
                <WifiOff className="w-3 h-3 mr-1" />
                연결 중...
              </Badge>
            )}
          </div>
        </div>

        {/* 로딩 */}
        {loading && (
          <Card className="p-8 text-center text-gray-500">
            데이터를 불러오는 중...
          </Card>
        )}

        {/* 진행중인 세션 */}
        {!loading && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                학습 중 ({progressSessions.length}명)
              </h2>
              {progressSessions.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">
                  현재 학습 중인 학생이 없습니다
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {progressSessions.map((session) => (
                    <div key={session.id} className="relative">
                      <Link href={`/admin/handwriting/live/${session.studentId}`}>
                        <Card className="p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer border-green-200 bg-green-50/30">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-semibold text-gray-900">{session.studentName}</span>
                            </div>
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs animate-pulse">
                              학습중
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>지문: {session.passageCode}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatTime(session.startedAt)} 시작 · {getElapsedTime(session.startedAt)}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                              마지막 활동: {getLastActivity(session.updatedAt)}
                            </div>
                          </div>
                        </Card>
                      </Link>
                      {/* 강제 종료 버튼 */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(session);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors cursor-pointer z-10"
                        title="세션 강제 종료"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* 강제 종료 확인 다이얼로그 */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>세션 강제 종료</DialogTitle>
              <DialogDescription>
                {deleteTarget?.studentName}님의 학습 세션을 강제로 종료하시겠습니까?
                <br />
                <span className="text-red-500 text-sm">
                  학생이 작성 중인 내용이 저장되지 않을 수 있습니다.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleForceDelete}
                disabled={deleting}
              >
                {deleting ? '종료 중...' : '강제 종료'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
