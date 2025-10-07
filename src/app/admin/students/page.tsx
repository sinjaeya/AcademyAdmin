'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GRADE_OPTIONS, SCHOOL_OPTIONS, ACADEMY_OPTIONS, STATUS_OPTIONS } from '@/config/constants';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Phone,
  X
} from 'lucide-react';

// 학생 데이터 타입 정의
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

// 새 학생 추가 폼 데이터 타입
interface NewStudentForm {
  name: string;
  phone_number: string;
  phone_middle_4: string;
  school: string;
  grade: string;
  parent_phone: string;
  currentAcademy: string;
  status: string;
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

// 핸드폰 번호에서 중간 4자리 추출 함수
const extractMiddle4Digits = (phoneNumber: string): string => {
  // 숫자만 추출
  const digits = phoneNumber.replace(/\D/g, '');
  
  // 11자리인지 확인 (010-1234-5678 형태)
  if (digits.length === 11) {
    // 010-1234-5678에서 1234 부분 추출 (인덱스 3부터 4자리)
    return digits.substring(3, 7);
  }
  
  // 10자리인지 확인 (02-1234-5678 형태)
  if (digits.length === 10) {
    // 02-1234-5678에서 1234 부분 추출 (인덱스 2부터 4자리)
    return digits.substring(2, 6);
  }
  
  return '';
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<NewStudentForm>({
    name: '',
    phone_number: '',
    phone_middle_4: '',
    school: '',
    grade: '',
    parent_phone: '',
    currentAcademy: '',
    status: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleDeleteStudent = async (studentId: string) => {
    if (confirm('정말로 이 학생을 삭제하시겠습니까?')) {
      try {
        if (!supabase) {
          throw new Error('Supabase client is not available');
        }

        const { error } = await supabase
          .from('student')
          .delete()
          .eq('id', studentId);

        if (error) {
          throw error;
        }

        // 성공적으로 삭제되면 목록에서 제거
        setStudents(prev => prev.filter(student => student.id !== studentId));
      } catch (err) {
        console.error('Error deleting student:', err);
        alert('학생 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 새 학생 추가 함수
  const handleAddStudent = async () => {
    try {
      setIsSubmitting(true);
      
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }

      const { data, error } = await supabase
        .from('student')
        .insert([newStudent])
        .select();

      if (error) {
        throw error;
      }

      // 성공적으로 추가되면 목록에 추가
      if (data && data.length > 0) {
        setStudents(prev => [data[0], ...prev]);
        setNewStudent({
          name: '',
          phone_number: '',
          phone_middle_4: '',
          school: '',
          grade: '',
          parent_phone: '',
          currentAcademy: '',
          status: ''
        });
        setIsAddStudentOpen(false);
      }
    } catch (err) {
      console.error('Error adding student:', err);
      alert('학생 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 폼 입력 핸들러
  const handleInputChange = (field: keyof NewStudentForm, value: string) => {
    setNewStudent(prev => {
      const updatedStudent = {
        ...prev,
        [field]: value
      };
      
      // 핸드폰 번호가 변경되면 중간 4자리 자동 추출
      if (field === 'phone_number') {
        const middle4 = extractMiddle4Digits(value);
        updatedStudent.phone_middle_4 = middle4;
      }
      
      return updatedStudent;
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">학생 관리</h1>
            <p className="text-gray-600 mt-2">학생들을 관리하고 설정합니다</p>
          </div>
          <Button 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsAddStudentOpen(true)}
          >
            <Plus className="h-4 w-4" />
            새 학생 추가
          </Button>
        </div>

        {/* 학생 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
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
                <Button onClick={fetchStudents}>다시 시도</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>학생명</TableHead>
                      <TableHead>핸드폰번호</TableHead>
                      <TableHead>중간4자리</TableHead>
                      <TableHead>학교</TableHead>
                      <TableHead>학년</TableHead>
                      <TableHead>부모연락처</TableHead>
                      <TableHead>학원</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>등록일</TableHead>
                      <TableHead>액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {student.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{student.name || 'N/A'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{student.phone_number || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {student.phone_middle_4 || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.school || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{student.grade || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {student.parent_phone || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{student.currentAcademy || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              student.status === '재학' ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' :
                              student.status === '휴학' ? 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600' :
                              student.status === '해지' ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' :
                              'bg-gray-500 text-white border-gray-500'
                            }
                          >
                            {student.status || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDateTime(student.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteStudent(student.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        {/* 새 학생 추가 다이얼로그 */}
        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                새 학생 추가
              </DialogTitle>
              <DialogDescription>
                새로운 학생 정보를 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">학생명 *</Label>
                <Input
                  id="name"
                  value={newStudent.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="학생 이름을 입력하세요"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone_number">핸드폰번호 *</Label>
                <Input
                  id="phone_number"
                  value={newStudent.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone_middle_4">중간4자리 *</Label>
                <Input
                  id="phone_middle_4"
                  value={newStudent.phone_middle_4}
                  onChange={(e) => handleInputChange('phone_middle_4', e.target.value)}
                  placeholder="1234"
                  maxLength={4}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">
                  핸드폰번호 입력 시 자동으로 추출됩니다
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="school">학교 *</Label>
                <Select
                  value={newStudent.school}
                  onValueChange={(value) => handleInputChange('school', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="학교를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_OPTIONS.map((school) => (
                      <SelectItem key={school} value={school}>
                        {school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grade">학년 *</Label>
                <Select
                  value={newStudent.grade}
                  onValueChange={(value) => handleInputChange('grade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="학년을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parent_phone">부모연락처 *</Label>
                <Input
                  id="parent_phone"
                  value={newStudent.parent_phone}
                  onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentAcademy">학원 *</Label>
                <Select
                  value={newStudent.currentAcademy}
                  onValueChange={(value) => handleInputChange('currentAcademy', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="학원을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACADEMY_OPTIONS.map((academy) => (
                      <SelectItem key={academy} value={academy}>
                        {academy}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">상태 *</Label>
                <Select
                  value={newStudent.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상태를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddStudentOpen(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                onClick={handleAddStudent}
                disabled={isSubmitting || !newStudent.name || !newStudent.phone_number || !newStudent.phone_middle_4 || newStudent.phone_middle_4.length !== 4 || !newStudent.school || !newStudent.grade || !newStudent.parent_phone || !newStudent.currentAcademy || !newStudent.status}
              >
                {isSubmitting ? '추가 중...' : '추가'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
}

