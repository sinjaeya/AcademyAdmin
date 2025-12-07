'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText, BarChart3 } from 'lucide-react';

// 레벨별 통계 타입
interface LevelStat {
  level: string;
  label: string;
  count: number;
}

interface StatisticsData {
  total: number;
  byLevel: LevelStat[];
}

// 레벨별 카드 색상
const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Lv1_Elem5': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Lv2_Elem6': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'Lv3_Mid1': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Lv4_Mid2': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Lv5_Mid3': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Lv6_High1': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'Lv7_High2': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Lv8_High3': { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  'Lv9_CSAT': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'unknown': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
};

export default function SentenceClinicStatisticsPage(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async (): Promise<void> => {
      try {
        const response = await fetch('/api/admin/statistics/sentence-clinic');
        const result = await response.json();

        if (result.success) {
          setStatistics(result.data);
        } else {
          setError(result.error || '통계 조회 실패');
        }
      } catch (err) {
        console.error('통계 조회 오류:', err);
        setError('통계 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">통계 로딩 중...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold">문장클리닉 통계</h1>
          </div>
        </div>

        {/* 전체 통계 카드 */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-blue-100">전체 문장클리닉</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <BookText className="w-12 h-12 text-blue-200" />
              <div>
                <p className="text-4xl font-bold">{statistics?.total.toLocaleString()}</p>
                <p className="text-blue-200 text-sm">총 문장 개수</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 레벨별 통계 */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">레벨별 문장 개수</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {statistics?.byLevel.map((stat) => {
              const colors = LEVEL_COLORS[stat.level] || LEVEL_COLORS['unknown'];
              const percentage = statistics.total > 0
                ? ((stat.count / statistics.total) * 100).toFixed(1)
                : '0';

              return (
                <Card
                  key={stat.level}
                  className={`${colors.bg} ${colors.border} border-2 hover:shadow-md transition-shadow`}
                >
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className={`text-sm font-medium ${colors.text} mb-1`}>{stat.label}</p>
                      <p className={`text-3xl font-bold ${colors.text}`}>
                        {stat.count.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {percentage}%
                      </p>
                    </div>
                    {/* 프로그레스 바 */}
                    <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.text.replace('text-', 'bg-')} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 레벨별 상세 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">레벨별 상세 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">레벨</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">문장 개수</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">비율</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 w-1/3">분포</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics?.byLevel.map((stat) => {
                    const colors = LEVEL_COLORS[stat.level] || LEVEL_COLORS['unknown'];
                    const percentage = statistics.total > 0
                      ? ((stat.count / statistics.total) * 100).toFixed(1)
                      : '0';

                    return (
                      <tr key={stat.level} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded ${colors.bg} ${colors.text} text-xs font-medium`}>
                            {stat.label}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {stat.count.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-600">
                          {percentage}%
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors.text.replace('text-', 'bg-')} rounded-full`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-3 px-4">합계</td>
                    <td className="text-right py-3 px-4">{statistics?.total.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">100%</td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
