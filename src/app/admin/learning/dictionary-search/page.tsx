'use client';

import { useState, useCallback, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 검색 로그 항목 타입
interface DictionarySearchLog {
  id: number;
  query: string;
  searched_at: string;
  student: {
    id: number;
    name: string;
  } | null;
}

// 학생 드롭다운용 타입
interface StudentOption {
  id: number;
  name: string;
}

// 시간 포맷 함수 (KST 기준)
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export default function DictionarySearchPage() {
  const { academyId } = useAuthStore();

  // 필터 상태
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // 데이터 상태
  const [logs, setLogs] = useState<DictionarySearchLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);

  // 학생 목록 로드
  useEffect(() => {
    if (!academyId) return;

    const loadStudents = async () => {
      try {
        const res = await fetch(`/api/admin/students?academy_id=${academyId}&status=재원`);
        const result = await res.json();
        if (result.data) {
          setStudents(
            (result.data as { id: number; name: string }[]).map((s) => ({
              id: s.id,
              name: s.name
            }))
          );
        }
      } catch (err) {
        console.error('학생 목록 로드 실패:', err);
      }
    };

    loadStudents();
  }, [academyId]);

  // 검색기록 조회 함수
  const fetchLogs = useCallback(
    async (currentPage: number, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(currentPage) });
        if (search) params.set('search', search);
        if (selectedStudentId) params.set('student_id', selectedStudentId);
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);

        const res = await fetch(`/api/admin/learning/dictionary-search?${params.toString()}`);
        const result = await res.json();

        if (result.success) {
          setLogs((prev) =>
            append ? [...prev, ...result.data] : result.data
          );
          setTotal(result.total);
          setPage(currentPage);
        }
      } catch (err) {
        console.error('사전 검색기록 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    },
    [search, selectedStudentId, dateFrom, dateTo]
  );

  // 최초 로드
  useEffect(() => {
    fetchLogs(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 조회 버튼 클릭
  const handleSearch = () => {
    fetchLogs(1, false);
  };

  // 더보기 버튼 클릭
  const handleLoadMore = () => {
    fetchLogs(page + 1, true);
  };

  const hasMore = logs.length < total;

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-4">
          {/* 페이지 헤더 */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">사전 검색기록</h1>
            <p className="text-gray-600 text-sm">학생들의 한글사전 검색 이력을 확인합니다</p>
          </div>

          {/* 필터 영역 */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">검색어</label>
              <Input
                type="text"
                placeholder="검색어 입력..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-48"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">학생</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm w-36 cursor-pointer"
              >
                <option value="">전체 학생</option>
                {students.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">시작일</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">종료일</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm cursor-pointer"
              />
            </div>

            <Button onClick={handleSearch} disabled={loading} className="cursor-pointer">
              {loading ? '조회 중...' : '조회'}
            </Button>
          </div>

          {/* 결과 요약 */}
          <div className="text-sm text-gray-500">
            총 <span className="font-semibold text-gray-700">{total.toLocaleString()}</span>건
          </div>

          {/* 테이블 */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">시간</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">학생</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">검색어</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(log.searched_at)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {log.student?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3">{log.query}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 더보기 버튼 */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
                className="cursor-pointer"
              >
                {loading ? '불러오는 중...' : `더보기 (${logs.length} / ${total}건)`}
              </Button>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
