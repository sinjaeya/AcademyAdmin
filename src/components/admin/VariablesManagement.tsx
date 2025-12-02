'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Variable } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Setting {
  id: number;
  name: string;
  value: string;
  created_at: string;
}

export function VariablesManagement() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<number | null>(null);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    value: ''
  });

  // 설정 목록 조회
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || []);
      } else {
        toast({
          type: 'error',
          description: '설정 목록을 불러오는데 실패했습니다.'
        });
      }
    } catch (error) {
      console.error('설정 목록 조회 오류:', error);
      toast({
        type: 'error',
        description: '설정 목록 조회 중 오류가 발생했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  // 설정 추가/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSetting ? `/api/admin/settings/${editingSetting.id}` : '/api/admin/settings';
      const method = editingSetting ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (response.ok) {
        await fetchSettings();
        resetForm();
        setIsDialogOpen(false);
        toast({
          type: 'success',
          description: editingSetting ? '변수가 성공적으로 수정되었습니다.' : '변수가 성공적으로 추가되었습니다.'
        });
      } else {
        const errorMessage = responseData.error || '알 수 없는 오류';
        toast({
          type: 'error',
          description: `변수 저장 실패: ${errorMessage}`
        });
      }
    } catch (error) {
      console.error('변수 저장 오류:', error);
      toast({
        type: 'error',
        description: error instanceof Error ? error.message : '변수 저장 중 오류가 발생했습니다.'
      });
    }
  };

  // 설정 삭제 클릭
  const handleDeleteClick = (id: number) => {
    setSettingToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // 설정 삭제 실행
  const handleDelete = async () => {
    if (!settingToDelete) return;

    try {
      const response = await fetch(`/api/admin/settings/${settingToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSettings();
        setIsDeleteDialogOpen(false);
        setSettingToDelete(null);
        toast({
          type: 'success',
          description: '변수가 성공적으로 삭제되었습니다.'
        });
      } else {
        toast({
          type: 'error',
          description: '변수 삭제에 실패했습니다.'
        });
      }
    } catch (error) {
      console.error('변수 삭제 오류:', error);
      toast({
        type: 'error',
        description: error instanceof Error ? error.message : '변수 삭제 중 오류가 발생했습니다.'
      });
    }
  };

  // 폼 리셋
  const resetForm = () => {
    setFormData({
      name: '',
      value: ''
    });
    setEditingSetting(null);
  };

  // 수정 모드로 설정
  const handleEdit = (setting: Setting) => {
    setEditingSetting(setting);
    setFormData({
      name: setting.name,
      value: setting.value
    });
    setIsDialogOpen(true);
  };

  // 새 변수 추가 모드로 설정
  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">변수 정보를 불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 학생앱 변수관리 그룹 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Variable className="h-5 w-5" />
                학생앱 변수관리
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">학생 앱에서 사용할 변수들을 관리합니다.</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  변수 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSetting ? '변수 수정' : '새 변수 추가'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">변수명 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="변수명을 입력하세요"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">값 *</Label>
                    <Input
                      id="value"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="값을 입력하세요"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      취소
                    </Button>
                    <Button type="submit">
                      {editingSetting ? '수정' : '추가'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <div className="text-center py-12">
              <Variable className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 변수가 없습니다</h3>
              <p className="text-gray-600 mb-4">첫 번째 변수를 추가해보세요.</p>
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                변수 추가
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>변수명</TableHead>
                  <TableHead>값</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">{setting.name}</TableCell>
                    <TableCell className="max-w-md truncate">{setting.value}</TableCell>
                    <TableCell>
                      {new Date(setting.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(setting)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(setting.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 변수 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>변수 삭제 확인</DialogTitle>
            <DialogDescription>
              정말로 이 변수를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSettingToDelete(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



