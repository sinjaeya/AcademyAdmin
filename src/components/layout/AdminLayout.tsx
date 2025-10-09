'use client';

import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        {/* 사이드바 - 항상 표시 */}
        <div className="w-56 flex-shrink-0">
          <AdminSidebar />
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* 헤더 */}
          <AdminHeader />

          {/* 페이지 콘텐츠 */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
