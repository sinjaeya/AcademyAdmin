import { AdminLayout } from '@/components/layout/AdminLayout';
import { AcademyManagementServer } from '@/components/admin/AcademyManagementServer';

export default async function AcademyPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">학원관리</h1>
          <p className="text-gray-600">학원 정보를 관리하고 설정할 수 있습니다.</p>
        </div>

        {/* 학원 관리 컴포넌트 */}
        <AcademyManagementServer />
      </div>
    </AdminLayout>
  );
}
