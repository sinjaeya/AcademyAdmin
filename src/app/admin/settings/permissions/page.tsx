'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getCategoryName } from '@/lib/permissions';
import type { Role, Permission } from '@/types';

interface PermissionsData {
  roles: Role[];
  permissions: Permission[];
  rolePermissions: Record<string, string[]>;
}

export default function PermissionsManagementPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [data, setData] = useState<PermissionsData | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 권한 체크 - admin만 접근 가능
  useEffect(() => {
    if (user && user.role_id !== 'admin') {
      router.push('/admin');
    }
  }, [user, router]);

  // 데이터 로드
  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/permissions');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setRolePermissions(result.data.rolePermissions);
      } else {
        showAlert('error', result.error || '데이터를 불러오는데 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
      showAlert('error', '데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (roleId: string, permissionId: string) => {
    setRolePermissions(prev => {
      const current = prev[roleId] || [];
      const newPermissions = current.includes(permissionId)
        ? current.filter(p => p !== permissionId)
        : [...current, permissionId];
      
      return {
        ...prev,
        [roleId]: newPermissions
      };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolePermissions })
      });

      const result = await response.json();

      if (result.success) {
        showAlert('success', '권한이 성공적으로 저장되었습니다');
        // 데이터 다시 로드
        await loadPermissions();
      } else {
        showAlert('error', result.error || '권한 저장에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to save permissions:', error);
      showAlert('error', '권한 저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // 권한을 카테고리별로 그룹화
  const groupedPermissions = data?.permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>) || {};

  if (!user || user.role_id !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">권한 관리</h1>
            <p className="text-gray-500 mt-1">역할별 권한을 설정하고 관리합니다</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>

      {/* 알림 */}
      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
          {alert.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* 권한 매트릭스 */}
      <Card>
        <CardHeader>
          <CardTitle>역할별 권한 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left p-4 font-semibold">권한</th>
                  {data?.roles.map(role => (
                    <th key={role.id} className="text-center p-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold">{role.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          Level {role.level}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <React.Fragment key={category}>
                    {/* 카테고리 헤더 */}
                    <tr className="bg-gray-50">
                      <td
                        colSpan={data!.roles.length + 1}
                        className="p-3 font-semibold text-gray-700"
                      >
                        {getCategoryName(category)}
                      </td>
                    </tr>
                    
                    {/* 권한 행 */}
                    {perms.map(permission => (
                      <tr
                        key={permission.id}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{permission.name}</div>
                            {permission.description && (
                              <div className="text-sm text-gray-500">
                                {permission.description}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {data?.roles.map(role => {
                          const hasPermission = rolePermissions[role.id]?.includes(permission.id) || false;
                          
                          return (
                            <td
                              key={role.id}
                              className={`text-center p-4 ${
                                hasPermission ? 'bg-green-50' : ''
                              }`}
                            >
                              <label className="flex items-center justify-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={hasPermission}
                                  onChange={() => handleToggle(role.id, permission.id)}
                                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                />
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">권한 변경 시 주의사항</p>
            <ul className="list-disc list-inside space-y-1">
              <li>권한 변경은 즉시 적용되지 않습니다. 반드시 "저장" 버튼을 클릭하세요.</li>
              <li>변경 사항은 사용자가 다음 로그인 시 또는 페이지 새로고침 시 반영됩니다.</li>
              <li>시스템 관리자(admin) 역할의 권한을 제거하지 마세요.</li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
