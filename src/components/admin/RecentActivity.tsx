'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, User, FileText, Settings } from 'lucide-react';

const activities = [
  {
    id: 1,
    user: '김관리',
    action: '새 사용자를 추가했습니다',
    target: '이사용',
    time: '5분 전',
    type: 'user' as const,
  },
  {
    id: 2,
    user: '박관리',
    action: '문서를 업데이트했습니다',
    target: '시스템 가이드',
    time: '1시간 전',
    type: 'document' as const,
  },
  {
    id: 3,
    user: '최관리',
    action: '시스템 설정을 변경했습니다',
    target: '이메일 설정',
    time: '2시간 전',
    type: 'settings' as const,
  },
  {
    id: 4,
    user: '정관리',
    action: '새 사용자를 추가했습니다',
    target: '한사용',
    time: '3시간 전',
    type: 'user' as const,
  },
  {
    id: 5,
    user: '김관리',
    action: '문서를 생성했습니다',
    target: 'API 문서',
    time: '4시간 전',
    type: 'document' as const,
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'user':
      return User;
    case 'document':
      return FileText;
    case 'settings':
      return Settings;
    default:
      return Clock;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'user':
      return 'bg-blue-100 text-blue-800';
    case 'document':
      return 'bg-green-100 text-green-800';
    case 'settings':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          최근 활동
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`/avatars/${activity.user}.jpg`} />
                  <AvatarFallback>
                    {activity.user.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">{activity.user}</p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getActivityColor(activity.type)}`}
                    >
                      <Icon className="mr-1 h-3 w-3" />
                      {activity.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {activity.action} <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}




