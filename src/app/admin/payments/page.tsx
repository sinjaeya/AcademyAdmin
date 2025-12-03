'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAYMENT_METHOD_OPTIONS, STUDY_MONTH_OPTIONS } from '@/config/constants';
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
  Wallet,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth';
import { Payment } from '@/types';

// 학생 데이터 타입 정의
interface Student {
  id: string;
  name: string;
  phone_number?: string;
  currentAcademy?: string;
}

// 새 입금내역 추가 폼 데이터 타입
interface NewPaymentForm {
  student_id: string; // Select 컴포넌트는 string으로 반환
  payer_name: string;
  amount: string;
  payment_date: string;
  payment_method: '무통장' | '카드';
  study_month: '1월' | '2월' | '3월' | '4월' | '5월' | '6월' | '7월' | '8월' | '9월' | '10월' | '11월' | '12월';
  cash_receipt_issued: boolean;
}

// 입금내역 수정 폼 데이터 타입
interface EditPaymentForm {
  id: string;
  student_id: string; // Select 컴포넌트는 string으로 반환
  payer_name: string;
  amount: string;
  payment_date: string;
  payment_method: '무통장' | '카드';
  study_month: '1월' | '2월' | '3월' | '4월' | '5월' | '6월' | '7월' | '8월' | '9월' | '10월' | '11월' | '12월';
  cash_receipt_issued: boolean;
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
    hour12: false
  }).format(date);
};

// 현재 월 가져오기 함수 (클라이언트 시간 기준)
const getCurrentMonth = (): '1월' | '2월' | '3월' | '4월' | '5월' | '6월' | '7월' | '8월' | '9월' | '10월' | '11월' | '12월' => {
  const month = new Date().getMonth() + 1; // 1-12
  return `${month}월` as '1월' | '2월' | '3월' | '4월' | '5월' | '6월' | '7월' | '8월' | '9월' | '10월' | '11월' | '12월';
};

// ISO 8601 날짜를 datetime-local 형식으로 변환
const formatDateForInput = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  // 로컬 시간대로 변환하여 YYYY-MM-DDTHH:mm 형식으로 반환
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// datetime-local 형식을 ISO 8601로 변환
const formatDateFromInput = (localString: string): string => {
  if (!localString) return new Date().toISOString();
  // 로컬 시간 문자열을 Date 객체로 변환한 후 ISO 문자열로 반환
  const date = new Date(localString);
  return date.toISOString();
};

// 금액 천단위 콤마 표시
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

// 현재 날짜/시간을 datetime-local 형식으로 반환
const getCurrentDateTimeLocal = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function PaymentsPage() {
  const { toast } = useToast();
  const { academyId } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isEditPaymentOpen, setIsEditPaymentOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [newPayment, setNewPayment] = useState<NewPaymentForm>({
    student_id: '',
    payer_name: '',
    amount: '',
    payment_date: getCurrentDateTimeLocal(),
    payment_method: '카드',
    study_month: getCurrentMonth(),
    cash_receipt_issued: false
  });
  const [editPayment, setEditPayment] = useState<EditPaymentForm>({
    id: '',
    student_id: '',
    payer_name: '',
    amount: '',
    payment_date: '',
    payment_method: '카드',
    study_month: getCurrentMonth(),
    cash_receipt_issued: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 학생 목록 가져오기 (로그인한 학원의 학생만, 가나다 순 정렬)
  const fetchStudents = async () => {
    try {
      // 학원 ID가 있으면 해당 학원 학생만 조회
      const params = new URLSearchParams();
      if (academyId) {
        params.append('academy_id', academyId);
      }
      const queryString = params.toString();
      const url = `/api/admin/students${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '학생 목록을 가져오는 중 오류가 발생했습니다.');
      }

      // 가나다 순으로 정렬
      const sortedStudents = (result || []).sort((a: Student, b: Student) =>
        a.name.localeCompare(b.name, 'ko')
      );

      setStudents(sortedStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  // 결제 내역 가져오기
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/payments');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '결제 내역을 가져오는 중 오류가 발생했습니다.');
      }

      setPayments(result || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err instanceof Error ? err.message : '결제 내역을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academyId]);

  const handleDeleteClick = (paymentId: string) => {
    setPaymentToDelete(paymentId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    try {
      const response = await fetch(`/api/admin/payments/${paymentToDelete}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '결제 내역 삭제 중 오류가 발생했습니다.');
      }

      // 성공적으로 삭제되면 목록에서 제거
      setPayments(prev => prev.filter(payment => payment.id !== paymentToDelete));
      setIsDeleteDialogOpen(false);
      setPaymentToDelete(null);
      toast({
        type: 'success',
        description: '결제 내역이 성공적으로 삭제되었습니다.'
      });
    } catch (err) {
      console.error('Error deleting payment:', err);
      toast({
        type: 'error',
        description: err instanceof Error ? err.message : '결제 내역 삭제 중 오류가 발생했습니다.'
      });
    }
  };

  // 금액 입력값 포맷팅 (천 단위 쉼표 추가)
  const formatAmountInput = (value: string): string => {
    // 숫자가 아닌 문자 제거
    const numbers = value.replace(/[^0-9]/g, '');
    if (!numbers) return '';
    // 천 단위 쉼표 추가
    return parseInt(numbers).toLocaleString('ko-KR');
  };

  // 금액 입력값에서 숫자만 추출
  const parseAmountInput = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
  };

  const handleInputChange = (field: keyof NewPaymentForm, value: string | boolean) => {
    // 금액 필드인 경우 포맷팅 적용
    if (field === 'amount' && typeof value === 'string') {
      const formattedValue = formatAmountInput(value);
      setNewPayment(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setNewPayment(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleEditInputChange = (field: keyof EditPaymentForm, value: string | boolean) => {
    // 금액 필드인 경우 포맷팅 적용
    if (field === 'amount' && typeof value === 'string') {
      const formattedValue = formatAmountInput(value);
      setEditPayment(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setEditPayment(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddPayment = async () => {
    // 필수 필드 검증
    if (!newPayment.student_id || !newPayment.amount || !newPayment.payment_method || !newPayment.study_month) {
      toast({
        type: 'error',
        description: '필수 필드를 입력해주세요. (학생, 금액, 입금방법, 해당월)'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const paymentData = {
        student_id: parseInt(newPayment.student_id), // string을 number로 변환
        payer_name: newPayment.payer_name || null,
        amount: parseInt(parseAmountInput(newPayment.amount)), // 쉼표 제거 후 number로 변환
        payment_date: formatDateFromInput(newPayment.payment_date),
        payment_method: newPayment.payment_method,
        study_month: newPayment.study_month,
        cash_receipt_issued: newPayment.cash_receipt_issued
      };

      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '결제 내역 추가에 실패했습니다.');
      }

      // 성공적으로 추가되면 목록에 추가
      setPayments(prev => [result, ...prev]);
      setIsAddPaymentOpen(false);
      setNewPayment({
        student_id: '',
        payer_name: '',
        amount: '',
        payment_date: getCurrentDateTimeLocal(),
        payment_method: '카드',
        study_month: getCurrentMonth(),
        cash_receipt_issued: false
      });
      toast({
        type: 'success',
        description: '결제 내역이 성공적으로 추가되었습니다.'
      });
    } catch (err) {
      console.error('Error adding payment:', err);
      toast({
        type: 'error',
        description: err instanceof Error ? err.message : '결제 내역 추가 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setEditPayment({
      id: payment.id,
      student_id: String(payment.student_id), // number를 string으로 변환
      payer_name: payment.payer_name || '',
      amount: formatAmountInput(payment.amount.toString()), // 천 단위 쉼표 추가
      payment_date: formatDateForInput(payment.payment_date),
      payment_method: payment.payment_method,
      study_month: payment.study_month,
      cash_receipt_issued: payment.cash_receipt_issued
    });
    setIsEditPaymentOpen(true);
  };

  const handleUpdatePayment = async () => {
    // 필수 필드 검증
    if (!editPayment.student_id || !editPayment.amount || !editPayment.payment_method || !editPayment.study_month) {
      toast({
        type: 'error',
        description: '필수 필드를 입력해주세요. (학생, 금액, 입금방법, 해당월)'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const paymentData = {
        student_id: parseInt(editPayment.student_id), // string을 number로 변환
        payer_name: editPayment.payer_name || null,
        amount: parseInt(parseAmountInput(editPayment.amount)), // 쉼표 제거 후 number로 변환
        payment_date: formatDateFromInput(editPayment.payment_date),
        payment_method: editPayment.payment_method,
        study_month: editPayment.study_month,
        cash_receipt_issued: editPayment.cash_receipt_issued
      };

      const response = await fetch(`/api/admin/payments/${editPayment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '결제 내역 업데이트에 실패했습니다.');
      }

      // 성공적으로 업데이트되면 목록에서 해당 결제 내역 업데이트
      setPayments(prev => prev.map(payment => 
        payment.id === editPayment.id ? result : payment
      ));
      setIsEditPaymentOpen(false);
      toast({
        type: 'success',
        description: '결제 내역이 성공적으로 업데이트되었습니다.'
      });
    } catch (err) {
      console.error('Error updating payment:', err);
      toast({
        type: 'error',
        description: err instanceof Error ? err.message : '결제 내역 업데이트 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">학원비수납내역</h1>
            <p className="text-gray-600 mt-1">학원비 수납 내역을 관리합니다</p>
          </div>
          <Button 
            onClick={() => setIsAddPaymentOpen(true)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            입금내역 추가
          </Button>
        </div>

        {/* 결제 내역 목록 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-gray-500" />
                <CardTitle>결제 내역 목록</CardTitle>
              </div>
            </div>
            <CardDescription>
              총 {payments.length}건의 결제 내역이 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>데이터를 불러오는 중...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchPayments}>다시 시도</Button>
              </div>
            ) : (
              <div className="p-6 h-full flex flex-col">
                <div 
                  className="flex-1 overflow-y-auto" 
                  style={{ 
                    scrollbarWidth: 'thin',
                    overflowX: 'scroll',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ minWidth: 'max-content', minHeight: '100%' }}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>학생명</TableHead>
                          <TableHead>입금자</TableHead>
                          <TableHead>금액</TableHead>
                          <TableHead>입금일시</TableHead>
                          <TableHead>해당월</TableHead>
                          <TableHead>입금방법</TableHead>
                          <TableHead>현금영수증</TableHead>
                          <TableHead>등록일</TableHead>
                          <TableHead>액션</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                              결제 내역이 없습니다.
                            </TableCell>
                          </TableRow>
                        ) : (
                          payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">
                                {payment.student_name || 'N/A'}
                              </TableCell>
                              <TableCell>{payment.payer_name || 'N/A'}</TableCell>
                              <TableCell>{formatAmount(payment.amount)}원</TableCell>
                              <TableCell>{formatDateTime(payment.payment_date)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {payment.study_month}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {payment.payment_method}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={payment.cash_receipt_issued ? "default" : "secondary"}>
                                  {payment.cash_receipt_issued ? '예' : '아니오'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {formatDateTime(payment.created_at)}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditPayment(payment)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteClick(payment.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 입금내역 추가 다이얼로그 */}
        <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>입금내역 추가</DialogTitle>
              <DialogDescription>
                새로운 입금내역을 추가합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* 학생과 해당월을 같은 행에 배치 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student_id">학생 *</Label>
                  <Select
                    value={newPayment.student_id}
                    onValueChange={(value) => handleInputChange('student_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="학생을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="study_month">해당월 *</Label>
                  <Select
                    value={newPayment.study_month}
                    onValueChange={(value) => handleInputChange('study_month', value as '1월' | '2월' | '3월' | '4월' | '5월' | '6월' | '7월' | '8월' | '9월' | '10월' | '11월' | '12월')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_MONTH_OPTIONS.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* 금액과 입금일시를 같은 행에 배치 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">금액 *</Label>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    value={newPayment.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="금액을 입력하세요"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment_date">입금일시 *</Label>
                  <Input
                    id="payment_date"
                    type="datetime-local"
                    value={newPayment.payment_date}
                    onChange={(e) => handleInputChange('payment_date', e.target.value)}
                  />
                </div>
              </div>
              
              {/* 입금방법과 현금영수증을 같은 행에 배치 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">입금방법 *</Label>
                  <Select
                    value={newPayment.payment_method}
                    onValueChange={(value) => handleInputChange('payment_method', value as '무통장' | '카드')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cash_receipt_issued">현금영수증 발행여부</Label>
                    <Switch
                      id="cash_receipt_issued"
                      checked={newPayment.cash_receipt_issued}
                      onCheckedChange={(checked) => handleInputChange('cash_receipt_issued', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex items-center justify-between">
              {/* 입금자는 하단 우측으로 이동 */}
              <div className="flex-1">
                <Label htmlFor="payer_name">입금자</Label>
                <Input
                  id="payer_name"
                  value={newPayment.payer_name}
                  onChange={(e) => handleInputChange('payer_name', e.target.value)}
                  placeholder="입금자 이름을 입력하세요"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddPaymentOpen(false)}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  onClick={handleAddPayment}
                  disabled={isSubmitting || !newPayment.student_id || !newPayment.amount || !newPayment.payment_method || !newPayment.study_month}
                >
                  {isSubmitting ? '추가 중...' : '추가'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 입금내역 수정 다이얼로그 */}
        <Dialog open={isEditPaymentOpen} onOpenChange={setIsEditPaymentOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>입금내역 수정</DialogTitle>
              <DialogDescription>
                입금내역 정보를 수정합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* 학생과 해당월을 같은 행에 배치 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-student_id">학생 *</Label>
                  <Select
                    value={editPayment.student_id}
                    onValueChange={(value) => handleEditInputChange('student_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="학생을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-study_month">해당월 *</Label>
                  <Select
                    value={editPayment.study_month}
                    onValueChange={(value) => handleEditInputChange('study_month', value as '1월' | '2월' | '3월' | '4월' | '5월' | '6월' | '7월' | '8월' | '9월' | '10월' | '11월' | '12월')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_MONTH_OPTIONS.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* 금액과 입금일시를 같은 행에 배치 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">금액 *</Label>
                  <Input
                    id="edit-amount"
                    type="text"
                    inputMode="numeric"
                    value={editPayment.amount}
                    onChange={(e) => handleEditInputChange('amount', e.target.value)}
                    placeholder="금액을 입력하세요"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-payment_date">입금일시 *</Label>
                  <Input
                    id="edit-payment_date"
                    type="datetime-local"
                    value={editPayment.payment_date}
                    onChange={(e) => handleEditInputChange('payment_date', e.target.value)}
                  />
                </div>
              </div>
              
              {/* 입금방법과 현금영수증을 같은 행에 배치 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-payment_method">입금방법 *</Label>
                  <Select
                    value={editPayment.payment_method}
                    onValueChange={(value) => handleEditInputChange('payment_method', value as '무통장' | '카드')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-cash_receipt_issued">현금영수증 발행여부</Label>
                    <Switch
                      id="edit-cash_receipt_issued"
                      checked={editPayment.cash_receipt_issued}
                      onCheckedChange={(checked) => handleEditInputChange('cash_receipt_issued', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex items-center justify-between">
              {/* 입금자는 하단 우측으로 이동 */}
              <div className="flex-1">
                <Label htmlFor="edit-payer_name">입금자</Label>
                <Input
                  id="edit-payer_name"
                  value={editPayment.payer_name}
                  onChange={(e) => handleEditInputChange('payer_name', e.target.value)}
                  placeholder="입금자 이름을 입력하세요"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditPaymentOpen(false)}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  onClick={handleUpdatePayment}
                  disabled={isSubmitting || !editPayment.student_id || !editPayment.amount || !editPayment.payment_method || !editPayment.study_month}
                >
                  {isSubmitting ? '수정 중...' : '수정'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 삭제 확인 다이얼로그 */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>결제 내역 삭제</DialogTitle>
              <DialogDescription>
                정말로 이 결제 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePayment}
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

