'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  BookOpen
} from 'lucide-react';

// 학생 데이터 타입 정의 (student 테이블 사용)
interface Student {
  id: string;
  name: string;
  phone_number: string;
  phone_middle_4: string;
  school: string;
  grade: string;
  parent_phone: string;
  currentAcademy: string;
  status: string;
  created_at: string;
  updated_at: string;
}


// 데이터 포맷팅 함수
const formatDateTime = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};


export default function StudyReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // 데이터 가져오기
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }

      const { data, error: fetchError } = await supabase
        .from('student')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      console.log('학생 데이터:', data);
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);



  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">학습리포트</h1>
            <p className="text-gray-600 mt-2">학생들의 기본 정보를 확인합니다</p>
          </div>
        </div>

        {/* 학생 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              학생 목록
            </CardTitle>
            <CardDescription>
              총 {students.length}명의 학생이 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <button 
                  onClick={fetchStudents}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-auto max-w-md border border-gray-200">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-auto">학생명</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="w-auto">
                          <div 
                            className={`flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 p-2 rounded ${
                              selectedStudent === student.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                            }`}
                            onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {student.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <div className={`font-medium text-sm ${
                                selectedStudent === student.id ? 'text-blue-700' : 'text-gray-900'
                              }`}>
                                {student.name || 'N/A'}
                              </div>
                            </div>
                          </div>
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
