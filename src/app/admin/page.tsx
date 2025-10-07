'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { QuickActions } from '@/components/admin/QuickActions';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/toast';
import { Card } from '@/components/ui/card';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600">관리자 패널에 오신 것을 환영합니다</p>
        </div>

        {/* 디버깅 정보 - 항상 표시 */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-2">🔍 디버깅 정보</div>
            <div className="space-y-1">
              <div>인증 상태 : {isAuthenticated ? '인증됨' : '인증되지 않음'}</div>
              {user ? (
                <>
                  <div>사용자 ID : {user.email}</div>
                  <div>사용자 이름 : {user.name || '이름 없음'}</div>
                  <div>사용자 역할 : {user.role || '역할 없음'}</div>
                </>
              ) : (
                <div className="text-red-600">⚠️ 사용자 정보가 없습니다</div>
              )}
            </div>
          </div>
        </Card>

        {/* 통계 카드 */}
        <DashboardStats />

        {/* 빠른 액션 및 최근 활동 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </AdminLayout>
  );
}
