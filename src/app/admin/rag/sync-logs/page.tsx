'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface SyncLog {
    id: string;
    action: string;
    status: string;
    error_message: string;
    created_at: string;
}

export default function RagSyncLogsPage() {
    const [data, setData] = useState<SyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage]);

    const fetchData = async (page: number) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/rag/sync-logs?page=${page}&limit=20`);
            const result = await res.json();

            if (result.data) {
                setData(result.data);
                setTotalPages(result.totalPages);
                setTotalCount(result.count);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">동기화 로그</h1>
                    <p className="mt-1 text-gray-600">파일 동기화 및 처리 작업 이력입니다.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>작업 로그 (총 {totalCount}건)</CardTitle>
                        <CardDescription>시스템 백그라운드 작업의 성공/실패 여부를 확인합니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="py-10 text-center">로딩 중...</div>
                        ) : data.length === 0 ? (
                            <div className="py-10 text-center text-gray-500">데이터가 없습니다.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>작업</TableHead>
                                            <TableHead>상태</TableHead>
                                            <TableHead className="w-[400px]">메시지</TableHead>
                                            <TableHead>생성일</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.action}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={item.status === 'success' ? 'default' : item.status === 'error' ? 'destructive' : 'secondary'}
                                                    >
                                                        {item.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600 truncate max-w-[400px]" title={item.error_message}>
                                                    {item.error_message || '-'}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm') : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <div className="flex items-center justify-center space-x-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || loading}
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
                                disabled={currentPage === totalPages || loading}
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
