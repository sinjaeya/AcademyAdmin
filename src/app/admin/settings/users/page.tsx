'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase/client';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  X
} from 'lucide-react';

// 사용자 데이터 타입 정의 (user_role 테이블의 모든 컬럼)
interface User {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  updated_at: string;
  // 추가 컬럼들이 있을 수 있으므로 모든 컬럼을 포함
  [key: string]: any;
}

// 새 사용자 추가 폼 데이터 타입 (user_role 테이블)
interface NewUserForm {
  user_id: string;
  role_id: string;
  // 추가 필드들이 있을 수 있음
  [key: string]: any;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>({
    user_id: '',
    role_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 데이터 가져오기
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }

      const { data, error: fetchError } = await supabase
        .from('user_role')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);


  const handleDeleteUser = async (userId: string) => {
    if (confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      try {
        if (!supabase) {
          throw new Error('Supabase client is not available');
        }

        const { error } = await supabase
          .from('user_role')
          .delete()
          .eq('id', userId);

        if (error) {
          throw error;
        }

        // 성공적으로 삭제되면 목록에서 제거
        setUsers(prev => prev.filter(user => user.id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('사용자 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 새 사용자 추가 함수
  const handleAddUser = async () => {
    try {
      setIsSubmitting(true);
      
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }

      const { data, error } = await supabase
        .from('user_role')
        .insert([newUser])
        .select();

      if (error) {
        throw error;
      }

      // 성공적으로 추가되면 목록에 추가
      if (data && data.length > 0) {
        setUsers(prev => [data[0], ...prev]);
        setNewUser({
          user_id: '',
          role_id: ''
        });
        setIsAddUserOpen(false);
      }
    } catch (err) {
      console.error('Error adding user:', err);
      alert('사용자 추가 중 오류가 발생했습니다.');
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
                              <TableHead>ID</TableHead>
                              <TableHead>User ID</TableHead>
                              <TableHead>Role ID</TableHead>
                              <TableHead>Created At</TableHead>
                              <TableHead>Updated At</TableHead>
                              <TableHead>액션</TableHead>
                            </TableRow>
                  </TableHeader>
                  <TableBody>
                        {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.id || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {user.user_id || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.role_id || 'N/A'}
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
                            <Button size="sm" variant="outline">
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
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                새 사용자 역할 추가
              </DialogTitle>
              <DialogDescription>
                새로운 사용자 역할 정보를 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">User ID *</Label>
                <Input
                  id="user_id"
                  value={newUser.user_id}
                  onChange={(e) => handleInputChange('user_id', e.target.value)}
                  placeholder="사용자 ID를 입력하세요"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role_id">Role ID *</Label>
                <Input
                  id="role_id"
                  value={newUser.role_id}
                  onChange={(e) => handleInputChange('role_id', e.target.value)}
                  placeholder="역할 ID를 입력하세요"
                />
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
                        disabled={isSubmitting || !newUser.user_id || !newUser.role_id}
                      >
                {isSubmitting ? '추가 중...' : '추가'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
}
