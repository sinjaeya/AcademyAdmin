import { AdminLayout } from '@/components/layout/AdminLayout';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { QuickActions } from '@/components/admin/QuickActions';
import { Card } from '@/components/ui/card';
import { getServerUserContext, getServerAcademyId, isServerUserAdmin } from '@/lib/auth/server-context';
import { getAcademyStats } from '@/lib/db/academy-queries';

export default async function AdminDashboard() {
  // 서버에서 사용자 컨텍스트 가져오기
  const userContext = await getServerUserContext();
  const academyId = await getServerAcademyId();
  const isAdmin = await isServerUserAdmin();
  
  // 학원 통계 데이터 가져오기
  const academyStats = await getAcademyStats();

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

        {/* 학원 정보 및 사용자 정보 디버깅 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-2">🏫 학원 정보</div>
              <div className="space-y-1">
                <div>학원 ID: {academyId || '없음'}</div>
                <div>학원명: {userContext?.academy?.name || '없음'}</div>
                <div>관리자 권한: {isAdmin ? '있음' : '없음'}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="text-sm text-green-800">
              <div className="font-medium mb-2">👤 사용자 정보</div>
              <div className="space-y-1">
                {userContext ? (
                  <>
                    <div>사용자 ID: {userContext.user.id}</div>
                    <div>역할: {userContext.user.role || '없음'}</div>
                    <div>활성 상태: {userContext.user.user_role?.is_active ? '활성' : '비활성'}</div>
                  </>
                ) : (
                  <div className="text-red-600">⚠️ 사용자 정보가 없습니다</div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* 학원 통계 정보 */}
        {academyStats && (
          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="text-sm text-purple-800">
              <div className="font-medium mb-2">📊 학원 통계</div>
              <div className="grid grid-cols-2 gap-4">
                <div>총 사용자 수: {academyStats.totalUsers}명</div>
                <div>총 선생님 수: {academyStats.totalTeachers}명</div>
                <div>총 학생 수: {academyStats.totalStudents}명</div>
                <div>총 결제 건수: {academyStats.totalPayments}건</div>
              </div>
            </div>
          </Card>
        )}

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
