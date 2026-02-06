'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  GraduationCap,
  Building2,
  DollarSign,
  BookOpen,
  UserCheck,
  PlayCircle,
  CheckCircle2
} from 'lucide-react';

// DashboardContent에서 전달받는 타입과 동일
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

interface StatCard {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; // tailwind bg color for icon container
}

function formatAmount(amount: number): string {
  if (amount >= 10000) {
    return `${Math.floor(amount / 10000).toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

function getStatsForRole(data: DashboardData): StatCard[] {
  if (data.role === 'admin') {
    return [
      {
        title: '전체 학원',
        value: `${data.academyCount || 0}개`,
        subtitle: '활성 학원',
        icon: Building2,
        color: 'bg-blue-100 text-blue-600',
      },
      {
        title: '전체 학생',
        value: `${data.students?.active || 0}명`,
        subtitle: `재원 ${data.students?.active || 0} / 휴원 ${data.students?.paused || 0} / 해지 ${data.students?.terminated || 0}`,
        icon: GraduationCap,
        color: 'bg-green-100 text-green-600',
      },
      {
        title: '이번 달 수납',
        value: formatAmount(data.payments?.totalAmount || 0),
        subtitle: `${data.payments?.count || 0}건`,
        icon: DollarSign,
        color: 'bg-yellow-100 text-yellow-600',
      },
      {
        title: '오늘 학습 세션',
        value: `${data.sessions?.total || 0}건`,
        subtitle: Object.entries(data.sessions?.byType || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || '세션 없음',
        icon: BookOpen,
        color: 'bg-purple-100 text-purple-600',
      },
    ];
  }

  if (data.role === 'academy_owner') {
    return [
      {
        title: '재원 학생',
        value: `${data.students?.active || 0}명`,
        subtitle: `휴원 ${data.students?.paused || 0} / 해지 ${data.students?.terminated || 0}`,
        icon: GraduationCap,
        color: 'bg-blue-100 text-blue-600',
      },
      {
        title: '오늘 출석',
        value: `${data.todayAttendance || 0}명`,
        subtitle: '등원 학생',
        icon: UserCheck,
        color: 'bg-green-100 text-green-600',
      },
      {
        title: '이번 달 수납',
        value: formatAmount(data.payments?.totalAmount || 0),
        subtitle: `${data.payments?.count || 0}건`,
        icon: DollarSign,
        color: 'bg-yellow-100 text-yellow-600',
      },
      {
        title: '오늘 학습 세션',
        value: `${data.sessions?.total || 0}건`,
        subtitle: Object.entries(data.sessions?.byType || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || '세션 없음',
        icon: BookOpen,
        color: 'bg-purple-100 text-purple-600',
      },
    ];
  }

  // teacher
  return [
    {
      title: '오늘 출석',
      value: `${data.todayAttendance || 0}명`,
      subtitle: '등원 학생',
      icon: UserCheck,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: '학습 진행중',
      value: `${data.activeSessions || 0}건`,
      subtitle: '현재 활성 세션',
      icon: PlayCircle,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: '학습 완료',
      value: `${data.completedSessions || 0}건`,
      subtitle: '오늘 완료',
      icon: CheckCircle2,
      color: 'bg-purple-100 text-purple-600',
    },
  ];
}

export function DashboardStats({ data }: { data: DashboardData }) {
  const stats = getStatsForRole(data);

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${stats.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
