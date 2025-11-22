'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// CheckInOut 데이터 타입 정의
interface CheckInOut {
  id: string;
  student_name: string;
  check_in_time: string;
  check_in_status: string;
  check_out_time: string;
  current_academy: string;
  created_at: string;
  updated_at: string;
}

interface CheckInOutTableProps {
  isLoading?: boolean;
  refreshKey?: number;
}

export function CheckInOutTable({ refreshKey }: CheckInOutTableProps) {
  const [data, setData] = useState<CheckInOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // 날짜 필터 상태 - 기본값은 오늘 날짜
  const todayString = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayString);

  // 페이지네이션 계산
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = data.slice(startIndex, endIndex);

  // 페이지네이션 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // 페이지 크기 변경 시 첫 페이지로 이동
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // API에서 데이터 가져오기
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // API 라우트 호출
      const response = await fetch(`/api/admin/checkinout?date=${selectedDate}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '데이터를 불러오는 중 오류가 발생했습니다.');
      }

      const result = await response.json();
      setData(result.data || []);
      setTotalCount(result.total || 0);
    } catch (err) {
      console.error('데이터 조회 오류:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 날짜 변경 또는 새로고침 키 변경 시 데이터 조회
  useEffect(() => {
    fetchData();
  }, [selectedDate, refreshKey]);

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    const period = hours < 12 ? '오전' : '오후';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${period} ${displayHours}:${displayMinutes}분`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'CheckIn') {
      return (
        <Badge 
          variant="outline"
          className="bg-green-500 text-white border-green-500 hover:bg-green-600"
        >
          등원
        </Badge>
      );
    } else if (status === 'CheckOut') {
      return (
        <Badge 
          variant="outline"
          className="bg-red-500 text-white border-red-500 hover:bg-red-600"
        >
          하원
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          {status}
        </Badge>
      );
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              등/하원 기록
            </CardTitle>
            <CardDescription>
              총 {totalCount}건의 등/하원 기록이 있습니다 (페이지 {currentPage}/{totalPages})
            </CardDescription>
          </div>
          
          {/* 날짜 필터 */}
          <div className="flex items-center gap-2">
            <Label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
              날짜 선택:
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="date-filter"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-8 w-[180px]"
              />
            </div>
            {selectedDate !== todayString && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="text-gray-500 hover:text-gray-700"
              >
                오늘
              </Button>
            )}
          </div>
        </div>
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
            <Button onClick={fetchData}>다시 시도</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>학생명</TableHead>
                  <TableHead>등원시간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>하원시간</TableHead>
                  <TableHead>소속학원</TableHead>
                  <TableHead>등록일시</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {record.student_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{record.student_name || 'N/A'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatTime(record.check_in_time)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(record.check_in_status)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatTime(record.check_out_time)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.current_academy || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDateTime(record.created_at)}
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
  );
}