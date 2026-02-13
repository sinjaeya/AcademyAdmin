'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { RefreshCw, Search, Eye } from 'lucide-react';
import type { LoginLog } from '@/types';

export default function LoginLogsPage() {
  const [data, setData] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 필터 상태
  const [search, setSearch] = useState('');
  const [loginType, setLoginType] = useState('all');
  const [successFilter, setSuccessFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '30');

      if (search) params.set('search', search);
      if (loginType !== 'all') params.set('login_type', loginType);
      if (successFilter !== 'all') params.set('success', successFilter);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const res = await fetch(`/api/admin/login-logs?${params.toString()}`);
      const result = await res.json();

      if (result.success) {
        setData(result.data);
        setTotalPages(result.totalPages);
        setTotalCount(result.count);
      }
    } catch (error) {
      console.error('로그인 로그 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [search, loginType, successFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  // 필터 변경 시 첫 페이지로 리셋
  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchData(1);
  };

  // 검색 Enter 키 처리
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFilterChange();
    }
  };

  // 유형 Badge 색상
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'proxy':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">대리</Badge>;
      case 'dev':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">개발</Badge>;
      default:
        return <Badge variant="outline">일반</Badge>;
    }
  };

  // 결과 Badge
  const getResultBadge = (success: boolean) => {
    return success
      ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">성공</Badge>
      : <Badge variant="destructive">실패</Badge>;
  };

  // KST 시간 포맷
  const formatTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MM-dd HH:mm:ss');
    } catch {
      return '-';
    }
  };

  const formatFullTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm:ss');
    } catch {
      return '-';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">로그인 로그</h1>
          <p className="mt-1 text-gray-600">학생 앱 로그인 기록을 확인합니다.</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>로그인 기록 (총 {totalCount.toLocaleString()}건)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(currentPage)}
              disabled={loading}
              className="cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </CardHeader>
          <CardContent>
            {/* 필터 바 */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="학생명 또는 이메일 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-9"
                />
              </div>
              <Select value={loginType} onValueChange={(v) => { setLoginType(v); }}>
                <SelectTrigger className="w-[130px] cursor-pointer">
                  <SelectValue placeholder="로그인 유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">전체 유형</SelectItem>
                  <SelectItem value="normal" className="cursor-pointer">일반</SelectItem>
                  <SelectItem value="proxy" className="cursor-pointer">대리</SelectItem>
                  <SelectItem value="dev" className="cursor-pointer">개발</SelectItem>
                </SelectContent>
              </Select>
              <Select value={successFilter} onValueChange={(v) => { setSuccessFilter(v); }}>
                <SelectTrigger className="w-[130px] cursor-pointer">
                  <SelectValue placeholder="성공여부" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">전체 결과</SelectItem>
                  <SelectItem value="true" className="cursor-pointer">성공</SelectItem>
                  <SelectItem value="false" className="cursor-pointer">실패</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
                placeholder="시작일"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
                placeholder="종료일"
              />
              <Button
                variant="default"
                size="default"
                onClick={handleFilterChange}
                className="cursor-pointer"
              >
                조회
              </Button>
            </div>

            {/* 테이블 */}
            {loading ? (
              <div className="py-10 text-center">로딩 중...</div>
            ) : data.length === 0 ? (
              <div className="py-10 text-center text-gray-500">데이터가 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>시간</TableHead>
                      <TableHead>학생명</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>결과</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>에러</TableHead>
                      <TableHead className="w-[60px]">상세</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                          {formatTime(log.created_at)}
                        </TableCell>
                        <TableCell>{log.student_name ?? '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                          {log.email ?? '-'}
                        </TableCell>
                        <TableCell>{getTypeBadge(log.login_type)}</TableCell>
                        <TableCell>{getResultBadge(log.success)}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {log.ip_address ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm text-red-500 max-w-[200px] truncate">
                          {log.error_message ?? ''}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="cursor-pointer">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>로그인 로그 상세</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-semibold text-gray-500">시간</span>
                                    <p>{formatFullTime(log.created_at)}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-500">학생 ID</span>
                                    <p>{log.student_id ?? '-'}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-500">학생명</span>
                                    <p>{log.student_name ?? '-'}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-500">이메일</span>
                                    <p>{log.email ?? '-'}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-500">로그인 유형</span>
                                    <p>{getTypeBadge(log.login_type)}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-500">결과</span>
                                    <p>{getResultBadge(log.success)}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-500">IP 주소</span>
                                    <p>{log.ip_address ?? '-'}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-500">학원 ID</span>
                                    <p className="text-xs">{log.academy_id ?? '-'}</p>
                                  </div>
                                </div>
                                {log.error_message && (
                                  <div>
                                    <span className="font-semibold text-gray-500 text-sm">에러 메시지</span>
                                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded mt-1">{log.error_message}</p>
                                  </div>
                                )}
                                {log.user_agent && (
                                  <div>
                                    <span className="font-semibold text-gray-500 text-sm">User Agent</span>
                                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 break-all">{log.user_agent}</p>
                                  </div>
                                )}
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <div>
                                    <span className="font-semibold text-gray-500 text-sm">메타데이터</span>
                                    <pre className="text-xs bg-gray-50 p-3 rounded mt-1 overflow-x-auto">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 페이지네이션 */}
            <div className="flex items-center justify-center space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="cursor-pointer"
              >
                이전
              </Button>
              <span className="text-sm">
                {currentPage} / {Math.max(1, totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="cursor-pointer"
              >
                다음
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
