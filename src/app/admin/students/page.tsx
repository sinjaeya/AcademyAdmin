'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
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
import { GRADE_OPTIONS, SCHOOL_OPTIONS, STATUS_OPTIONS, PARENT_TYPE_OPTIONS } from '@/config/constants';
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
  Phone
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// 학생 데이터 타입 정의
interface Student {
  id: string;
  name: string;
  phone_number: string;
  phone_middle_4: string;
  school: string;
  grade: string;
  parent_phone: string;
  parent_type: string;
  email?: string;
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
  parent_type: string;
  email: string;
  currentAcademy: string;
  status: string;
}

// 학생 수정 폼 데이터 타입
interface EditStudentForm {
  id: string;
  name: string;
  phone_number: string;
  phone_middle_4: string;
  school: string;
  grade: string;
  parent_phone: string;
  parent_type: string;
  email: string;
  currentAcademy: string;
  status: string;
}

// 학원 데이터 타입
interface Academy {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
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
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState<NewStudentForm>({
    name: '',
    phone_number: '',
    phone_middle_4: '',
    school: '',
    grade: '',
    parent_phone: '',
    parent_type: '엄마',
    email: '',
    currentAcademy: '이지수학교습소',
    status: '재원'
  });
  const [editStudent, setEditStudent] = useState<EditStudentForm>({
    id: '',
    name: '',
    phone_number: '',
    phone_middle_4: '',
    school: '',
    grade: '',
    parent_phone: '',
    parent_type: '엄마',
    email: '',
    currentAcademy: '',
    status: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 학원 데이터 가져오기
  const fetchAcademies = async () => {
    try {
      const response = await fetch('/api/admin/academy');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '학원 데이터를 가져오는 중 오류가 발생했습니다.');
      }

      setAcademies(result.academies || []);
    } catch (err) {
      console.error('Error fetching academies:', err);
    }
  };

  // 데이터 가져오기
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/students');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '데이터를 가져오는 중 오류가 발생했습니다.');
      }

      setStudents(result || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchAcademies();
  }, []);

  const handleDeleteClick = (studentId: string) => {
    setStudentToDelete(studentId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      const response = await fetch(`/api/admin/students/${studentToDelete}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '학생 삭제 중 오류가 발생했습니다.');
      }

      // 성공적으로 삭제되면 목록에서 제거
      setStudents(prev => prev.filter(student => student.id !== studentToDelete));
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
      toast({
        type: 'success',
        description: '학생이 성공적으로 삭제되었습니다.'
      });
    } catch (err) {
      console.error('Error deleting student:', err);
      toast({
        type: 'error',
        description: err instanceof Error ? err.message : '학생 삭제 중 오류가 발생했습니다.'
      });
    }
  };

  // 새 학생 추가 함수
  const handleAddStudent = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudent),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '학생 추가 중 오류가 발생했습니다.');
      }

      // 성공적으로 추가되면 목록에 추가
      if (result && result.length > 0) {
        setStudents(prev => [result[0], ...prev]);
        setNewStudent({
          name: '',
          phone_number: '',
          phone_middle_4: '',
          school: '',
          grade: '',
          parent_phone: '',
          parent_type: '엄마',
          email: '',
          currentAcademy: '이지수학교습소',
          status: '재원'
        });
        setIsAddStudentOpen(false);
        toast({
          type: 'success',
          description: '학생이 성공적으로 추가되었습니다.'
        });
      }
    } catch (err) {
      console.error('Error adding student:', err);
      toast({
        type: 'error',
        description: err instanceof Error ? err.message : '학생 추가 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 새 학생 폼 입력 핸들러
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

  // 수정 폼 입력 핸들러
  const handleEditInputChange = (field: keyof EditStudentForm, value: string) => {
    setEditStudent(prev => {
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

  // 학생 수정 모달 열기
  const handleEditStudent = (student: Student) => {
    setEditStudent({
      id: student.id,
      name: student.name,
      phone_number: student.phone_number,
      phone_middle_4: student.phone_middle_4,
      school: student.school,
      grade: student.grade,
      parent_phone: student.parent_phone,
      parent_type: student.parent_type || '엄마',
      email: student.email || '',
      currentAcademy: student.currentAcademy,
      status: student.status
    });
    setIsEditStudentOpen(true);
  };

  // 학생 수정 함수
  const handleUpdateStudent = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/admin/students/${editStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editStudent.name,
          phone_number: editStudent.phone_number,
          phone_middle_4: editStudent.phone_middle_4,
          school: editStudent.school,
          grade: editStudent.grade,
          parent_phone: editStudent.parent_phone,
          parent_type: editStudent.parent_type,
          email: editStudent.email,
          currentAcademy: editStudent.currentAcademy,
          status: editStudent.status
        }),
      });

      const result = await response.json();

      // 디버깅: 응답 상태와 내용 확인
      if (!response.ok) {
        console.error('Response not OK:', response.status, result);
        throw new Error(result.error || '학생 정보 업데이트 중 오류가 발생했습니다.');
      }

      // 성공 응답 확인
      if (result.error) {
        console.error('Result has error:', result);
        throw new Error(result.error);
      }

      // 성공 케이스
      if (result.success && result.data) {
        console.log('Update successful:', result);
      }

      // 성공적으로 업데이트되면 목록에서 해당 학생 정보 업데이트
      if (result.data) {
        setStudents(prev => 
          prev.map(student => 
            student.id === editStudent.id 
              ? { ...student, ...result.data }
              : student
          )
        );
      }
      
      setIsEditStudentOpen(false);
      toast({
        type: 'success',
        description: '학생 정보가 성공적으로 업데이트되었습니다.'
      });
    } catch (err) {
      console.error('Error updating student:', err);
      toast({
        type: 'error',
        description: err instanceof Error ? err.message : '학생 정보 업데이트 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="h-full flex flex-col space-y-6">
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
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              학생 목록
            </CardTitle>
            <CardDescription>
              총 {students.length}명의 학생이 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0 p-0" style={{ scrollbarWidth: 'thin' }}>
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
              <div className="overflow-x-auto p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>학생명</TableHead>
                      <TableHead>핸드폰번호</TableHead>
                      <TableHead>중간4자리</TableHead>
                      <TableHead>학교</TableHead>
                      <TableHead>학년</TableHead>
                      <TableHead>부모연락처</TableHead>
                      <TableHead>보호자 타입</TableHead>
                      <TableHead>이메일</TableHead>
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
                          <Badge variant="outline">
                            {student.parent_type || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {student.email || 'N/A'}
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
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditStudent(student)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteClick(student.id)}
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
                <Label htmlFor="school">학교</Label>
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
                <Label htmlFor="grade">학년</Label>
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
                <Label htmlFor="parent_type">보호자 타입 *</Label>
                <Select
                  value={newStudent.parent_type}
                  onValueChange={(value) => handleInputChange('parent_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="보호자 타입을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARENT_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일 (선택)</Label>
                <Input
                  id="email"
                  type="text"
                  value={newStudent.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@gmail.com"
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
                    {academies.length > 0 ? (
                      academies.map((academy) => (
                        <SelectItem key={academy.id} value={academy.name}>
                          {academy.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        학원 목록을 불러오는 중...
                      </SelectItem>
                    )}
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
                disabled={isSubmitting || !newStudent.name || !newStudent.phone_number || !newStudent.phone_middle_4 || newStudent.phone_middle_4.length !== 4 || !newStudent.parent_phone || !newStudent.parent_type || !newStudent.currentAcademy || !newStudent.status}
              >
                {isSubmitting ? '추가 중...' : '추가'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 학생 수정 다이얼로그 */}
        <Dialog open={isEditStudentOpen} onOpenChange={setIsEditStudentOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                학생 정보 수정
              </DialogTitle>
              <DialogDescription>
                학생 정보를 수정해주세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">학생명 *</Label>
                <Input
                  id="edit-name"
                  value={editStudent.name}
                  onChange={(e) => handleEditInputChange('name', e.target.value)}
                  placeholder="학생 이름을 입력하세요"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone_number">핸드폰번호 *</Label>
                <Input
                  id="edit-phone_number"
                  value={editStudent.phone_number}
                  onChange={(e) => handleEditInputChange('phone_number', e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone_middle_4">중간4자리 *</Label>
                <Input
                  id="edit-phone_middle_4"
                  value={editStudent.phone_middle_4}
                  onChange={(e) => handleEditInputChange('phone_middle_4', e.target.value)}
                  placeholder="1234"
                  maxLength={4}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500">
                  핸드폰번호 입력 시 자동으로 추출됩니다
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-school">학교 *</Label>
                <Select
                  value={editStudent.school}
                  onValueChange={(value) => handleEditInputChange('school', value)}
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
                <Label htmlFor="edit-grade">학년 *</Label>
                <Select
                  value={editStudent.grade}
                  onValueChange={(value) => handleEditInputChange('grade', value)}
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
                <Label htmlFor="edit-parent_phone">부모연락처 *</Label>
                <Input
                  id="edit-parent_phone"
                  value={editStudent.parent_phone}
                  onChange={(e) => handleEditInputChange('parent_phone', e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-parent_type">보호자 타입 *</Label>
                <Select
                  value={editStudent.parent_type}
                  onValueChange={(value) => handleEditInputChange('parent_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="보호자 타입을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARENT_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">이메일 (선택)</Label>
                <Input
                  id="edit-email"
                  type="text"
                  value={editStudent.email}
                  onChange={(e) => handleEditInputChange('email', e.target.value)}
                  placeholder="example@gmail.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-currentAcademy">학원 *</Label>
                <Select
                  value={editStudent.currentAcademy}
                  onValueChange={(value) => handleEditInputChange('currentAcademy', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="학원을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {academies.length > 0 ? (
                      academies.map((academy) => (
                        <SelectItem key={academy.id} value={academy.name}>
                          {academy.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        학원 목록을 불러오는 중...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-status">상태 *</Label>
                <Select
                  value={editStudent.status}
                  onValueChange={(value) => handleEditInputChange('status', value)}
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
                onClick={() => setIsEditStudentOpen(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                onClick={handleUpdateStudent}
                disabled={isSubmitting || !editStudent.name || !editStudent.phone_number || !editStudent.phone_middle_4 || editStudent.phone_middle_4.length !== 4 || !editStudent.school || !editStudent.grade || !editStudent.parent_phone || !editStudent.currentAcademy || !editStudent.status}
              >
                {isSubmitting ? '수정 중...' : '수정'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 학생 삭제 확인 다이얼로그 */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>학생 삭제 확인</DialogTitle>
              <DialogDescription>
                정말로 이 학생을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setStudentToDelete(null);
                }}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteStudent}
              >
                삭제
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
}

