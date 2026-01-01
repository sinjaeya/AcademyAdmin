'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, Wifi, WifiOff, User, Clock, CheckCircle, Circle, ImageOff, Pen, Highlighter, Eraser, Undo2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import * as fabric from 'fabric';

// Progress 정보 타입
interface ProgressInfo {
  id: string;
  studentId: number;
  studentName: string;
  passageId: string;
  passageCode: string;
  startedAt: string;
  updatedAt: string;
}

// 퀴즈 타입
interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
  sortOrder: number;
}

// 캔버스 데이터 타입 (스크린샷 방식)
interface CanvasData {
  // 스크린샷 이미지 (Base64 JPEG)
  screenshot?: string;
  // 선생님 드로잉 객체 (크기 정보 포함 - 클라이언트 스케일 조정용)
  teacherDrawings?: {
    width: number;    // 서버 캔버스 너비
    height: number;   // 서버 캔버스 높이
    objects: Record<string, unknown>[];  // Fabric.js 객체 배열
  };
  // 기존 Fabric.js 객체 (클라이언트 편집용, 서버에서는 무시)
  objects?: Array<Record<string, unknown>>;
  width?: number;
  height?: number;
}

// 학생 답변 타입
type AnswersMap = Record<string, number>;

// 드로잉 도구 타입
type DrawingTool = 'pen' | 'highlighter' | 'eraser';

// 펜 색상 옵션
const PEN_COLORS = [
  { name: '빨강', value: '#ef4444' },
  { name: '파랑', value: '#3b82f6' },
  { name: '검정', value: '#000000' },
  { name: '초록', value: '#22c55e' },
  { name: '주황', value: '#f97316' },
];

// 형광펜 색상 옵션
const HIGHLIGHTER_COLORS = [
  { name: '노랑', value: 'rgba(250, 204, 21, 0.4)' },
  { name: '초록', value: 'rgba(74, 222, 128, 0.4)' },
  { name: '핑크', value: 'rgba(249, 168, 212, 0.4)' },
  { name: '하늘', value: 'rgba(125, 211, 252, 0.4)' },
];

// 두께 옵션
const STROKE_WIDTHS = [
  { name: '얇게', value: 2 },
  { name: '보통', value: 4 },
  { name: '굵게', value: 8 },
  { name: '매우 굵게', value: 12 },
];

export default function HandwritingStudentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const studentId = Number(params.studentId);

  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);
  const [passageCodeId, setPassageCodeId] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  // 드로잉 관련 상태
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pen');
  const [penColor, setPenColor] = useState('#ef4444');
  const [highlighterColor, setHighlighterColor] = useState('rgba(250, 204, 21, 0.4)');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [canvasReady, setCanvasReady] = useState(false);

  // 모니터링 상태 관리 (is_watched + heartbeat)
  useEffect(() => {
    if (!supabase || !studentId) return;

    const client = supabase; // null 체크 후 사용

    // 모니터링 시작 - is_watched = true, heartbeat 설정
    const startWatching = async (): Promise<void> => {
      await client
        .from('handwriting_progress')
        .update({
          is_watched: true,
          watcher_heartbeat: new Date().toISOString()
        })
        .eq('student_id', studentId);
      console.log('[Watch] 모니터링 시작');
    };

    // 모니터링 종료 - is_watched = false
    const stopWatching = async (): Promise<void> => {
      await client
        .from('handwriting_progress')
        .update({ is_watched: false })
        .eq('student_id', studentId);
      console.log('[Watch] 모니터링 종료');
    };

    // 모니터링 시작
    startWatching();

    // 30초마다 heartbeat 전송
    const heartbeatInterval = setInterval(async () => {
      await client
        .from('handwriting_progress')
        .update({ watcher_heartbeat: new Date().toISOString() })
        .eq('student_id', studentId);
      console.log('[Watch] Heartbeat 전송');
    }, 30000);

    // 브라우저 닫기/새로고침 시 처리
    const handleBeforeUnload = (): void => {
      // 동기적으로 처리해야 하므로 sendBeacon 사용
      // Supabase REST API 직접 호출
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/handwriting_progress?student_id=eq.${studentId}`;
      const body = JSON.stringify({ is_watched: false });
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    };

    // 탭 전환 시 처리
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') {
        // 탭이 숨겨지면 is_watched = false
        client
          .from('handwriting_progress')
          .update({ is_watched: false })
          .eq('student_id', studentId);
      } else {
        // 탭이 다시 보이면 is_watched = true
        client
          .from('handwriting_progress')
          .update({
            is_watched: true,
            watcher_heartbeat: new Date().toISOString()
          })
          .eq('student_id', studentId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // cleanup - React Router 이탈 시
    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopWatching();
    };
  }, [studentId]);

  // 데이터 로드
  const loadProgressData = useCallback(async () => {
    if (!supabase || !studentId) return;

    try {
      // progress 정보 조회
      const { data: progress, error } = await supabase
        .from('handwriting_progress')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (error || !progress) {
        toast({ type: 'warning', description: '학습 중인 세션이 없습니다' });
        router.push('/admin/handwriting/live');
        return;
      }

      // 학생 이름 조회
      const { data: student } = await supabase
        .from('student')
        .select('name')
        .eq('id', studentId)
        .single();

      setProgressInfo({
        id: progress.id,
        studentId: progress.student_id,
        studentName: student?.name || `학생 ${studentId}`,
        passageId: progress.passage_id,
        passageCode: progress.passage_code || '-',
        startedAt: progress.started_at,
        updatedAt: progress.updated_at
      });

      // 캔버스 데이터에서 스크린샷 추출
      const canvasData = progress.canvas_data as CanvasData | null;
      console.log('[loadProgressData] canvas_data:', canvasData ? 'exists' : 'null');
      console.log('[loadProgressData] screenshot:', canvasData?.screenshot ? `${canvasData.screenshot.substring(0, 50)}...` : 'null');
      if (canvasData?.screenshot) {
        setScreenshot(canvasData.screenshot);
      }

      // 답변 데이터
      if (progress.answers) {
        setAnswers(progress.answers as AnswersMap);
      }

      // 지문 정보 조회 (코드ID만 필요)
      if (progress.passage_id) {
        const { data: passageData } = await supabase
          .from('handwriting_passage')
          .select('code_id')
          .eq('id', progress.passage_id)
          .single();

        if (passageData) {
          setPassageCodeId(passageData.code_id);

          // 퀴즈 조회
          const { data: quizData } = await supabase
            .from('handwriting_quiz')
            .select('id, question, option_1, option_2, option_3, option_4, option_5, correct_answer, points, sort_order')
            .eq('passage_id', progress.passage_id)
            .order('sort_order');

          if (quizData) {
            setQuizzes(quizData.map(q => ({
              id: q.id,
              question: q.question,
              options: [q.option_1, q.option_2, q.option_3, q.option_4, q.option_5].filter(Boolean),
              correctAnswer: q.correct_answer,
              points: q.points,
              sortOrder: q.sort_order
            })));
          }
        }
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId, router, toast]);

  // 초기 로드
  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  // 실시간 업데이트 시 데이터 다시 조회
  const refetchProgressData = useCallback(async () => {
    if (!supabase || !studentId) return;

    try {
      const { data: progress, error } = await supabase
        .from('handwriting_progress')
        .select('canvas_data, answers, updated_at')
        .eq('student_id', studentId)
        .single();

      if (error || !progress) {
        console.log('[Refetch] 데이터 없음 또는 에러:', error);
        return;
      }

      // 스크린샷 업데이트
      const canvasData = progress.canvas_data as CanvasData | null;
      if (canvasData?.screenshot) {
        setScreenshot(canvasData.screenshot);
      }

      // 답변 업데이트
      if (progress.answers) {
        setAnswers(progress.answers as AnswersMap);
      }

      // 업데이트 시간 갱신
      if (progress.updated_at) {
        setProgressInfo(prev => prev ? { ...prev, updatedAt: progress.updated_at } : null);
      }
    } catch (error) {
      console.error('[Refetch] 실패:', error);
    }
  }, [studentId]);

  // 실시간 구독
  useEffect(() => {
    if (!supabase || !studentId) return;

    const channel = supabase
      .channel(`handwriting-progress-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'handwriting_progress',
          filter: `student_id=eq.${studentId}`
        },
        () => {
          console.log('[Realtime] UPDATE 감지, 데이터 재조회...');
          refetchProgressData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'handwriting_progress',
          filter: `student_id=eq.${studentId}`
        },
        () => {
          toast({ type: 'success', description: '학생이 학습을 완료했습니다' });
          router.push('/admin/handwriting/live');
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
  }, [studentId, router, toast, refetchProgressData]);

  // Fabric.js 캔버스 초기화
  useEffect(() => {
    if (!canvasRef.current || !screenshot || fabricCanvasRef.current) return;

    // 이미지 로드 후 캔버스 크기 설정
    const img = new Image();
    img.onload = () => {
      if (!canvasRef.current || !containerRef.current) return;

      // 컨테이너 크기에 맞게 조정
      const containerWidth = containerRef.current.clientWidth;
      const scale = containerWidth / img.width;
      const scaledHeight = img.height * scale;

      // 캔버스 크기 설정
      canvasRef.current.width = containerWidth;
      canvasRef.current.height = scaledHeight;

      // Fabric.js 캔버스 생성
      const canvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: containerWidth,
        height: scaledHeight,
        backgroundColor: 'transparent',
      });

      // Fabric.js wrapper에 absolute positioning 적용
      const wrapper = canvas.wrapperEl;
      if (wrapper) {
        wrapper.style.position = 'absolute';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
      }

      // 브러시 설정
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = penColor;
      canvas.freeDrawingBrush.width = strokeWidth;

      fabricCanvasRef.current = canvas;
      setCanvasReady(true);

      // 드로잉 완료 시 저장
      canvas.on('path:created', () => {
        saveTeacherDrawings();
      });
    };
    img.src = screenshot;

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
        setCanvasReady(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenshot]);

  // 스크린샷이 변경되면 캔버스 크기 업데이트
  useEffect(() => {
    if (!fabricCanvasRef.current || !screenshot || !containerRef.current) return;

    const img = new Image();
    img.onload = () => {
      if (!containerRef.current || !fabricCanvasRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const scale = containerWidth / img.width;
      const scaledHeight = img.height * scale;

      fabricCanvasRef.current.setDimensions({
        width: containerWidth,
        height: scaledHeight
      });
    };
    img.src = screenshot;
  }, [screenshot]);

  // 드로잉 도구 변경 시 브러시 설정 업데이트
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    if (currentTool === 'eraser') {
      canvas.isDrawingMode = true;
      // 지우개 모드 - 하얀색으로 그리기 (투명 배경에서는 보이지 않음)
      // 실제로는 object:added 이벤트로 해당 위치 객체 삭제
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = '#ffffff';
      canvas.freeDrawingBrush.width = strokeWidth * 3;
    } else if (currentTool === 'highlighter') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = highlighterColor;
      canvas.freeDrawingBrush.width = strokeWidth * 3;
    } else {
      // 펜 모드
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = penColor;
      canvas.freeDrawingBrush.width = strokeWidth;
    }
  }, [currentTool, penColor, highlighterColor, strokeWidth]);

  // 선생님 드로잉 저장
  const saveTeacherDrawings = useCallback(async () => {
    if (!supabase || !studentId || !fabricCanvasRef.current) return;

    try {
      const canvas = fabricCanvasRef.current;
      const objects = canvas.getObjects();

      // Fabric.js 객체를 JSON으로 변환
      const drawingData = objects.map(obj => obj.toObject(['stroke', 'strokeWidth', 'fill', 'opacity']));

      // 현재 캔버스 크기 (클라이언트에서 스케일 조정에 사용)
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();

      // 현재 canvas_data 조회
      const { data: progress } = await supabase
        .from('handwriting_progress')
        .select('canvas_data')
        .eq('student_id', studentId)
        .single();

      const currentCanvasData = (progress?.canvas_data as CanvasData) || {};

      // teacherDrawings 필드 업데이트 (크기 정보 포함)
      await supabase
        .from('handwriting_progress')
        .update({
          canvas_data: {
            ...currentCanvasData,
            teacherDrawings: {
              width: canvasWidth,
              height: canvasHeight,
              objects: drawingData
            }
          },
          updated_at: new Date().toISOString()
        })
        .eq('student_id', studentId);

      console.log('[TeacherDrawing] 저장 완료:', drawingData.length, '개 객체, 캔버스 크기:', canvasWidth, 'x', canvasHeight);
    } catch (error) {
      console.error('[TeacherDrawing] 저장 실패:', error);
    }
  }, [studentId]);

  // 실행 취소
  const handleUndo = () => {
    if (!fabricCanvasRef.current) return;
    const objects = fabricCanvasRef.current.getObjects();
    if (objects.length > 0) {
      fabricCanvasRef.current.remove(objects[objects.length - 1]);
      saveTeacherDrawings();
    }
  };

  // 전체 지우기
  const handleClearAll = () => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.clear();
    saveTeacherDrawings();
  };

  // 시간 포맷
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  // 경과 시간
  const getElapsedTime = (startedAt: string): string => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000 / 60);
    if (elapsed < 1) return '방금 시작';
    if (elapsed < 60) return `${elapsed}분 경과`;
    return `${Math.floor(elapsed / 60)}시간 ${elapsed % 60}분 경과`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <Card className="p-8 text-center text-gray-500">
          데이터를 불러오는 중...
        </Card>
      </AdminLayout>
    );
  }

  if (!progressInfo) {
    return (
      <AdminLayout>
        <Card className="p-8 text-center text-gray-500">
          학습 중인 세션을 찾을 수 없습니다
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/handwriting/live">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                목록
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                <h1 className="text-xl font-bold text-gray-900">{progressInfo.studentName}</h1>
                <Badge className="bg-green-100 text-green-700 border-green-200 animate-pulse">
                  학습중
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(progressInfo.startedAt)} 시작 · {getElapsedTime(progressInfo.startedAt)}
                </span>
                {passageCodeId && (
                  <span>지문: {passageCodeId}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <Wifi className="w-3 h-3 mr-1" />
                실시간 연결
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-500 border-gray-200">
                <WifiOff className="w-3 h-3 mr-1" />
                연결 중...
              </Badge>
            )}
          </div>
        </div>

        {/* 메인 컨텐츠 - 상/하 분할 */}
        <div className="flex flex-col gap-4">
          {/* 상단: 학생 화면 스크린샷 + 드로잉 */}
          <Card className="p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">학생 화면</h2>

              {/* 드로잉 도구 바 */}
              {screenshot && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* 도구 선택 */}
                  <div className="flex items-center gap-1 border-r pr-2">
                    <Button
                      variant={currentTool === 'pen' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentTool('pen')}
                      className="h-8 px-2"
                    >
                      <Pen className="w-4 h-4 mr-1" />
                      펜
                    </Button>
                    <Button
                      variant={currentTool === 'highlighter' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentTool('highlighter')}
                      className="h-8 px-2"
                    >
                      <Highlighter className="w-4 h-4 mr-1" />
                      형광펜
                    </Button>
                    <Button
                      variant={currentTool === 'eraser' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentTool('eraser')}
                      className="h-8 px-2"
                    >
                      <Eraser className="w-4 h-4 mr-1" />
                      지우개
                    </Button>
                  </div>

                  {/* 색상 선택 */}
                  {currentTool === 'pen' && (
                    <div className="flex items-center gap-1 border-r pr-2">
                      {PEN_COLORS.map((color) => (
                        <button
                          key={color.value}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            penColor === color.value ? 'border-gray-800 scale-110' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setPenColor(color.value)}
                          title={color.name}
                        />
                      ))}
                    </div>
                  )}
                  {currentTool === 'highlighter' && (
                    <div className="flex items-center gap-1 border-r pr-2">
                      {HIGHLIGHTER_COLORS.map((color) => (
                        <button
                          key={color.value}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            highlighterColor === color.value ? 'border-gray-800 scale-110' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setHighlighterColor(color.value)}
                          title={color.name}
                        />
                      ))}
                    </div>
                  )}

                  {/* 두께 선택 */}
                  <div className="flex items-center gap-1 border-r pr-2">
                    {STROKE_WIDTHS.map((width) => (
                      <button
                        key={width.value}
                        className={`px-2 py-1 text-xs rounded ${
                          strokeWidth === width.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => setStrokeWidth(width.value)}
                      >
                        {width.name}
                      </button>
                    ))}
                  </div>

                  {/* 작업 버튼 */}
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={handleUndo} className="h-8 px-2">
                      <Undo2 className="w-4 h-4 mr-1" />
                      되돌리기
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClearAll} className="h-8 px-2 text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4 mr-1" />
                      전체 삭제
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 스크린샷 + 드로잉 캔버스 */}
            <div ref={containerRef} className="relative bg-gray-50 rounded-lg overflow-hidden">
              {screenshot ? (
                <>
                  {/* 배경 이미지 */}
                  <img
                    src={screenshot}
                    alt="학생 화면"
                    className="w-full h-auto"
                    style={{ imageRendering: 'auto' }}
                  />
                  {/* Fabric.js 캔버스 오버레이 */}
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0"
                    style={{ touchAction: 'none' }}
                  />
                  {!canvasReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded">드로잉 준비 중...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <ImageOff className="w-12 h-12 mb-2" />
                  <p>스크린샷 대기 중...</p>
                  <p className="text-xs mt-1">클라이언트에서 화면을 전송하면 표시됩니다</p>
                </div>
              )}
            </div>
          </Card>

          {/* 하단: 퀴즈 */}
          <Card className="p-4">
            <h2 className="font-semibold text-gray-800 mb-3">
              퀴즈 ({Object.keys(answers).length}/{quizzes.length} 선택)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
              {quizzes.length === 0 ? (
                <div className="text-gray-400 text-center py-8 col-span-full">퀴즈 정보 없음</div>
              ) : (
                quizzes.map((quiz, index) => {
                  const selectedAnswer = answers[quiz.id];
                  const hasSelected = selectedAnswer !== undefined;

                  return (
                    <div
                      key={quiz.id}
                      className={`p-3 rounded-lg border ${
                        hasSelected
                          ? 'border-blue-200 bg-blue-50/50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-gray-800 text-sm">
                          Q{index + 1}. {quiz.question}
                        </span>
                        <Badge className="shrink-0 ml-2 text-xs">
                          {quiz.points}점
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {quiz.options.map((option, optIndex) => {
                          const optionNum = optIndex + 1;
                          const isCorrect = quiz.correctAnswer === optionNum;
                          const isSelected = selectedAnswer === optionNum;

                          return (
                            <div
                              key={optIndex}
                              className={`flex items-center gap-2 text-xs p-1 rounded ${
                                isSelected
                                  ? 'bg-blue-100 text-blue-800 font-medium'
                                  : 'text-gray-600'
                              }`}
                            >
                              <span className={`w-4 h-4 flex items-center justify-center rounded-full border text-xs ${
                                isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300'
                              }`}>
                                {isSelected ? <CheckCircle className="w-2.5 h-2.5" /> : optionNum}
                              </span>
                              <span className="flex-1 truncate">{option}</span>
                              {/* 선생님만 볼 수 있는 정답 표시 */}
                              {isCorrect && (
                                <span className="text-xs text-green-600 font-medium">(정답)</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {!hasSelected && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                          <Circle className="w-2.5 h-2.5" />
                          아직 선택하지 않음
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* 하단 정보 */}
        <Card className="p-3 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>마지막 활동: {formatTime(progressInfo.updatedAt)}</span>
            <span>학습 시간: {getElapsedTime(progressInfo.startedAt)}</span>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
