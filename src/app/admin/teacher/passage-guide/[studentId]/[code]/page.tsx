'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft } from 'lucide-react';

interface PassageDetail {
  code_id: string;
  content: string | null;
  rubric_grade_level: string | null;
  rubric_difficulty_level: string | null;
  keyword_list: string[] | string | null;
  char_count: number | null;
  paragraph_count: number | null;
  qa_status: string | null;
}

export default function PassageDetailPage({ 
  params 
}: { 
  params: Promise<{ studentId: string; code: string }> 
}) {
  const [studentId, setStudentId] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [passage, setPassage] = useState<PassageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.studentId;
      const passageCode = resolvedParams.code;
      
      setStudentId(id);
      setCode(passageCode);
      
      const name = searchParams.get('name') || '';
      setStudentName(name);

      try {
        setLoading(true);
        const response = await fetch(`/api/admin/contents/passages/${encodeURIComponent(passageCode)}`);
        if (!response.ok) {
          throw new Error('지문 상세를 가져오는데 실패했습니다.');
        }
        const data = await response.json();
        setPassage(data);
      } catch (error) {
        console.error('Error loading passage detail:', error);
        toast({
          type: 'error',
          description: '지문 상세를 불러오는 중 오류가 발생했습니다.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params, searchParams, toast]);

  const formatKeywords = (keywords: string[] | string | null) => {
    if (!keywords) return '-';
    if (Array.isArray(keywords)) {
      return keywords.join(', ');
    }
    return keywords;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/teacher/passage-guide/${studentId}?name=${encodeURIComponent(studentName)}`)}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">지문 상세</h1>
            <p className="text-gray-600 mt-1">
              {studentName}님의 학습 지문: {code}
            </p>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                지문을 불러오는 중...
              </div>
            </CardContent>
          </Card>
        ) : !passage ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                지문을 찾을 수 없습니다
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 지문 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>지문 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">지문 코드</p>
                    <Badge variant="outline">{passage.code_id}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">학년</p>
                    <p className="font-medium">{passage.rubric_grade_level || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">난이도</p>
                    <p className="font-medium">{passage.rubric_difficulty_level || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">상태</p>
                    <Badge variant="secondary">{passage.qa_status || '-'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">문자 수</p>
                    <p className="font-medium">{passage.char_count?.toLocaleString() || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">문단 수</p>
                    <p className="font-medium">{passage.paragraph_count || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 키워드 */}
            {passage.keyword_list && (
              <Card>
                <CardHeader>
                  <CardTitle>키워드</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{formatKeywords(passage.keyword_list)}</p>
                </CardContent>
              </Card>
            )}

            {/* 지문 본문 */}
            <Card>
              <CardHeader>
                <CardTitle>지문 본문</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {passage.content || '본문 내용이 없습니다.'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

