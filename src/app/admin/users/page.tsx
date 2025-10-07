import { AdminLayout } from '@/components/layout/AdminLayout';
import { UsersTable } from '@/components/admin/UsersTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function UsersPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
            <p className="text-gray-600">사용자 계정을 관리하고 권한을 설정합니다</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            새 사용자 추가
          </Button>
        </div>

        {/* 사용자 테이블 */}
        <UsersTable />
      </div>
    </AdminLayout>
  );
}
