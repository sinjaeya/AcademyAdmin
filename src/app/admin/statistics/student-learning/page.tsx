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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, TrendingUp, Zap, BookText, Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, X, PenLine } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
} from 'recharts';

// 학생별 통계 타입
interface StudentStat {
  id: number;
  name: string;
  school: string | null;
  grade: string | null;
  status: string;
  sentenceLevel: string | null;
  wordPangCount: number;
  wordPangAccuracy: number | null;
  sentenceLearningCount: number;
  sentenceLearningAccuracy: number | null;
  passageQuizCount: number;
  passageQuizAccuracy: number | null;
  handwritingCount: number;
  handwritingPassageCount: number;
  totalCount: number;
}

interface SummaryStats {
  totalStudents: number;
  totalWordPang: number;
  totalSentenceLearning: number;
  totalPassageQuiz: number;
  totalHandwriting: number;
}

interface StatisticsData {
  students: StudentStat[];
  summary: SummaryStats;
}

interface DailyData {
  date: string;
  count: number;
  accuracy: number | null;
}

interface LearningHistory {
  wordPang: DailyData[];
  sentenceClinic: DailyData[];
  passageQuiz: DailyData[];
}

type SortField = 'wordPangCount' | 'sentenceLearningCount' | 'passageQuizCount' | 'handwritingCount' | null;
type SortDirection = 'asc' | 'desc';

// 문장클리닉 레벨 라벨 변환
const SENTENCE_LEVEL_LABELS: Record<string, string> = {
  Lv1_Elem5: 'Lv1',
  Lv2_Elem6: 'Lv2',
  Lv3_Mid1: 'Lv3',
  Lv4_Mid2: 'Lv4',
  Lv5_Mid3: 'Lv5',
  Lv6_High1: 'Lv6',
  Lv7_High2: 'Lv7',
  Lv8_High3: 'Lv8',
  Lv9_CSAT: 'Lv9',
};

// 날짜 포맷 함수 (MM/DD)
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export default function StudentLearningStatisticsPage(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // 팝업 관련 상태
  const [selectedStudent, setSelectedStudent] = useState<StudentStat | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [learningHistory, setLearningHistory] = useState<LearningHistory | null>(null);

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

  // 학생 학습 추이 조회
  const fetchLearningHistory = async (studentId: number): Promise<void> => {
    try {
      setHistoryLoading(true);
      const response = await fetch(`/api/admin/statistics/student-learning/${studentId}`);
      const result = await response.json();

      if (result.success) {
        setLearningHistory(result.data);
      } else {
        console.error('학습 추이 조회 실패:', result.error);
      }
    } catch (err) {
      console.error('학습 추이 조회 오류:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 학생 이름 클릭 핸들러
  const handleStudentClick = (student: StudentStat): void => {
    setSelectedStudent(student);
    setLearningHistory(null);
    fetchLearningHistory(student.id);
  };

  // 팝업 닫기
  const handleClosePopup = (): void => {
    setSelectedStudent(null);
    setLearningHistory(null);
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  // 정렬 핸들러
  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
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

  // 차트 데이터 변환
  const formatChartData = (data: DailyData[]): Array<{ date: string; count: number; accuracy: number | null; displayDate: string }> => {
    return data.map((item) => ({
      ...item,
      displayDate: formatDate(item.date),
    }));
  };

  // 차트 렌더링 컴포넌트
  const renderChart = (
    data: DailyData[],
    title: string,
    countLabel: string,
    color: string
  ): React.ReactElement => {
    const chartData = formatChartData(data);

    if (chartData.length === 0) {
      return (
        <div className="h-[200px] flex items-center justify-center text-gray-400">
          학습 데이터가 없습니다
        </div>
      );
    }

    return (
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value: number, name: string) => {
                if (name === '정답률') return [`${value}%`, name];
                return [value.toLocaleString(), name];
              }}
              labelFormatter={(label) => `날짜: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              yAxisId="left"
              dataKey="count"
              fill={color}
              name={countLabel}
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="accuracy"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="정답률"
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

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
                  <TableHead className="w-[120px] text-center">
                    <button
                      onClick={() => handleSort('handwritingCount')}
                      className="flex items-center justify-center gap-1 w-full cursor-pointer hover:text-orange-600 transition-colors"
                    >
                      <PenLine className="w-4 h-4 text-orange-500" />
                      <span>내손내줄</span>
                      {renderSortIcon('handwritingCount')}
                    </button>
                  </TableHead>
                  <TableHead className="w-[100px] text-center">총합</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                      {searchTerm ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStudents.map((student, index) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell className="text-center text-gray-500">{index + 1}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleStudentClick(student)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {student.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-gray-600">{student.school || '-'}</TableCell>
                      <TableCell className="text-center text-gray-600">{student.grade || '-'}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-amber-600">
                          {student.wordPangCount.toLocaleString()}
                        </span>
                        {student.wordPangAccuracy !== null && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({student.wordPangAccuracy}%)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.sentenceLevel && (
                          <span className="inline-block px-1 py-px text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded mr-1">
                            {SENTENCE_LEVEL_LABELS[student.sentenceLevel] || student.sentenceLevel}
                          </span>
                        )}
                        <span className="font-semibold text-emerald-600">
                          {student.sentenceLearningCount.toLocaleString()}
                        </span>
                        {student.sentenceLearningAccuracy !== null && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({student.sentenceLearningAccuracy}%)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-purple-600">
                          {student.passageQuizCount.toLocaleString()}
                        </span>
                        {student.passageQuizAccuracy !== null && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({student.passageQuizAccuracy}%)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-orange-600">
                          {(student.handwritingCount || 0).toLocaleString()}
                        </span>
                        <span className="ml-1 text-xs text-gray-500">
                          (-)
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

        {/* 학습 추이 팝업 */}
        <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && handleClosePopup()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                {selectedStudent?.name} 학습 추이
                {selectedStudent?.grade && (
                  <span className="text-sm font-normal text-gray-500">
                    ({selectedStudent.grade})
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">추이 데이터 로딩 중...</span>
              </div>
            ) : learningHistory ? (
              <div className="space-y-6">
                {/* 단어팡 차트 */}
                <div className="border rounded-lg p-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold mb-3">
                    <Zap className="w-5 h-5 text-amber-500" />
                    단어팡 학습 추이
                  </h3>
                  {renderChart(learningHistory.wordPang, '단어팡', '학습 단어 수', '#f59e0b')}
                </div>

                {/* 문장클리닉 차트 */}
                <div className="border rounded-lg p-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold mb-3">
                    <BookText className="w-5 h-5 text-emerald-500" />
                    문장클리닉 학습 추이
                  </h3>
                  {renderChart(learningHistory.sentenceClinic, '문장클리닉', '학습 지문 수', '#10b981')}
                </div>

                {/* 보물찾기 차트 */}
                <div className="border rounded-lg p-4">
                  <h3 className="flex items-center gap-2 text-base font-semibold mb-3">
                    <Search className="w-5 h-5 text-purple-500" />
                    보물찾기 학습 추이
                  </h3>
                  {renderChart(learningHistory.passageQuiz, '보물찾기', '학습 지문 수', '#8b5cf6')}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-gray-500">
                데이터를 불러오지 못했습니다.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
