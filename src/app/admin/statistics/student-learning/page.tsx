'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Zap, BookText, Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

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

type SortField = 'wordPangCount' | 'sentenceLearningCount' | 'passageQuizCount' | null;
type SortDirection = 'asc' | 'desc';

export default function StudentLearningStatisticsPage(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchStatistics = async (isRefresh = false): Promise<void> => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      setError(null);
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  // 정렬 핸들러
  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      // 같은 필드 클릭 시 방향 토글
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드 클릭 시 내림차순으로 시작
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (field: SortField): React.ReactElement => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

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

  // 정렬 적용
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField];
    const bValue = b[sortField];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (aValue - bValue) * multiplier;
  });

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStatistics(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
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
            {sortedStudents.length}명 표시
          </span>
        </div>

        {/* 학생별 테이블 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[80px] text-center">번호</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>학교</TableHead>
                  <TableHead className="w-[80px] text-center">학년</TableHead>
                  <TableHead className="w-[120px] text-center">
                    <button
                      onClick={() => handleSort('wordPangCount')}
                      className="flex items-center justify-center gap-1 w-full cursor-pointer hover:text-amber-600 transition-colors"
                    >
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>단어팡</span>
                      {renderSortIcon('wordPangCount')}
                    </button>
                  </TableHead>
                  <TableHead className="w-[120px] text-center">
                    <button
                      onClick={() => handleSort('sentenceLearningCount')}
                      className="flex items-center justify-center gap-1 w-full cursor-pointer hover:text-emerald-600 transition-colors"
                    >
                      <BookText className="w-4 h-4 text-emerald-500" />
                      <span>문장클리닉</span>
                      {renderSortIcon('sentenceLearningCount')}
                    </button>
                  </TableHead>
                  <TableHead className="w-[120px] text-center">
                    <button
                      onClick={() => handleSort('passageQuizCount')}
                      className="flex items-center justify-center gap-1 w-full cursor-pointer hover:text-purple-600 transition-colors"
                    >
                      <Search className="w-4 h-4 text-purple-500" />
                      <span>보물찾기</span>
                      {renderSortIcon('passageQuizCount')}
                    </button>
                  </TableHead>
                  <TableHead className="w-[100px] text-center">총합</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      {searchTerm ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStudents.map((student, index) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell className="text-center text-gray-500">{index + 1}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-gray-600">{student.school || '-'}</TableCell>
                      <TableCell className="text-center text-gray-600">{student.grade || '-'}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-amber-600">
                          {student.wordPangCount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-emerald-600">
                          {student.sentenceLearningCount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-purple-600">
                          {student.passageQuizCount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-blue-600">
                          {student.totalCount.toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
