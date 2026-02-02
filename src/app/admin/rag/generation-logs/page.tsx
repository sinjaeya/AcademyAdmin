'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface GenerationLog {
    id: string;
    prompt: string;
    response: string;
    used_tokens: number;
    model_version: string;
    created_at: string;
}

export default function RagGenerationLogsPage() {
    const [data, setData] = useState<GenerationLog[]>([]);
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
            const res = await fetch(`/api/admin/rag/generation-logs?page=${page}&limit=20`);
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
                    <h1 className="text-3xl font-bold text-gray-900">RAG 로그 보기</h1>
                    <p className="mt-1 text-gray-600">LLM 생성 요청 및 응답 이력입니다.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>생성 로그 (총 {totalCount}건)</CardTitle>
                        <CardDescription>RAG 시스템의 질의응답 내역을 확인합니다.</CardDescription>
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
                                            <TableHead className="w-[300px]">프롬프트</TableHead>
                                            <TableHead className="w-[300px]">응답</TableHead>
                                            <TableHead>토큰</TableHead>
                                            <TableHead>모델</TableHead>
                                            <TableHead>생성일</TableHead>
                                            <TableHead className="w-[80px]">상세</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="truncate max-w-[300px]" title={item.prompt}>
                                                    {item.prompt}
                                                </TableCell>
                                                <TableCell className="truncate max-w-[300px]" title={item.response}>
                                                    {item.response}
                                                </TableCell>
                                                <TableCell>{item.used_tokens?.toLocaleString() ?? '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{item.model_version}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm') : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm">보기</Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>로그 상세</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <h3 className="font-semibold mb-2">프롬프트</h3>
                                                                    <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap text-sm">
                                                                        {item.prompt}
                                                                    </pre>
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-semibold mb-2">응답</h3>
                                                                    <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap text-sm">
                                                                        {item.response}
                                                                    </pre>
                                                                </div>
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
