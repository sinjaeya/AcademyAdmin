'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface RecommendedTopic {
    id: string;
    topic: string;
    grade_level: string;
    difficulty: string;
    evaluation_score: number;
    reason: string;
    output_file: string;
    created_at: string;
}

export default function RagRecommendedTopicsPage() {
    const [data, setData] = useState<RecommendedTopic[]>([]);
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
            const res = await fetch(`/api/admin/rag/recommended-topics?page=${page}&limit=20`);
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
                    <h1 className="text-3xl font-bold text-gray-900">추천 주제 관리</h1>
                    <p className="mt-1 text-gray-600">RAG 기반으로 생성된 추천 학습 주제입니다.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>추천 주제 목록 (총 {totalCount}개)</CardTitle>
                        <CardDescription>생성된 추천 주제의 상세 정보를 보여줍니다.</CardDescription>
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
                                            <TableHead>주제</TableHead>
                                            <TableHead>학년</TableHead>
                                            <TableHead>난이도</TableHead>
                                            <TableHead>점수</TableHead>
                                            <TableHead className="w-[300px]">이유</TableHead>
                                            <TableHead>결과파일</TableHead>
                                            <TableHead>생성일</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.topic}</TableCell>
                                                <TableCell>{item.grade_level}</TableCell>
                                                <TableCell>{item.difficulty}</TableCell>
                                                <TableCell>
                                                    <Badge variant={item.evaluation_score >= 80 ? 'default' : 'secondary'}>
                                                        {item.evaluation_score}점
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600 truncate max-w-[300px]" title={item.reason}>
                                                    {item.reason}
                                                </TableCell>
                                                <TableCell className="text-xs">{item.output_file || '-'}</TableCell>
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
