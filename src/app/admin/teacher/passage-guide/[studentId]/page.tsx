'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft } from 'lucide-react';

interface PassageItem {
  code: string;
  category: string;
  studyDate: string;
  sessionId: number;
  quizStats?: {
    total: number;
    correct: number;
    incorrect: number;
  };
}

export default function StudentPassageListPage({ params }: { params: Promise<{ studentId: string }> }) {
  const [studentId, setStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [passages, setPassages] = useState<PassageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.studentId;
      setStudentId(id);
      
      const name = searchParams.get('name') || '';
      setStudentName(name);

      try {
        setLoading(true);
        const response = await fetch(`/api/admin/teacher/passage-guide/${id}`);
        if (!response.ok) {
          throw new Error('지문 목록을 가져오는데 실패했습니다.');
        }
        const result = await response.json();
        setPassages(result.data || []);
      } catch (error) {
        console.error('Error loading passages:', error);
        toast({
          type: 'error',
          description: '지문 목록을 불러오는 중 오류가 발생했습니다.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params, searchParams, toast]);

  const handlePassageClick = (code: string) => {
    router.push(`/admin/teacher/passage-guide/${studentId}/${code}?name=${encodeURIComponent(studentName)}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCategory = (category: string) => {
    // category가 있으면 그대로 사용, 없으면 '-' 표시
    return category || '-';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/teacher/passage-guide')}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {studentName}님의 학습 지문
            </h1>
            <p className="text-gray-600 mt-1">최근 학습한 지문 목록입니다</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>지문 목록</CardTitle>
            <CardDescription>
              총 {passages.length}개의 지문이 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                지문 목록을 불러오는 중...
              </div>
            ) : passages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                학습한 지문이 없습니다
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>지문 코드</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>학습일</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passages.map((passage, index) => (
                      <TableRow
                        key={`${passage.code}-${index}`}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handlePassageClick(passage.code)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline">{passage.code}</Badge>
                            {passage.quizStats && passage.quizStats.total > 0 && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span>퀴즈 {passage.quizStats.total}개</span>
                                <span className="text-green-600">정답 {passage.quizStats.correct}</span>
                                <span className="text-red-600">오답 {passage.quizStats.incorrect}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatCategory(passage.category)}</TableCell>
                        <TableCell>{formatDate(passage.studyDate)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePassageClick(passage.code);
                            }}
                            className="cursor-pointer"
                          >
                            상세보기
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

