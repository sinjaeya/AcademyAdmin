'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PassagesManagementPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">지문관리</h1>
            <p className="mt-1 text-gray-600">학습 콘텐츠 지문을 등록하고 관리합니다.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>지문 관리 기능 준비 중</CardTitle>
            <CardDescription>여기에 지문 목록, 검색, 등록 기능 등을 구현하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* TODO: 지문 관리 UI를 구현하세요 */}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

