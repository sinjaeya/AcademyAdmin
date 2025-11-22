'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { GRADE_OPTIONS } from '@/config/constants';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

interface Student {
  id: string;
  name: string;
  grade: string;
  school?: string;
  academy_id?: string | null;
}

export default function PassageGuidePage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { academyId } = useAuthStore();

  // 학생 목록 로드
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/students');
        if (!response.ok) {
          throw new Error('학생 목록을 가져오는데 실패했습니다.');
        }
        const result = await response.json();
        
        // API가 배열을 직접 반환하는지 확인
        const studentsArray = Array.isArray(result) ? result : (result.data || []);
        
        console.log('Loaded students:', studentsArray.length);
        console.log('Academy ID:', academyId);
        
        // academy_id로 필터링 (문자열 비교)
        const filteredByAcademy = academyId
          ? studentsArray.filter((student: Student) => {
              const studentAcademyId = student.academy_id?.toString();
              const currentAcademyId = academyId.toString();
              return studentAcademyId === currentAcademyId;
            })
          : studentsArray;
        
        console.log('Filtered by academy:', filteredByAcademy.length);
        setAllStudents(filteredByAcademy);
      } catch (error) {
        console.error('Error loading students:', error);
        toast({
          type: 'error',
          description: '학생 목록을 불러오는 중 오류가 발생했습니다.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [toast, academyId]);

  // 필터링된 학생 목록 (학년 기준, 가나다 순 정렬)
  const filteredStudents = useMemo(() => {
    let filtered = selectedGrade === 'all' 
      ? allStudents 
      : allStudents.filter(student => student.grade === selectedGrade);
    
    // 가나다 순으로 정렬
    return filtered.sort((a, b) => {
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [allStudents, selectedGrade]);

  const handleStudentClick = (studentId: string, studentName: string) => {
    router.push(`/admin/teacher/passage-guide/${studentId}?name=${encodeURIComponent(studentName)}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">지문가이드</h1>
          <p className="text-gray-600 mt-1">학생을 선택하여 최근 학습한 지문을 확인할 수 있습니다</p>
        </div>

        {/* 필터 영역 */}
        <Card>
          <CardHeader>
            <CardTitle>학생 선택</CardTitle>
            <CardDescription>학년을 선택하여 해당 학년의 학생을 확인할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 학년 필터 - 버튼/뱃지 형태 */}
            <div>
              <Label className="mb-2 block">학년</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedGrade === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGrade('all')}
                  className="cursor-pointer"
                >
                  전체 학년
                </Button>
                {GRADE_OPTIONS.map((grade) => (
                  <Button
                    key={grade}
                    variant={selectedGrade === grade ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedGrade(grade)}
                    className="cursor-pointer"
                  >
                    {grade}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 학생 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>학생 목록</CardTitle>
            <CardDescription>
              {filteredStudents.length}명의 학생이 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                학생 목록을 불러오는 중...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {selectedGrade !== 'all'
                  ? `${selectedGrade} 학년 학생이 없습니다`
                  : '학생 데이터가 없습니다'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredStudents.map((student) => (
                  <Button
                    key={student.id}
                    variant="outline"
                    className="h-auto flex flex-col items-center justify-center p-4 gap-2 hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
                    onClick={() => handleStudentClick(student.id, student.name)}
                  >
                    <div className="font-semibold text-base">{student.name}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {student.grade}
                      </Badge>
                      {student.school && (
                        <span className="text-xs text-gray-500 truncate max-w-[80px]">
                          {student.school}
                        </span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

