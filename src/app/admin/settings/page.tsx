'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Database, 
  Mail, 
  Shield, 
  Bell,
  Save
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">시스템 설정</h1>
        <p className="text-gray-600 mt-2">시스템 전반의 설정을 관리합니다</p>
      </div>

      {/* 일반 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            일반 설정
          </CardTitle>
          <CardDescription>
            기본적인 시스템 설정을 구성합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="siteName">사이트 이름</Label>
              <Input
                id="siteName"
                defaultValue="Admin Dashboard"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="siteUrl">사이트 URL</Label>
              <Input
                id="siteUrl"
                defaultValue="https://admin.example.com"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenance">유지보수 모드</Label>
              <p className="text-sm text-gray-500">사이트를 유지보수 모드로 전환합니다</p>
            </div>
            <Switch id="maintenance" />
          </div>
        </CardContent>
      </Card>

      {/* 데이터베이스 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            데이터베이스 설정
          </CardTitle>
          <CardDescription>
            데이터베이스 연결 및 백업 설정을 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dbHost">데이터베이스 호스트</Label>
              <Input
                id="dbHost"
                defaultValue="localhost"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dbPort">포트</Label>
              <Input
                id="dbPort"
                defaultValue="5432"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoBackup">자동 백업</Label>
              <p className="text-sm text-gray-500">매일 자동으로 데이터베이스를 백업합니다</p>
            </div>
            <Switch id="autoBackup" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* 이메일 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            이메일 설정
          </CardTitle>
          <CardDescription>
            이메일 발송 및 알림 설정을 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtpHost">SMTP 호스트</Label>
              <Input
                id="smtpHost"
                defaultValue="smtp.gmail.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="smtpPort">SMTP 포트</Label>
              <Input
                id="smtpPort"
                defaultValue="587"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifications">이메일 알림</Label>
              <p className="text-sm text-gray-500">시스템 이벤트에 대한 이메일 알림을 활성화합니다</p>
            </div>
            <Switch id="emailNotifications" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* 보안 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            보안 설정
          </CardTitle>
          <CardDescription>
            시스템 보안 및 접근 제어 설정을 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessionTimeout">세션 타임아웃 (분)</Label>
              <Input
                id="sessionTimeout"
                defaultValue="30"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxLoginAttempts">최대 로그인 시도 횟수</Label>
              <Input
                id="maxLoginAttempts"
                defaultValue="5"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="twoFactorAuth">2단계 인증</Label>
              <p className="text-sm text-gray-500">추가 보안을 위해 2단계 인증을 활성화합니다</p>
            </div>
            <Switch id="twoFactorAuth" />
          </div>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            알림 설정
          </CardTitle>
          <CardDescription>
            시스템 알림 및 알림 방법을 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pushNotifications">푸시 알림</Label>
                <p className="text-sm text-gray-500">브라우저 푸시 알림을 활성화합니다</p>
              </div>
              <Switch id="pushNotifications" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="soundNotifications">소리 알림</Label>
                <p className="text-sm text-gray-500">알림 시 소리를 재생합니다</p>
              </div>
              <Switch id="soundNotifications" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          설정 저장
        </Button>
      </div>
      </div>
    </AdminLayout>
  );
}
