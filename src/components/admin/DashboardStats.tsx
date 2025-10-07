'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

const stats = [
  {
    title: '총 사용자',
    value: '2,543',
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: Users,
  },
  {
    title: '총 주문',
    value: '1,234',
    change: '+8.2%',
    changeType: 'positive' as const,
    icon: ShoppingCart,
  },
  {
    title: '총 수익',
    value: '₩45,231,000',
    change: '+15.3%',
    changeType: 'positive' as const,
    icon: DollarSign,
  },
  {
    title: '성장률',
    value: '23.1%',
    change: '+2.1%',
    changeType: 'positive' as const,
    icon: TrendingUp,
  },
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change} 지난 달 대비
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}




