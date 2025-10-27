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
import { LearningDetailDialog } from '@/components/admin/LearningDetailDialog';

interface DailyActivity {
  totalXp: number;
  maxXp: number;
  scoreDisplay: string;
}

interface Student {
  id: number;
  name: string;
  dailyActivities: { [day: number]: DailyActivity };
}

interface LearningTableProps {
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

// 점수에 따라 색상 결정
const getScoreColor = (totalXp: number, maxXp: number) => {
  if (maxXp === 0) return 'bg-gray-100 text-gray-800';
  
  const ratio = totalXp / maxXp;
  
  if (ratio < 0.3) return 'bg-yellow-100 text-yellow-800';     // 경고
  if (ratio < 0.6) return 'bg-green-100 text-green-800'; // 노력요함
  return 'bg-blue-100 text-blue-800';                      // 우수
};

export function LearningTable({ initialStudents, initialYear, initialMonth }: LearningTableProps) {
  const [selectedMonth, setSelectedMonth] = useState(
    `${initialYear}-${String(initialMonth).padStart(2, '0')}`
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState(initialStudents);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: number | null; name: string; date: string }>({
    id: null,
    name: '',
    date: ''
  });
  
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
        const response = await fetch(`/api/admin/learning?year=${year}&month=${month}`);
        const result = await response.json();
        if (result.data) {
          setStudents(result.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [year, month, isInitialLoad]);
  
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

  const handleCellClick = (studentId: number, studentName: string, day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedStudent({ id: studentId, name: studentName, date: dateStr });
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
        <h1 className="text-3xl font-bold text-gray-900">학습관리</h1>
        <p className="text-gray-600 mt-1">학생들의 일자별 학습 현황을 확인할 수 있습니다</p>
      </div>

      {/* 필터 영역 */}
      <Card className="p-4">
        <div className="flex items-center">
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

      {/* 학습 상세 Dialog */}
      <LearningDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        studentId={selectedStudent.id}
        studentName={selectedStudent.name}
        studyDate={selectedStudent.date}
      />

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
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-blue-600 hover:underline cursor-pointer bg-white sticky left-0 z-10 w-[100px] whitespace-nowrap border-r">{student.name}</td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const activity = student.dailyActivities[day];
                    
                    return (
                      <td key={day} className="px-2 py-2 text-center min-w-[40px] border-r">
                        {activity ? (
                          <div 
                            className={`px-1 py-0.5 rounded text-xs font-medium cursor-pointer hover:opacity-80 ${getScoreColor(activity.totalXp, activity.maxXp)}`}
                            onClick={() => handleCellClick(student.id, student.name, day)}
                          >
                            {activity.scoreDisplay?.replace(/\s*UP\s*/i, '').trim() || activity.totalXp}
                          </div>
                        ) : (
                          ''
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

