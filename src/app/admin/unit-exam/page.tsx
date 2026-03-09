'use client';

import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ListChecks } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth';
import { UnitExamDetailDialog } from '@/components/admin/UnitExamDetailDialog';

// 단원평가 학생 항목 타입
interface ExamStudent {
  id: number;
  name: string;
  grade: string;
  textbooks: { textbook_id: string; label: string }[];
  sessionCount: number;
  averageScore: number;
}

export default function UnitExamPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [students, setStudents] = useState<ExamStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: number; name: string } | null>(null);
  const [selectedTextbook, setSelectedTextbook] = useState<{ textbook_id: string; label: string } | null>(null);

  // 단원평가 학생 목록 조회
  useEffect(() => {
    if (!user?.academy_id) return;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/unit-exam?academy_id=${user.academy_id}`);
        const result = await res.json();

        if (result.success) {
          setStudents(result.data);
        } else {
          toastRef.current({ title: '오류', description: result.error, type: 'error' });
        }
      } catch {
        toastRef.current({ title: '오류', description: '단원평가 데이터를 불러오지 못했습니다.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user?.academy_id]);

  // 교재 뱃지 클릭: 학생 + 교재 선택 후 다이얼로그 열기
  const handleTextbookClick = (
    student: ExamStudent,
    tb: { textbook_id: string; label: string }
  ) => {
    setSelectedStudent({ id: student.id, name: student.name });
    setSelectedTextbook(tb);
    setDialogOpen(true);
  };

  // 클라이언트 사이드 학생명 검색 필터
  const filteredStudents = students.filter((s) =>
    s.name.includes(searchTerm)
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">단원평가 관리</h1>
          </div>

          {/* 학생 검색 */}
          <Input
            placeholder="학생 이름 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-52 h-9 text-sm"
          />
        </div>

        {/* 학생 목록 테이블 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">학생명</TableHead>
                  <TableHead>과목-교재</TableHead>
                  <TableHead className="w-[100px]">응시 횟수</TableHead>
                  <TableHead className="w-[90px]">평균 점수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-gray-400 text-sm">
                      불러오는 중...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-gray-400 text-sm">
                      {searchTerm
                        ? `"${searchTerm}"에 해당하는 학생이 없습니다.`
                        : '단원평가 데이터가 없습니다.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      {/* 학생명 + 학년 */}
                      <TableCell className="text-sm font-medium">
                        <div>{student.name}</div>
                        {student.grade && (
                          <div className="text-xs text-gray-400">{student.grade}</div>
                        )}
                      </TableCell>

                      {/* 교재 뱃지 목록 */}
                      <TableCell>
                        {student.textbooks.length === 0 ? (
                          <span className="text-xs text-gray-400">미매핑</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {student.textbooks.map((tb) => (
                              <Badge
                                key={tb.textbook_id}
                                variant="outline"
                                className="cursor-pointer text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                onClick={() => handleTextbookClick(student, tb)}
                              >
                                {tb.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>

                      {/* 응시 횟수 */}
                      <TableCell className="text-sm text-gray-700">
                        {student.sessionCount}회
                      </TableCell>

                      {/* 평균 점수 — 80점 미만 주황, 이상 녹색 */}
                      <TableCell className="text-sm font-semibold">
                        {student.sessionCount > 0 ? (
                          <span
                            className={
                              student.averageScore < 80 ? 'text-orange-500' : 'text-green-600'
                            }
                          >
                            {student.averageScore}점
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 단원평가 상세 다이얼로그 */}
      {selectedStudent && selectedTextbook && (
        <UnitExamDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          textbookId={selectedTextbook.textbook_id}
          textbookLabel={selectedTextbook.label}
        />
      )}
    </AdminLayout>
  );
}
