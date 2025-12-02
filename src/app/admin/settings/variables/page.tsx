import { AdminLayout } from '@/components/layout/AdminLayout';
import { VariablesManagement } from '@/components/admin/VariablesManagement';

export default function VariablesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">변수 관리</h1>
          <p className="text-gray-600">시스템 변수를 관리할 수 있습니다.</p>
        </div>

        {/* 변수 관리 컴포넌트 */}
        <VariablesManagement />
      </div>
    </AdminLayout>
  );
}

