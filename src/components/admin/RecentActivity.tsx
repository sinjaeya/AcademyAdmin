'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, UserPlus, BookOpen, UserCheck, PlayCircle, CheckCircle2 } from 'lucide-react';

interface DashboardData {
  role: 'admin' | 'academy_owner' | 'teacher';
  academyCount?: number;
  students?: {
    total: number;
    active: number;
    paused: number;
    terminated: number;
  };
  todayAttendance?: number;
  payments?: {
    totalAmount: number;
    count: number;
  };
  sessions?: {
    total: number;
    byType: Record<string, number>;
  };
  activeSessions?: number;
  completedSessions?: number;
  recentStudents?: Array<{
    id: number;
    name: string;
    grade: string;
    school: string;
    academy_name?: string;
    created_at: string;
  }>;
}

// 날짜를 상대적 시간 문자열로 변환
function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export function RecentActivity({ data }: { data: DashboardData }) {
  // admin, academy_owner → 최근 등록 학생
  if (data.role === 'admin' || data.role === 'academy_owner') {
    const students = data.recentStudents || [];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            최근 등록 학생
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">등록된 학생이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.id} className="flex items-start space-x-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{student.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {student.grade}
                      </Badge>
                      {data.role === 'admin' && student.academy_name && (
                        <Badge variant="outline" className="text-xs">
                          {student.academy_name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {student.school || '학교 미등록'}
                    </p>
                    <p className="text-xs text-gray-400">{getRelativeTime(student.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // teacher → 오늘 학습 요약
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          오늘 학습 요약
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-blue-100 p-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">오늘 출석</p>
              <p className="text-sm text-gray-600">{data.todayAttendance || 0}명 등원</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-green-100 p-2">
              <PlayCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">진행중 세션</p>
              <p className="text-sm text-gray-600">{data.activeSessions || 0}건 학습 중</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-purple-100 p-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">완료 세션</p>
              <p className="text-sm text-gray-600">{data.completedSessions || 0}건 완료</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
