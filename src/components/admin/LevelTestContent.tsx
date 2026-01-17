'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  TableRow,
} from '@/components/ui/table';
import { useAuthStore } from '@/store/auth';
import { ClipboardCheck, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
  type LevelTestSession,
  LEVEL_LABELS,
  getGrade,
  calculateRate,
  formatElapsedTime,
  getStatusLabel,
  getStatusColor,
} from '@/types/level-test';
import { LevelTestDetailDialog } from '@/components/admin/LevelTestDetailDialog';

export function LevelTestContent() {
  const { academyId } = useAuthStore();
  const [sessions, setSessions] = useState<LevelTestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // 필터
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 상세 다이얼로그
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 데이터 로드
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // academyId 필터 제거 - 모든 데이터를 표시하도록 변경
      // if (academyId) params.append('academyId', academyId);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const response = await fetch(`/api/admin/level-test?${params}`);
      const result = await response.json();

      if (result.success) {
        setSessions(result.data);
        setTotal(result.total);
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 검색 필터링 (클라이언트 사이드)
  const filteredSessions = sessions.filter((session) => {
    if (searchName && !session.student_name?.includes(searchName)) {
      return false;
    }
    return true;
  });

  // 행 클릭 핸들러
  const handleRowClick = (sessionId: string): void => {
    setSelectedSessionId(sessionId);
    setDialogOpen(true);
  };

  // 페이지네이션
  const totalPages = Math.ceil(total / pageSize);

  // 날짜 포맷
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">레벨테스트</h1>
            <p className="text-sm text-gray-500">학생별 레벨테스트 이력을 조회합니다</p>
          </div>
        </div>
        <Badge variant="outline" className="text-gray-600">
          총 {total}건
        </Badge>
      </div>

      {/* 필터 */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="학생 이름 검색"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="in_progress">진행중</SelectItem>
              <SelectItem value="abandoned">중단</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 테이블 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">학생명</TableHead>
              <TableHead className="w-[160px]">테스트일</TableHead>
              <TableHead className="w-[100px]">추천레벨</TableHead>
              <TableHead className="w-[120px]">종합점수</TableHead>
              <TableHead className="w-[80px]">등급</TableHead>
              <TableHead className="w-[80px]">소요시간</TableHead>
              <TableHead className="w-[80px]">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                </TableCell>
              </TableRow>
            ) : filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  레벨테스트 이력이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => {
                const overallRate = session.results
                  ? calculateRate(session.results.overall.correct, session.results.overall.total)
                  : 0;
                const grade = getGrade(overallRate);

                return (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(session.id)}
                  >
                    <TableCell className="font-medium">{session.student_name}</TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {formatDate(session.started_at)}
                    </TableCell>
                    <TableCell>
                      {session.recommended_level ? (
                        <span className="font-semibold text-blue-600">
                          {session.recommended_level}{' '}
                          <span className="text-gray-500 font-normal">
                            ({LEVEL_LABELS[session.recommended_level] || ''})
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {session.results ? (
                        <span>
                          {session.results.overall.correct}/{session.results.overall.total}
                          <span className="text-gray-500 ml-1">({overallRate}%)</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {session.status === 'completed' ? (
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm"
                          style={{ backgroundColor: grade.color }}
                        >
                          {grade.label}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {formatElapsedTime(session.elapsed_seconds)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(session.status)}>
                        {getStatusLabel(session.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-gray-500">
              {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} / {total}건
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 상세 다이얼로그 */}
      <LevelTestDetailDialog
        sessionId={selectedSessionId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
