'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, User, Shield } from 'lucide-react';
import { getAllPermissionsGrouped, getCategoryName } from '@/lib/permissions';

interface PermissionWithStatus {
  id: string;
  name: string;
  description: string | null;
  hasPermission: boolean;
}

interface CategoryPermissions {
  category: string;
  permissions: PermissionWithStatus[];
}

export function UserPermissionButton() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [permissions, setPermissions] = useState<CategoryPermissions[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadPermissions();
    }
  }, [isOpen, user]);

  const loadPermissions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getAllPermissionsGrouped(user.role_id);
      setPermissions(data);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <User className="h-4 w-4" />
        <span className="hidden md:inline">{user.email}</span>
        <Badge variant="secondary" className="ml-2">
          {user.role_name}
        </Badge>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              사용자 정보 및 권한
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 사용자 정보 */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">이메일</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">이름</p>
                  <p className="font-medium">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">역할</p>
                  <Badge variant="secondary">{user.role_name}</Badge>
                </div>
                {user.academy_name && (
                  <div>
                    <p className="text-sm text-gray-500">학원</p>
                    <p className="font-medium">{user.academy_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 권한 목록 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">보유 권한</h3>
              
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  권한 정보를 불러오는 중...
                </div>
              ) : permissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  권한 정보가 없습니다
                </div>
              ) : (
                <div className="space-y-4">
                  {permissions.map(({ category, permissions: perms }) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-gray-700">
                        {getCategoryName(category)}
                      </h4>
                      <div className="space-y-2">
                        {perms.map(perm => (
                          <div
                            key={perm.id}
                            className={`flex items-center justify-between p-2 rounded ${
                              perm.hasPermission
                                ? 'bg-green-50'
                                : 'bg-gray-50 opacity-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {perm.hasPermission ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <X className="h-4 w-4 text-gray-400" />
                              )}
                              <div>
                                <p className={`text-sm ${
                                  perm.hasPermission ? 'font-medium' : 'text-gray-500'
                                }`}>
                                  {perm.name}
                                </p>
                                {perm.description && (
                                  <p className="text-xs text-gray-500">
                                    {perm.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

