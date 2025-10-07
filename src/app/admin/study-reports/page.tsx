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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  
      // 학습정보 상태
      const [learningInfo, setLearningInfo] = useState({
        attendance: 'attendance', // 출결사항 - 출석
        classAttitude: 'average', // 수업태도 - 보통
        homeworkSubmission: 'submitted', // 과제제출 - 제출
        homeworkQuality: 'average', // 과제성실도 - 보통
        testScore: '' // 테스트점수
      });
  
  const [messageText, setMessageText] = useState('');

  // 학습정보 변경 핸들러
  const handleLearningInfoChange = (field: string, value: string) => {
    setLearningInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
                <p className="text-gray-600 mt-2">학생을 선택하고 학습정보를 입력하여 학부모 문자 메시지를 작성합니다</p>
              </div>
            </div>

            {/* 3단 레이아웃 */}
            <div className="grid grid-cols-12 gap-6">
              {/* 좌측: 학생 목록 */}
              <div className="col-span-3">
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
                      <div className="overflow-x-auto h-[calc(100vh-280px)] min-h-[300px] max-h-[700px] overflow-y-auto">
                        <Table className="w-auto border border-gray-200">
                          <TableHeader className="sticky top-0 bg-white z-10">
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

              {/* 중앙: 학습정보 입력 */}
              <div className="col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle>학습정보 입력</CardTitle>
                    <CardDescription>
                      {selectedStudent ? `${students.find(s => s.id === selectedStudent)?.name} 학생의 학습정보를 입력하세요` : '학생을 선택해주세요'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 출결사항 */}
                    <div className="space-y-3">
                      <Label>출결사항</Label>
                      <RadioGroup value={learningInfo.attendance} onValueChange={(value) => handleLearningInfoChange('attendance', value)} className="flex flex-row gap-6">
                        <div className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="attendance" id="attendance-attendance" />
                          <Label htmlFor="attendance-attendance" className="cursor-pointer">출석</Label>
                        </div>
                        <div className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="late" id="attendance-late" />
                          <Label htmlFor="attendance-late" className="cursor-pointer">지각</Label>
                        </div>
                        <div className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="absent" id="attendance-absent" />
                          <Label htmlFor="attendance-absent" className="cursor-pointer">결석</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 수업태도 */}
                    <div className="space-y-3">
                      <Label>수업태도</Label>
                      <RadioGroup value={learningInfo.classAttitude} onValueChange={(value) => handleLearningInfoChange('classAttitude', value)} className="flex flex-row gap-6">
                        <div className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="excellent" id="classAttitude-excellent" />
                          <Label htmlFor="classAttitude-excellent" className="cursor-pointer">우수</Label>
                        </div>
                        <div className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="average" id="classAttitude-average" />
                          <Label htmlFor="classAttitude-average" className="cursor-pointer">보통</Label>
                        </div>
                        <div className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="poor" id="classAttitude-poor" />
                          <Label htmlFor="classAttitude-poor" className="cursor-pointer">미흡</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 과제제출 */}
                    <div className="space-y-3">
                      <Label>과제제출</Label>
                      <RadioGroup value={learningInfo.homeworkSubmission} onValueChange={(value) => handleLearningInfoChange('homeworkSubmission', value)} className="flex flex-row gap-6">
                        <div className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="submitted" id="homeworkSubmission-submitted" />
                          <Label htmlFor="homeworkSubmission-submitted" className="cursor-pointer">제출</Label>
                        </div>
                        <div className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="not_submitted" id="homeworkSubmission-not_submitted" />
                          <Label htmlFor="homeworkSubmission-not_submitted" className="cursor-pointer">미제출</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 과제성실도 */}
                    <div className="space-y-3">
                      <Label>과제성실도</Label>
                      <RadioGroup value={learningInfo.homeworkQuality} onValueChange={(value) => handleLearningInfoChange('homeworkQuality', value)} className="flex flex-row gap-6">
                        <div className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="excellent" id="homeworkQuality-excellent" />
                          <Label htmlFor="homeworkQuality-excellent" className="cursor-pointer">우수</Label>
                        </div>
                        <div className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="average" id="homeworkQuality-average" />
                          <Label htmlFor="homeworkQuality-average" className="cursor-pointer">보통</Label>
                        </div>
                        <div className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="poor" id="homeworkQuality-poor" />
                          <Label htmlFor="homeworkQuality-poor" className="cursor-pointer">미흡</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 테스트점수 */}
                    <div className="space-y-2">
                      <Label htmlFor="testScore">테스트점수</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="testScore"
                          type="number"
                          placeholder="점수 입력"
                          value={learningInfo.testScore}
                          onChange={(e) => handleLearningInfoChange('testScore', e.target.value)}
                          className="w-24"
                        />
                        <span className="text-sm text-gray-500">점</span>
                      </div>
                    </div>

                    {/* 미리보기 작성 버튼 */}
                    <div className="pt-4">
                      <button 
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
                        onClick={() => {
                          // 미리보기 작성 로직 추가 예정
                          console.log('미리보기 작성 버튼 클릭');
                        }}
                      >
                        미리보기 작성
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 우측: 문자 메시지 작성 */}
              <div className="col-span-5">
                <Card>
                  <CardHeader>
                    <CardTitle>학부모 문자 메시지</CardTitle>
                    <CardDescription>
                      선택된 학생의 학습정보를 바탕으로 문자 메시지를 작성합니다
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="message">메시지 내용</Label>
                        <Textarea
                          id="message"
                          placeholder="학생을 선택하고 학습정보를 입력하면 자동으로 메시지가 생성됩니다."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          className="min-h-[300px] resize-none"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                          초기화
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                          메시지 전송
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </AdminLayout>
  );
}
