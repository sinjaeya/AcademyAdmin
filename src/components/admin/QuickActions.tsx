'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Zap,
  Users,
  Building2,
  Shield,
  BarChart3,
  DollarSign,
  MonitorPlay,
  BookOpen,
  PenTool,
  GraduationCap
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

function getActionsForRole(role: string): QuickAction[] {
  if (role === 'admin') {
    return [
      {
        title: '학원관리',
        description: '학원 목록 및 설정을 관리합니다',
        icon: Building2,
        href: '/admin/settings/academy',
      },
      {
        title: '사용자 관리',
        description: '관리자/강사 계정을 관리합니다',
        icon: Users,
        href: '/admin/settings/users',
      },
      {
        title: '권한 관리',
        description: '역할별 권한을 설정합니다',
        icon: Shield,
        href: '/admin/settings/permissions',
      },
      {
        title: '통계',
        description: '학습 통계를 확인합니다',
        icon: BarChart3,
        href: '/admin/statistics/sentence-clinic',
      },
    ];
  }

  if (role === 'academy_owner') {
    return [
      {
        title: '학생 관리',
        description: '학생 정보를 관리합니다',
        icon: GraduationCap,
        href: '/admin/students',
      },
      {
        title: '수납 관리',
        description: '학원비 수납 내역을 관리합니다',
        icon: DollarSign,
        href: '/admin/payments',
      },
      {
        title: '실시간 모니터링',
        description: '실시간 학습 현황을 확인합니다',
        icon: MonitorPlay,
        href: '/admin/learning/realtime-korean2',
      },
      {
        title: '통계',
        description: '학습 통계를 확인합니다',
        icon: BarChart3,
        href: '/admin/statistics/sentence-clinic',
      },
    ];
  }

  // teacher
  return [
    {
      title: '실시간 국어',
      description: '실시간 국어 학습을 모니터링합니다',
      icon: MonitorPlay,
      href: '/admin/learning/realtime-korean2',
    },
    {
      title: '내손내줄 실시간',
      description: '필기 학습을 모니터링합니다',
      icon: PenTool,
      href: '/admin/handwriting/live',
    },
    {
      title: '지문 가이드',
      description: '지문 가이드를 확인합니다',
      icon: BookOpen,
      href: '/admin/teacher/passage-guide',
    },
  ];
}

export function QuickActions({ role }: { role: string }) {
  const actions = getActionsForRole(role);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          빠른 작업
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.title}
              variant="outline"
              className="w-full justify-start h-auto p-4 cursor-pointer"
              asChild
            >
              <Link href={action.href}>
                <Icon className="mr-3 h-5 w-5 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </div>
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
