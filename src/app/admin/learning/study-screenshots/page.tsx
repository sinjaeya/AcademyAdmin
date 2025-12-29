'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import { Camera, ChevronLeft, ChevronRight, X, Download, Loader2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

interface Student {
  id: number;
  name: string;
  grade: string | null;
  academy_id: string | null;
}

interface FileObject {
  name: string;
  created_at: string | null;
}

interface Screenshot {
  name: string;
  url: string;
  createdAt: string;
}

export default function StudyScreenshotsPage(): React.ReactElement {
  const { academyId } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // 오늘 날짜 (YYYY-MM-DD)
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // 이미지 뷰어 상태
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 학생 목록 조회 (로그인한 사용자의 학원 학생만)
  useEffect(() => {
    async function fetchStudents(): Promise<void> {
      // academyId가 아직 로드되지 않았으면 대기 (Zustand hydration 대기)
      if (!supabase || !academyId) {
        return;
      }

      setLoadingStudents(true);
      const { data, error } = await supabase
        .from('student')
        .select('id, name, grade, academy_id')
        .eq('status', '재원')
        .eq('academy_id', academyId)
        .order('name', { ascending: true });

      if (error) {
        console.error('학생 목록 조회 실패:', error);
        setLoadingStudents(false);
        return;
      }

      setStudents(data || []);
      setLoadingStudents(false);
    }

    fetchStudents();
  }, [academyId]);

  // 스크린샷 조회
  const fetchScreenshots = useCallback(async (): Promise<void> => {
    if (!selectedStudentId || !selectedDate) {
      setScreenshots([]);
      return;
    }

    const student = students.find(s => s.id.toString() === selectedStudentId);
    if (!student || !student.academy_id) {
      setScreenshots([]);
      return;
    }

    setLoading(true);
    if (!supabase) return;

    // Storage 경로: {academy_id}/{student_id}/{date}/
    const storagePath = `${student.academy_id}/${student.id}/${selectedDate}`;

    const { data, error } = await supabase.storage
      .from('academy_works')
      .list(storagePath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('스크린샷 조회 실패:', error);
      setScreenshots([]);
      setLoading(false);
      return;
    }

    // 이미지 파일만 필터링하고 URL 생성
    const imageFiles = (data || []).filter((file: FileObject) =>
      file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );

    const screenshotList: Screenshot[] = imageFiles.map((file: FileObject) => {
      const { data: urlData } = supabase!.storage
        .from('academy_works')
        .getPublicUrl(`${storagePath}/${file.name}`);

      return {
        name: file.name,
        url: urlData.publicUrl,
        createdAt: file.created_at || ''
      };
    });

    setScreenshots(screenshotList);
    setLoading(false);
  }, [selectedStudentId, selectedDate, students]);

  // 학생 또는 날짜 변경시 스크린샷 조회
  useEffect(() => {
    fetchScreenshots();
  }, [fetchScreenshots]);

  // 날짜 이동
  const changeDate = (days: number): void => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // 이미지 뷰어 열기
  const openViewer = (index: number): void => {
    setCurrentImageIndex(index);
    setViewerOpen(true);
  };

  // 이전/다음 이미지
  const prevImage = (): void => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : screenshots.length - 1));
  };

  const nextImage = (): void => {
    setCurrentImageIndex(prev => (prev < screenshots.length - 1 ? prev + 1 : 0));
  };

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!viewerOpen) return;
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'Escape') setViewerOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerOpen, screenshots.length]);

  // 선택된 학생
  const selectedStudent = students.find(s => s.id.toString() === selectedStudentId);

  // 날짜 포맷팅 (요일 포함)
  const formatDateWithDay = (dateStr: string): string => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = days[date.getDay()];
    return `${dateStr} (${dayName})`;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Camera className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">공부스크린샷</h1>
        </div>

        {/* 메인 컨텐츠 - 좌우 분할 */}
        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* 좌측: 학생 리스트 */}
          <Card className="w-64 flex-shrink-0 flex flex-col">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                학생 목록
                <span className="text-gray-400 font-normal">({students.length}명)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  학생이 없습니다.
                </div>
              ) : (
                <div className="divide-y">
                  {students.map(student => (
                    <div
                      key={student.id}
                      className={cn(
                        'px-3 py-2 cursor-pointer transition-colors flex items-center justify-between',
                        selectedStudentId === student.id.toString()
                          ? 'bg-blue-50 border-l-3 border-blue-500'
                          : 'hover:bg-gray-50 border-l-3 border-transparent'
                      )}
                      onClick={() => setSelectedStudentId(student.id.toString())}
                    >
                      <span className="font-medium text-sm text-gray-900">
                        {student.name}
                      </span>
                      {student.grade && (
                        <span className="text-xs text-gray-400">
                          {student.grade}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 우측: 날짜 선택 + 스크린샷 */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* 날짜 선택 영역 */}
            <Card>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">날짜</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changeDate(-1)}
                    className="h-9 w-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-[150px] h-9"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changeDate(1)}
                    className="h-9 w-9"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  >
                    오늘
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 스크린샷 목록 */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="py-3 px-4 border-b flex-shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  {selectedStudent ? (
                    <>
                      <span className="font-semibold">{selectedStudent.name}</span>
                      {selectedStudent.grade && (
                        <span className="text-gray-400 font-normal">({selectedStudent.grade})</span>
                      )}
                      <span className="text-gray-300">|</span>
                      <span className="font-normal text-gray-600">{formatDateWithDay(selectedDate)}</span>
                      <span className="ml-auto text-gray-500 font-normal">
                        {screenshots.length}장
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500 font-normal">학생을 선택해주세요</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-500">불러오는 중...</span>
                  </div>
                ) : !selectedStudentId ? (
                  <div className="text-center py-20 text-gray-500">
                    <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>좌측에서 학생을 선택하면 스크린샷을 볼 수 있습니다.</p>
                  </div>
                ) : screenshots.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>해당 날짜에 스크린샷이 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {screenshots.map((screenshot, index) => (
                      <div
                        key={screenshot.name}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all"
                        onClick={() => openViewer(index)}
                      >
                        <div className="aspect-[4/3] bg-gray-100">
                          <img
                            src={screenshot.url}
                            alt={screenshot.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-xs text-white truncate">
                            {index + 1}번째
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 이미지 뷰어 Dialog */}
        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
            <DialogTitle className="sr-only">이미지 뷰어</DialogTitle>
            <div className="relative w-full h-[90vh] flex items-center justify-center">
              {/* 닫기 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={() => setViewerOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* 다운로드 버튼 */}
              <a
                href={screenshots[currentImageIndex]?.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-4 right-16 z-50"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Download className="h-6 w-6" />
                </Button>
              </a>

              {/* 이전 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                onClick={prevImage}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              {/* 이미지 */}
              {screenshots[currentImageIndex] && (
                <img
                  src={screenshots[currentImageIndex].url}
                  alt={screenshots[currentImageIndex].name}
                  className="max-w-full max-h-full object-contain"
                />
              )}

              {/* 다음 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                onClick={nextImage}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>

              {/* 인디케이터 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                {currentImageIndex + 1} / {screenshots.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
