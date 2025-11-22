'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Worksheet {
  id: number;
  worksheet_name: string;
  score: string;
  grade: string;
  issued_date: string;
}

interface DailyWorksheets {
  count: number;
  worksheets: Worksheet[];
}

interface Student {
  id: string;
  name: string;
  dailyWorksheets: { [day: number]: DailyWorksheets };
}

interface MathLearningTableProps {
  initialStudents: Student[];
  initialYear: number;
  initialMonth: number;
}

// 요일 계산 함수
const getDayOfWeek = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
};

// 점수에 따른 배지 색상 결정
const getScoreBadgeVariant = (score: string | null) => {
  if (!score) return 'secondary';
  if (score.includes('채점') || score === '이어 채점') return 'secondary';
  
  const scoreNum = parseInt(score.replace('점', ''));
  if (scoreNum >= 90) return 'default'; // 좋은 점수
  if (scoreNum >= 70) return 'secondary'; // 보통
  return 'destructive'; // 낮은 점수
};

export function MathLearningTable({ initialStudents, initialYear, initialMonth }: MathLearningTableProps) {
  const [selectedMonth, setSelectedMonth] = useState(
    `${initialYear}-${String(initialMonth).padStart(2, '0')}`
  );
  const [students, setStudents] = useState(initialStudents);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<{
    studentName: string;
    day: number;
    worksheets: Worksheet[];
  } | null>(null);

  const { toast } = useToast();
  
  // 월 파싱
  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  // 월 선택 시 데이터 로드
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    // 초기 로드는 스킵
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/learning/math?year=${year}&month=${month}`);
        const result = await response.json();
        if (result.data) {
          setStudents(result.data);
        } else if (result.error) {
          toast({
            type: 'error',
            description: result.error
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          type: 'error',
          description: '데이터를 불러오는 중 오류가 발생했습니다.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [year, month, isInitialLoad, toast]);
  
  // 필터링된 학생 목록
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // 검색 필터
      if (searchQuery && !student.name.includes(searchQuery)) {
        return false;
      }
      
      return true;
    });
  }, [students, searchQuery]);

  const handleCellClick = (studentName: string, day: number, worksheets: Worksheet[]) => {
    setSelectedDayData({
      studentName,
      day,
      worksheets
    });
    setDialogOpen(true);
  };
  
  // 월 선택 옵션 생성
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const label = `${year}-${month}`;
      options.push({ value: label, label });
    }
    
    return options;
  }, []);
  
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">수학 학습관리</h1>
        <p className="text-gray-600 mt-1">학생들의 일자별 수학 학습지 현황을 확인할 수 있습니다</p>
      </div>

      {/* 필터 영역 */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          {/* 월 선택기 */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={loading}>
              <SelectTrigger className="border-none shadow-none p-0 h-auto font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="text-center py-4 text-gray-500">
          데이터를 불러오는 중...
        </div>
      )}

      {/* 학습지 상세 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDayData?.studentName} - {year}년 {month}월 {selectedDayData?.day}일 학습지
            </DialogTitle>
            <DialogDescription>
              해당 날짜에 발행된 학습지 목록입니다
            </DialogDescription>
          </DialogHeader>
          {selectedDayData && selectedDayData.worksheets.length > 0 ? (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학습지명</TableHead>
                    <TableHead>학년</TableHead>
                    <TableHead>점수</TableHead>
                    <TableHead>발행일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDayData.worksheets.map((worksheet) => (
                    <TableRow key={worksheet.id}>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={worksheet.worksheet_name}>
                          {worksheet.worksheet_name}
                        </div>
                      </TableCell>
                      <TableCell>{worksheet.grade || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getScoreBadgeVariant(worksheet.score)}>
                          {worksheet.score || '미채점'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(worksheet.issued_date).toLocaleDateString('ko-KR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              학습지 데이터가 없습니다
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 학생 데이터 테이블 */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b border-r bg-white sticky left-0 z-10 w-[100px] whitespace-nowrap">이름</th>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th key={i + 1} className="px-2 py-1 text-center text-xs font-medium text-gray-500 border-b border-r min-w-[40px]">
                    <div className="font-medium">{String(i + 1).padStart(2, '0')}</div>
                    <div className="text-gray-400 text-[10px] font-normal">{getDayOfWeek(year, month, i + 1)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 1} className="px-4 py-8 text-center text-gray-500">
                    {loading ? '데이터를 불러오는 중...' : '학습지 데이터가 없습니다'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-blue-600 hover:underline cursor-pointer bg-white sticky left-0 z-10 w-[100px] whitespace-nowrap border-r">{student.name}</td>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const dailyData = student.dailyWorksheets[day];
                      
                      return (
                        <td key={day} className="px-2 py-2 text-center min-w-[80px] border-r">
                          {dailyData && dailyData.count > 0 ? (
                            <div 
                              className="flex flex-col gap-1 items-center cursor-pointer"
                              onClick={() => handleCellClick(student.name, day, dailyData.worksheets)}
                            >
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200">
                                학습지 {dailyData.count}
                              </Badge>
                              {dailyData.worksheets.some(w => w.score && !w.score.includes('채점')) && (
                                <div className="text-[10px] text-gray-600 mt-1">
                                  {dailyData.worksheets
                                    .filter(w => w.score && !w.score.includes('채점'))
                                    .map(w => {
                                      const scoreNum = parseInt(w.score.replace('점', ''));
                                      return isNaN(scoreNum) ? w.score : `${scoreNum}점`;
                                    })
                                    .join(', ')}
                                </div>
                              )}
                            </div>
                          ) : (
                            ''
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

