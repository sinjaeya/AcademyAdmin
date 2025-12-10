import { AdminLayout } from '@/components/layout/AdminLayout';
import { AcademyManagementServer } from '@/components/admin/AcademyManagementServer';

export default async function AcademyPage() {
  return (
    <AdminLayout>
      <AcademyManagementServer />
    </AdminLayout>
  );
}
