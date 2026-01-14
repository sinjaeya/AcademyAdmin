import { AdminLayout } from '@/components/layout/AdminLayout';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { QuickActions } from '@/components/admin/QuickActions';
import { getServerUserContext } from '@/lib/auth/server-context';

export default async function AdminDashboard() {
  // 서버에서 사용자 컨텍스트 가져오기
  const userContext = await getServerUserContext();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600">
            {userContext?.academy?.name ? `${userContext.academy.name} 관리자 패널` : '관리자 패널에 오신 것을 환영합니다'}
          </p>
        </div>

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
