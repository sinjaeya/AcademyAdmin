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
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Phone,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

// 입금 데이터 타입 정의
interface Payment {
  id: string;
  student_name: string;
  phone_number: string;
  phone_middle_4: string;
  school: string;
  grade: string;
  parent_phone: string;
  currentAcademy: string;
  status: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

// 새 입금 추가 폼 데이터 타입
interface NewPaymentForm {
  student_name: string;
  phone_number: string;
  phone_middle_4: string;
  school: string;
  grade: string;
  parent_phone: string;
  currentAcademy: string;
  status: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [newPayment, setNewPayment] = useState<NewPaymentForm>({
    student_name: '',
    phone_number: '',
    phone_middle_4: '',
    school: '',
    grade: '',
    parent_phone: '',
    currentAcademy: '',
    status: '',
    payment_amount: 0,
    payment_date: '',
    payment_method: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // 페이지네이션 계산
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = payments.slice(startIndex, endIndex);

  // 페이지네이션 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // 데이터 가져오기
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: 실제 DB 연결 시 Supabase에서 데이터 가져오기
      // 현재는 더미 데이터 사용
      const dummyData: Payment[] = [
        {
          id: '1',
          student_name: '김철수',
          phone_number: '010-1234-5678',
          phone_middle_4: '1234',
          school: '서울고등학교',
          grade: '고1',
          parent_phone: '010-9876-5432',
          currentAcademy: '수학학원',
          status: '재학',
          payment_amount: 500000,
          payment_date: '2024-01-15',
          payment_method: '카드',
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T09:00:00Z'
        },
        {
          id: '2',
          student_name: '이영희',
          phone_number: '010-2345-6789',
          phone_middle_4: '2345',
          school: '부산고등학교',
          grade: '고2',
          parent_phone: '010-8765-4321',
          currentAcademy: '영어학원',
          status: '재학',
          payment_amount: 300000,
          payment_date: '2024-01-14',
          payment_method: '현금',
          created_at: '2024-01-14T10:30:00Z',
          updated_at: '2024-01-14T10:30:00Z'
        }
      ];
      
      setPayments(dummyData);
      setTotalCount(dummyData.length);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleDeletePayment = async (paymentId: string) => {
    if (confirm('정말로 이 입금 기록을 삭제하시겠습니까?')) {
      try {
        // TODO: 실제 DB 연결 시 Supabase에서 삭제
        setPayments(prev => prev.filter(payment => payment.id !== paymentId));
        setTotalCount(prev => prev - 1);
      } catch (err) {
        console.error('Error deleting payment:', err);
        alert('입금 기록 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 새 입금 추가 함수
  const handleAddPayment = async () => {
    try {
      setIsSubmitting(true);
      
      // TODO: 실제 DB 연결 시 Supabase에 삽입
      const newPaymentData: Payment = {
        id: Date.now().toString(),
        ...newPayment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setPayments(prev => [newPaymentData, ...prev]);
      setTotalCount(prev => prev + 1);
      
      setNewPayment({
        student_name: '',
        phone_number: '',
        phone_middle_4: '',
        school: '',
        grade: '',
        parent_phone: '',
        currentAcademy: '',
        status: '',
        payment_amount: 0,
        payment_date: '',
        payment_method: ''
      });
      setIsAddPaymentOpen(false);
    } catch (err) {
      console.error('Error adding payment:', err);
      alert('입금 기록 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 폼 입력 핸들러
  const handleInputChange = (field: keyof NewPaymentForm, value: string | number) => {
    setNewPayment(prev => {
      const updatedPayment = {
        ...prev,
        [field]: value
      };
      
      // 핸드폰 번호가 변경되면 중간 4자리 자동 추출
      if (field === 'phone_number') {
        const middle4 = extractMiddle4Digits(value as string);
        updatedPayment.phone_middle_4 = middle4;
      }
      
      return updatedPayment;
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">입금조회</h1>
            <p className="text-gray-600 mt-2">입금 기록을 조회하고 관리합니다</p>
          </div>
          <Button 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsAddPaymentOpen(true)}
          >
            <Plus className="h-4 w-4" />
            새 입금 추가
          </Button>
        </div>

        {/* 입금 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              입금 기록
            </CardTitle>
            <CardDescription>
              총 {totalCount}건의 입금 기록이 있습니다 (페이지 {currentPage}/{totalPages})
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
                <Button onClick={fetchPayments}>다시 시도</Button>
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
                      <TableHead>입금금액</TableHead>
                      <TableHead>입금일</TableHead>
                      <TableHead>결제방법</TableHead>
                      <TableHead>등록일</TableHead>
                      <TableHead>액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {payment.student_name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{payment.student_name || 'N/A'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{payment.phone_number || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {payment.phone_middle_4 || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.school || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{payment.grade || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {payment.parent_phone || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{payment.currentAcademy || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              payment.status === '재학' ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' :
                              payment.status === '휴학' ? 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600' :
                              payment.status === '해지' ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' :
                              'bg-gray-500 text-white border-gray-500'
                            }
                          >
                            {payment.status || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-green-600">
                          {payment.payment_amount?.toLocaleString() || 'N/A'}원
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {payment.payment_date || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.payment_method || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDateTime(payment.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeletePayment(payment.id)}
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
            
            {/* 페이지네이션 */}
            {!loading && !error && totalCount > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-700">페이지 크기:</p>
                  <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-700">
                    {startIndex + 1}-{Math.min(endIndex, totalCount)} / {totalCount}개 항목
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 새 입금 추가 다이얼로그 */}
        <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                새 입금 추가
              </DialogTitle>
              <DialogDescription>
                새로운 입금 정보를 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="student_name">학생명 *</Label>
                <Input
                  id="student_name"
                  value={newPayment.student_name}
                  onChange={(e) => handleInputChange('student_name', e.target.value)}
                  placeholder="학생 이름을 입력하세요"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone_number">핸드폰번호 *</Label>
                <Input
                  id="phone_number"
                  value={newPayment.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone_middle_4">중간4자리 *</Label>
                <Input
                  id="phone_middle_4"
                  value={newPayment.phone_middle_4}
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
                <Input
                  id="school"
                  value={newPayment.school}
                  onChange={(e) => handleInputChange('school', e.target.value)}
                  placeholder="학교명을 입력하세요"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grade">학년 *</Label>
                <Input
                  id="grade"
                  value={newPayment.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  placeholder="1학년, 2학년 등"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parent_phone">부모연락처 *</Label>
                <Input
                  id="parent_phone"
                  value={newPayment.parent_phone}
                  onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentAcademy">학원 *</Label>
                <Input
                  id="currentAcademy"
                  value={newPayment.currentAcademy}
                  onChange={(e) => handleInputChange('currentAcademy', e.target.value)}
                  placeholder="학원명을 입력하세요"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">상태 *</Label>
                <Input
                  id="status"
                  value={newPayment.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  placeholder="재학, 휴학, 해지"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment_amount">입금금액 *</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  value={newPayment.payment_amount}
                  onChange={(e) => handleInputChange('payment_amount', Number(e.target.value))}
                  placeholder="500000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment_date">입금일 *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={newPayment.payment_date}
                  onChange={(e) => handleInputChange('payment_date', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment_method">결제방법 *</Label>
                <Input
                  id="payment_method"
                  value={newPayment.payment_method}
                  onChange={(e) => handleInputChange('payment_method', e.target.value)}
                  placeholder="카드, 현금, 계좌이체"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddPaymentOpen(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                onClick={handleAddPayment}
                disabled={isSubmitting || !newPayment.student_name || !newPayment.phone_number || !newPayment.phone_middle_4 || newPayment.phone_middle_4.length !== 4 || !newPayment.school || !newPayment.grade || !newPayment.parent_phone || !newPayment.currentAcademy || !newPayment.status || !newPayment.payment_amount || !newPayment.payment_date || !newPayment.payment_method}
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

