'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface RagFile {
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    level: string;
    grade: number;
    content_type: string;
    source: string;
    token_count: number;
    created_at: string;
}

export default function RagFilesPage() {
    const [data, setData] = useState<RagFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    // 필터 상태
    const [filterLevel, setFilterLevel] = useState<string>('all');
    const [filterGrade, setFilterGrade] = useState<string>('all');

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage, filterLevel, filterGrade]);

    const fetchData = async (page: number) => {
        try {
            setLoading(true);
            // 필터 파라미터 구성
            let url = `/api/admin/rag/files?page=${page}&limit=20`;
            if (filterLevel !== 'all') {
                url += `&level=${filterLevel}`;
            }
            if (filterGrade !== 'all') {
                url += `&grade=${filterGrade}`;
            }

            const res = await fetch(url);
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

    // 필터 변경 시 페이지를 1로 리셋
    const handleLevelChange = (value: string) => {
        setFilterLevel(value);
        setCurrentPage(1);
    };

    const handleGradeChange = (value: string) => {
        setFilterGrade(value);
        setCurrentPage(1);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">RAG 파일 관리</h1>
                    <p className="mt-1 text-gray-600">RAG 시스템에 활용되는 파일 목록입니다.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>파일 목록 (총 {totalCount}개)</CardTitle>
                        <CardDescription>업로드된 문서 파일들을 보여줍니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* 필터 영역 */}
                        <div className="flex gap-4 mb-6">
                            <div className="w-40">
                                <Select value={filterLevel} onValueChange={handleLevelChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="레벨 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">교과전체</SelectItem>
                                        <SelectItem value="중등">중등</SelectItem>
                                        <SelectItem value="고등">고등</SelectItem>
                                        <SelectItem value="공통">공통</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-40">
                                <Select value={filterGrade} onValueChange={handleGradeChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="학년 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">학년전체</SelectItem>
                                        <SelectItem value="0">0학년</SelectItem>
                                        <SelectItem value="1">1학년</SelectItem>
                                        <SelectItem value="2">2학년</SelectItem>
                                        <SelectItem value="3">3학년</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-10 text-center">로딩 중...</div>
                        ) : data.length === 0 ? (
                            <div className="py-10 text-center text-gray-500">데이터가 없습니다.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>파일명</TableHead>
                                            <TableHead>레벨</TableHead>
                                            <TableHead>학년</TableHead>
                                            <TableHead>타입</TableHead>
                                            <TableHead>출판사</TableHead>
                                            <TableHead>토큰수</TableHead>
                                            <TableHead>생성일</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.file_name}</TableCell>
                                                <TableCell>{item.level}</TableCell>
                                                <TableCell>{item.grade}학년</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{item.content_type}</Badge>
                                                </TableCell>
                                                <TableCell>{item.source ?? '-'}</TableCell>
                                                <TableCell>{item.token_count?.toLocaleString() ?? '-'}</TableCell>
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
