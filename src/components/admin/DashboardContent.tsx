'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { DashboardStats } from './DashboardStats';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { Loader2 } from 'lucide-react';

// API 응답 타입 정의
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

export function DashboardContent() {
  const { user, academyName } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/dashboard');
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || '데이터를 불러오지 못했습니다.');
        }
      } catch {
        setError('네트워크 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // 역할별 인사말
  const greeting = academyName ? `${academyName} 관리자 패널` : '관리자 패널에 오신 것을 환영합니다';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600">{greeting}</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600">{greeting}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600">{greeting}</p>
      </div>

      {/* 통계 카드 */}
      {data && <DashboardStats data={data} />}

      {/* 빠른 액션 및 최근 활동 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {data && <QuickActions role={data.role} />}
        {data && <RecentActivity data={data} />}
      </div>
    </div>
  );
}
