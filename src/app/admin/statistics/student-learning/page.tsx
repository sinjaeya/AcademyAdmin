'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, TrendingUp, Users, Zap, BookText, Search } from 'lucide-react';

// 학생별 통계 타입
interface StudentStat {
  id: number;
  name: string;
  school: string | null;
  grade: string | null;
  status: string;
  wordPangCount: number;
  sentenceLearningCount: number;
  passageQuizCount: number;
  totalCount: number;
}

interface SummaryStats {
  totalStudents: number;
  totalWordPang: number;
  totalSentenceLearning: number;
  totalPassageQuiz: number;
}

interface StatisticsData {
  students: StudentStat[];
  summary: SummaryStats;
}

export default function StudentLearningStatisticsPage(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStatistics = async (): Promise<void> => {
      try {
        const response = await fetch('/api/admin/statistics/student-learning');
        const result = await response.json();

        if (result.success) {
          setStatistics(result.data);
        } else {
          setError(result.error || '통계 조회 실패');
        }
      } catch (err) {
        console.error('통계 조회 오류:', err);
        setError('통계 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // 검색 필터링
  const filteredStudents = statistics?.students.filter((student) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(search) ||
      student.school?.toLowerCase().includes(search) ||
      student.grade?.toLowerCase().includes(search)
    );
  }) || [];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">통계 로딩 중...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold">풀스택-국어 학생 통계</h1>
              <p className="text-sm text-gray-500">이지국어교습소 재원 학생</p>
            </div>
          </div>
        </div>

        {/* 전체 통계 요약 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 총 학생 수 */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">총 학생 수</p>
                  <p className="text-3xl font-bold">{statistics?.summary.totalStudents}</p>
                </div>
                <Users className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          {/* 단어팡 총 완료 */}
          <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">단어팡 완료</p>
                  <p className="text-3xl font-bold">{statistics?.summary.totalWordPang}</p>
                </div>
                <Zap className="w-10 h-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          {/* 문장클리닉 총 완료 */}
          <Card className="bg-gradient-to-r from-emerald-500 to-green-500 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">문장클리닉 완료</p>
                  <p className="text-3xl font-bold">{statistics?.summary.totalSentenceLearning}</p>
                </div>
                <BookText className="w-10 h-10 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          {/* 보물찾기 총 완료 */}
          <Card className="bg-gradient-to-r from-purple-500 to-violet-500 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">보물찾기 완료</p>
                  <p className="text-3xl font-bold">{statistics?.summary.totalPassageQuiz}</p>
                </div>
                <Search className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="학생 이름, 학교, 학년으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <span className="text-sm text-gray-500">
            {filteredStudents.length}명 표시
          </span>
        </div>

        {/* 학생별 카드 목록 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">{student.name}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    총 {student.totalCount}회
                  </span>
                </CardTitle>
                <p className="text-sm text-gray-500">
                  {student.school || '-'} {student.grade || ''}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 단어팡 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-sm text-gray-600">단어팡</span>
                    </div>
                    <span className="font-bold text-amber-600">{student.wordPangCount}회</span>
                  </div>

                  {/* 문장클리닉 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <BookText className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm text-gray-600">문장클리닉</span>
                    </div>
                    <span className="font-bold text-emerald-600">{student.sentenceLearningCount}회</span>
                  </div>

                  {/* 보물찾기 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Search className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm text-gray-600">보물찾기</span>
                    </div>
                    <span className="font-bold text-purple-600">{student.passageQuizCount}회</span>
                  </div>
                </div>

                {/* 총 학습 진행 바 */}
                {student.totalCount > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
                      {student.wordPangCount > 0 && (
                        <div
                          className="bg-amber-500"
                          style={{ width: `${(student.wordPangCount / student.totalCount) * 100}%` }}
                        />
                      )}
                      {student.sentenceLearningCount > 0 && (
                        <div
                          className="bg-emerald-500"
                          style={{ width: `${(student.sentenceLearningCount / student.totalCount) * 100}%` }}
                        />
                      )}
                      {student.passageQuizCount > 0 && (
                        <div
                          className="bg-purple-500"
                          style={{ width: `${(student.passageQuizCount / student.totalCount) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 학습 기록이 없는 경우 */}
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
