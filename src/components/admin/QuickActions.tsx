'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  UserPlus, 
  FileText, 
  Settings, 
  BarChart3, 
  Mail 
} from 'lucide-react';

const quickActions = [
  {
    title: '새 사용자 추가',
    description: '새로운 사용자 계정을 생성합니다',
    icon: UserPlus,
    href: '/admin/users/new',
  },
  {
    title: '문서 생성',
    description: '새로운 문서를 작성합니다',
    icon: FileText,
    href: '/admin/documents/new',
  },
  {
    title: '통계 보기',
    description: '상세한 분석 데이터를 확인합니다',
    icon: BarChart3,
    href: '/admin/analytics',
  },
  {
    title: '이메일 발송',
    description: '사용자에게 이메일을 발송합니다',
    icon: Mail,
    href: '/admin/email',
  },
  {
    title: '시스템 설정',
    description: '시스템 설정을 관리합니다',
    icon: Settings,
    href: '/admin/settings',
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          빠른 작업
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.title}
              variant="outline"
              className="w-full justify-start h-auto p-4"
              asChild
            >
              <a href={action.href}>
                <Icon className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </div>
              </a>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}




