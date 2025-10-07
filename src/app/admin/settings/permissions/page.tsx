'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Shield, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';

// 권한 데이터 타입 정의
interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface UserPermission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  permissions: Permission[];
  lastUpdated: string;
}

// 더미 데이터
const mockPermissions: Permission[] = [
  { id: '1', name: '사용자 조회', description: '사용자 목록을 조회할 수 있습니다', resource: 'users', action: 'read' },
  { id: '2', name: '사용자 생성', description: '새 사용자를 생성할 수 있습니다', resource: 'users', action: 'create' },
  { id: '3', name: '사용자 수정', description: '사용자 정보를 수정할 수 있습니다', resource: 'users', action: 'update' },
  { id: '4', name: '사용자 삭제', description: '사용자를 삭제할 수 있습니다', resource: 'users', action: 'delete' },
  { id: '5', name: '등/하원 조회', description: '등/하원 기록을 조회할 수 있습니다', resource: 'checkinout', action: 'read' },
  { id: '6', name: '등/하원 생성', description: '등/하원 기록을 생성할 수 있습니다', resource: 'checkinout', action: 'create' },
  { id: '7', name: '통계 조회', description: '통계 데이터를 조회할 수 있습니다', resource: 'analytics', action: 'read' },
  { id: '8', name: '시스템 설정', description: '시스템 설정을 변경할 수 있습니다', resource: 'settings', action: 'update' },
];

const mockUserPermissions: UserPermission[] = [
  {
    id: '1',
    userId: 'user1',
    userName: '김관리자',
    userEmail: 'admin@example.com',
    role: '관리자',
    permissions: mockPermissions,
    lastUpdated: '2024-01-15 14:30:00'
  },
  {
    id: '2',
    userId: 'user2',
    userName: '이선생님',
    userEmail: 'teacher@example.com',
    role: '선생님',
    permissions: mockPermissions.filter(p => ['users', 'checkinout'].includes(p.resource) && p.action === 'read'),
    lastUpdated: '2024-01-15 10:15:00'
  },
  {
    id: '3',
    userId: 'user3',
    userName: '박직원',
    userEmail: 'staff@example.com',
    role: '직원',
    permissions: mockPermissions.filter(p => p.resource === 'checkinout'),
    lastUpdated: '2024-01-14 16:45:00'
  }
];

export default function PermissionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>(mockUserPermissions);

  const filteredUsers = userPermissions.filter(user => {
    const matchesSearch = user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case '관리자': return 'destructive';
      case '선생님': return 'default';
      case '직원': return 'secondary';
      default: return 'outline';
    }
  };

  const handlePermissionToggle = (userId: string, permissionId: string) => {
    setUserPermissions(prev => prev.map(user => {
      if (user.userId === userId) {
        const hasPermission = user.permissions.some(p => p.id === permissionId);
        const permission = mockPermissions.find(p => p.id === permissionId);
        
        if (hasPermission) {
          return {
            ...user,
            permissions: user.permissions.filter(p => p.id !== permissionId),
            lastUpdated: new Date().toLocaleString('ko-KR')
          };
        } else if (permission) {
          return {
            ...user,
            permissions: [...user.permissions, permission],
            lastUpdated: new Date().toLocaleString('ko-KR')
          };
        }
      }
      return user;
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">사용자 권한 관리</h1>
          <p className="text-gray-600 mt-2">사용자별 권한을 설정하고 관리합니다</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          새 사용자 추가
        </Button>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            검색 및 필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">사용자 검색</Label>
              <Input
                id="search"
                placeholder="이름 또는 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="role">역할 필터</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="관리자">관리자</SelectItem>
                  <SelectItem value="선생님">선생님</SelectItem>
                  <SelectItem value="직원">직원</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                필터 초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 권한 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            사용자 권한 목록
          </CardTitle>
          <CardDescription>
            총 {filteredUsers.length}명의 사용자가 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead>마지막 수정</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.userName}</div>
                        <div className="text-sm text-gray-500">{user.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.map((permission) => (
                          <Badge key={permission.id} variant="outline" className="text-xs">
                            {permission.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {user.lastUpdated}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 권한 상세 관리 */}
      <Card>
        <CardHeader>
          <CardTitle>권한 상세 관리</CardTitle>
          <CardDescription>
            각 사용자의 세부 권한을 설정할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">{user.userName}</h3>
                    <p className="text-sm text-gray-500">{user.userEmail}</p>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {mockPermissions.map((permission) => {
                    const hasPermission = user.permissions.some(p => p.id === permission.id);
                    return (
                      <div
                        key={permission.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          hasPermission 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handlePermissionToggle(user.userId, permission.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{permission.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {permission.description}
                            </div>
                          </div>
                          <div className="ml-2">
                            {hasPermission ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
