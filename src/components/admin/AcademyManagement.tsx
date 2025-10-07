'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Building2, MapPin, Phone, Mail, Globe, FileText } from 'lucide-react';
import { Academy } from '@/types';

interface AcademyManagementProps {
  initialAcademies?: Academy[];
}

export function AcademyManagement({ initialAcademies = [] }: AcademyManagementProps) {
  const [academies, setAcademies] = useState<Academy[]>(initialAcademies);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    logo_url: '',
    is_active: true
  });

  // 학원 목록 조회
  const fetchAcademies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/academy');
      if (response.ok) {
        const data = await response.json();
        setAcademies(data.academies || []);
      }
    } catch (error) {
      console.error('학원 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 학원 추가/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAcademy ? `/api/admin/academy/${editingAcademy.id}` : '/api/admin/academy';
      const method = editingAcademy ? 'PUT' : 'POST';
      
      console.log('학원 저장 요청:', { url, method, formData });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('응답 상태:', response.status);
      const responseData = await response.json();
      console.log('응답 데이터:', responseData);

      if (response.ok) {
        await fetchAcademies();
        resetForm();
        setIsDialogOpen(false);
        alert('학원이 성공적으로 저장되었습니다.');
      } else {
        console.error('학원 저장 실패:', responseData);
        alert(`학원 저장 실패: ${responseData.error || responseData.details || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('학원 저장 오류:', error);
      alert(`학원 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 학원 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 학원을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/academy/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAcademies();
      } else {
        console.error('학원 삭제 실패');
      }
    } catch (error) {
      console.error('학원 삭제 오류:', error);
    }
  };

  // 폼 리셋
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      description: '',
      logo_url: '',
      is_active: true
    });
    setEditingAcademy(null);
  };

  // 수정 모드로 설정
  const handleEdit = (academy: Academy) => {
    setEditingAcademy(academy);
    setFormData({
      name: academy.name,
      address: academy.address || '',
      phone: academy.phone || '',
      email: academy.email || '',
      website: academy.website || '',
      description: academy.description || '',
      logo_url: academy.logo_url || '',
      is_active: academy.is_active
    });
    setIsDialogOpen(true);
  };

  // 새 학원 추가 모드로 설정
  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  useEffect(() => {
    // 초기 데이터가 없을 때만 API 호출
    if (initialAcademies.length === 0) {
      fetchAcademies();
    }
  }, [initialAcademies.length]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">학원 정보를 불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  console.log('AcademyManagement 렌더링:', { academies, loading, initialAcademies });

  return (
    <div className="space-y-6">
      {/* 헤더 및 추가 버튼 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">학원 목록</h2>
          <p className="text-sm text-gray-600">총 {academies.length}개의 학원이 등록되어 있습니다.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              학원 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAcademy ? '학원 정보 수정' : '새 학원 추가'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">학원명 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="학원명을 입력하세요"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="02-1234-5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="서울시 강남구 테스트로 123"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@academy.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">웹사이트</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://academy.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">로고 URL</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="학원에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">활성 상태</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  취소
                </Button>
                <Button type="submit">
                  {editingAcademy ? '수정' : '추가'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 학원 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {academies.map((academy) => (
          <Card key={academy.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{academy.name}</CardTitle>
                </div>
                <Badge variant={academy.is_active ? 'default' : 'secondary'}>
                  {academy.is_active ? '활성' : '비활성'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {academy.address && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{academy.address}</span>
                </div>
              )}
              {academy.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{academy.phone}</span>
                </div>
              )}
              {academy.email && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{academy.email}</span>
                </div>
              )}
              {academy.website && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4" />
                  <a href={academy.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    웹사이트
                  </a>
                </div>
              )}
              {academy.description && (
                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 mt-0.5" />
                  <span className="line-clamp-2">{academy.description}</span>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(academy)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(academy.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {academies.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 학원이 없습니다</h3>
            <p className="text-gray-600 mb-4">첫 번째 학원을 추가해보세요.</p>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              학원 추가
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
