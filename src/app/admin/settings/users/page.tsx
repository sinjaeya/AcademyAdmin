'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
// Supabase 클라이언트 직접 사용 제거 - 서버 사이드 API 사용
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';

// 사용자 데이터 타입 정의 (admin_users + roles 조인)
interface User {
  id: string;
  email: string;
  name: string;
  role_id: string;
  role_name: string;  // roles 테이블에서 조인
  academy_id: string | null;
  academy_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 새 사용자 추가 폼 데이터 타입
interface NewUserForm {
  email: string;
  password: string;
  name: string;
  role_id: string;
  academy_id?: string | null;
  academy_name?: string | null;
}

// 역할 타입
interface Role {
  id: string;
  name: string;
}

// 데이터 포맷팅 함수
const formatDateTime = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};


export default function SettingsUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState<string>('');
  const [newUser, setNewUser] = useState<NewUserForm>({
    email: '',
    password: '',
    name: '',
    role_id: '',
    academy_id: null,
    academy_name: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [updateUserError, setUpdateUserError] = useState<string | null>(null);

  // 데이터 가져오기 - 서버 사이드 API 사용
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('사용자 목록을 가져오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Roles 목록 조회
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      if (!response.ok) {
        throw new Error('역할 목록을 가져오는데 실패했습니다.');
      }
      const result = await response.json();
      if (result.success && result.data?.roles) {
        setRoles(result.data.roles);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);


  const handleDeleteUser = async (userId: string) => {
    if (confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('사용자 삭제에 실패했습니다.');
        }

        // 성공적으로 삭제되면 목록에서 제거
        setUsers(prev => prev.filter(user => user.id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('사용자 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 새 사용자 추가 함수 - 서버 사이드 API 사용
  const handleAddUser = async () => {
    // 클라이언트 사이드 유효성 검증
    if (!newUser.email || !newUser.password || !newUser.name || !newUser.role_id) {
      alert('모든 필수 필드를 입력해주세요.');
      return;
    }

    if (newUser.password.length < 8) {
      alert('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      setAddUserError(null);
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser)
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || '사용자 추가에 실패했습니다.';
        setAddUserError(errorMessage);
        return;
      }

      // 성공적으로 추가되면 목록에 추가
      if (result.data) {
        setUsers(prev => [result.data, ...prev]);
        setNewUser({
          email: '',
          password: '',
          name: '',
          role_id: '',
          academy_id: null,
          academy_name: null
        });
        setAddUserError(null);
        setIsAddUserOpen(false);
      }
    } catch (err) {
      console.error('Error adding user:', err);
      const errorMessage = err instanceof Error ? err.message : '사용자 추가 중 오류가 발생했습니다.';
      setAddUserError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 폼 입력 핸들러
  const handleInputChange = (field: keyof NewUserForm, value: string) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 수정 버튼 클릭 핸들러
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditUserOpen(true);
  };

  // 사용자 수정 함수 - 서버 사이드 API 사용
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    // 클라이언트 사이드 유효성 검증
    if (!editingUser.email || !editingUser.name || !editingUser.role_id) {
      alert('모든 필수 필드를 입력해주세요.');
      return;
    }

    if (editPassword && editPassword.length < 8) {
      alert('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      setUpdateUserError(null);
      
      const updateData: any = {
        email: editingUser.email,
        name: editingUser.name,
        role_id: editingUser.role_id
      };

      // 비밀번호가 입력된 경우에만 포함
      if (editPassword) {
        updateData.password = editPassword;
      }

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || '사용자 수정에 실패했습니다.';
        setUpdateUserError(errorMessage);
        return;
      }

      // 성공적으로 수정되면 목록 업데이트
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id ? result.data : user
      ));
      
      setUpdateUserError(null);
      setIsEditUserOpen(false);
      setEditingUser(null);
      setEditPassword('');
    } catch (err) {
      console.error('Error updating user:', err);
      const errorMessage = err instanceof Error ? err.message : '사용자 수정 중 오류가 발생했습니다.';
      setUpdateUserError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 수정 중인 사용자 정보 변경 핸들러
  const handleEditInputChange = (field: keyof User, value: string) => {
    if (!editingUser) return;
    
    setEditingUser(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">사이트 사용자 관리</h1>
            <p className="text-gray-600 mt-2">어드민 사이트의 사용자를 관리하고 설정합니다</p>
          </div>
                  <Button 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setIsAddUserOpen(true)}
                  >
            <Plus className="h-4 w-4" />
            새 사용자 추가
          </Button>
        </div>


        {/* 사용자 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              어드민 사용자 목록
            </CardTitle>
            <CardDescription>
              총 {users.length}명의 사용자가 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchUsers}>다시 시도</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                            <TableRow>
                              <TableHead>이메일</TableHead>
                              <TableHead>이름</TableHead>
                              <TableHead>역할</TableHead>
                              <TableHead>학원</TableHead>
                              <TableHead>상태</TableHead>
                              <TableHead>생성일</TableHead>
                              <TableHead>수정일</TableHead>
                              <TableHead>액션</TableHead>
                            </TableRow>
                  </TableHeader>
                  <TableBody>
                        {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {user.email || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {user.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.role_name || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {user.academy_name || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? '활성' : '비활성'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDateTime(user.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDateTime(user.updated_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 새 사용자 추가 다이얼로그 */}
        <Dialog open={isAddUserOpen} onOpenChange={(open) => {
          setIsAddUserOpen(open);
          if (!open) {
            setAddUserError(null);
          }
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                새 사용자 추가
              </DialogTitle>
              <DialogDescription>
                새로운 관리자 사용자 정보를 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            
            {addUserError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>오류</AlertTitle>
                <AlertDescription>{addUserError}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호 *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="최소 8자 이상"
                />
                <p className="text-xs text-gray-500">최소 8자 이상 입력해주세요</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="사용자 이름을 입력하세요"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role_id">역할 *</Label>
                <Select
                  value={newUser.role_id}
                  onValueChange={(value) => handleInputChange('role_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="역할을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddUserOpen(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
                      <Button
                        onClick={handleAddUser}
                        disabled={isSubmitting || !newUser.email || !newUser.password || !newUser.name || !newUser.role_id || newUser.password.length < 8}
                      >
                {isSubmitting ? '추가 중...' : '추가'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 사용자 수정 다이얼로그 */}
        <Dialog open={isEditUserOpen} onOpenChange={(open) => {
          setIsEditUserOpen(open);
          if (!open) {
            setUpdateUserError(null);
            setEditingUser(null);
            setEditPassword('');
          }
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>사용자 수정</DialogTitle>
              <DialogDescription>
                사용자 정보를 수정하세요.
              </DialogDescription>
            </DialogHeader>
            
            {updateUserError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>오류</AlertTitle>
                <AlertDescription>{updateUserError}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">이메일 *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser?.email || ''}
                  onChange={(e) => handleEditInputChange('email', e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-name">이름 *</Label>
                <Input
                  id="edit-name"
                  value={editingUser?.name || ''}
                  onChange={(e) => handleEditInputChange('name', e.target.value)}
                  placeholder="사용자 이름을 입력하세요"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-role_id">역할 *</Label>
                <Select
                  value={editingUser?.role_id || ''}
                  onValueChange={(value) => handleEditInputChange('role_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="역할을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">비밀번호 변경 (선택)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="변경할 비밀번호 (최소 8자 이상)"
                />
                <p className="text-xs text-gray-500">비밀번호를 변경하려면 입력하세요. 변경하지 않으면 기존 비밀번호가 유지됩니다.</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditUserOpen(false);
                  setEditingUser(null);
                  setEditPassword('');
                }}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={isSubmitting || !editingUser?.email || !editingUser?.name || !editingUser?.role_id || (editPassword.length > 0 && editPassword.length < 8)}
              >
                {isSubmitting ? '수정 중...' : '수정'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
}
