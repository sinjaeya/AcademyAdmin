'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { CheckInOutTable } from '@/components/admin/CheckInOutTable';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function CheckInOutPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    // 테이블 새로고침 로직은 CheckInOutTable 컴포넌트에서 처리
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">등/하원 조회</h1>
            <p className="text-gray-600">등/하원 기록을 조회하고 관리합니다</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </div>

        {/* 등/하원 조회 테이블 */}
        <CheckInOutTable isLoading={isLoading} />
      </div>
    </AdminLayout>
  );
}
