import { AdminLayout } from '@/components/layout/AdminLayout';

export default function MathLearningManagement() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">수학 학습관리</h1>
          <p className="text-gray-600 mt-1">수학 학습 관리를 위한 페이지입니다</p>
        </div>
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500">수학 학습 관리 기능이 개발 중입니다</p>
        </div>
      </div>
    </AdminLayout>
  );
}

