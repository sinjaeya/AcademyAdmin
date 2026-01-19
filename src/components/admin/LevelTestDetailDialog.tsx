'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Clock,
  Target,
  BookOpen,
  FileText,
  Scroll,
  GraduationCap,
  User,
  Calendar,
  Award,
  ChevronRight,
  Printer,
  Loader2,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
} from 'recharts';
import {
  type LevelTestSessionDetail,
  LEVEL_LABELS,
  READING_TYPE_LABELS,
  STRUCTURE_TYPE_LABELS,
  getGrade,
  calculateRate,
  formatElapsedTime,
  formatDate,
} from '@/types/level-test';

// 영역 설정
const AREA_CONFIG = {
  vocab: { label: '어휘력', color: '#3B82F6', icon: BookOpen },
  sentence: { label: '구조 파악', color: '#10B981', icon: FileText },
  reading: { label: '독해력', color: '#8B5CF6', icon: Scroll },
  suneung: { label: '종합 사고', color: '#F59E0B', icon: GraduationCap },
};

interface LevelTestDetailDialogProps {
  sessionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LevelTestDetailDialog({
  sessionId,
  open,
  onOpenChange,
}: LevelTestDetailDialogProps) {
  const [session, setSession] = useState<LevelTestSessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // 데이터 로드
  useEffect(() => {
    if (!sessionId || !open) {
      setSession(null);
      return;
    }

    const loadDetail = async (): Promise<void> => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/level-test/${sessionId}`);
        const result = await response.json();
        if (result.success) {
          setSession(result.data);
        }
      } catch (error) {
        console.error('상세 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [sessionId, open]);

  // 프린트 핸들러
  const handlePrint = (): void => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>레벨테스트 결과 - ${session?.student_name}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Malgun Gothic', sans-serif; padding: 20px; background: #fff; }
            .print-content { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #333; }
            .header h1 { font-size: 24px; margin-bottom: 8px; }
            .section { margin-bottom: 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
            .section-title { font-size: 14px; font-weight: 600; padding: 12px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
            .section-content { padding: 16px; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #eee; }
            .info-label { color: #666; }
            .info-value { font-weight: 600; }
            .area-table { width: 100%; border-collapse: collapse; }
            .area-table th, .area-table td { padding: 10px; text-align: left; border: 1px solid #e5e7eb; }
            .area-table th { background: #f9fafb; font-size: 12px; color: #6b7280; }
            .progress-bar { height: 10px; background: #e5e7eb; border-radius: 5px; overflow: hidden; }
            .progress-fill { height: 100%; border-radius: 5px; }
            .grade-badge { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; color: white; font-weight: bold; font-size: 20px; }
            .comment-list { list-style: none; }
            .comment-item { padding: 8px 0; padding-left: 20px; position: relative; }
            .comment-item::before { content: '▸'; position: absolute; left: 0; color: #3B82F6; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .gap-2 { gap: 8px; }
            .gap-4 { gap: 16px; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .text-sm { font-size: 14px; }
            .text-xs { font-size: 12px; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-600 { color: #4b5563; }
            .mb-2 { margin-bottom: 8px; }
            .mt-4 { margin-top: 16px; }
            .p-4 { padding: 16px; }
            .rounded-lg { border-radius: 8px; }
            .bg-blue-50 { background: #eff6ff; }
            .border { border: 1px solid #e5e7eb; }
            .print\\:hidden { display: none !important; }
            .hidden.print\\:block { display: block !important; }
            .grid { display: grid; }
            .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .gap-3 { gap: 12px; }
            .gap-4 { gap: 16px; }
            .space-y-3 > * + * { margin-top: 12px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .rounded-lg { border-radius: 8px; }
            .rounded-full { border-radius: 9999px; }
            .rounded-xl { border-radius: 12px; }
            .overflow-hidden { overflow: hidden; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-200 { background-color: #e5e7eb; }
            .w-20 { width: 80px; }
            .w-12 { width: 48px; }
            .h-6 { height: 24px; }
            .flex-1 { flex: 1; }
            .min-w-0 { min-width: 0; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
              .section { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${content}
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 막대 그래프 색상
  const getBarColor = (rate: number): string => {
    if (rate >= 80) return '#22C55E';
    if (rate >= 60) return '#F59E0B';
    if (rate >= 40) return '#FB923C';
    return '#EF4444';
  };

  if (!session && !loading) {
    return null;
  }

  const results = session?.results;
  const overallRate = results ? calculateRate(results.overall.correct, results.overall.total) : 0;
  const overallGrade = getGrade(overallRate);

  // 영역별 데이터
  const areaData = results
    ? (['vocab', 'sentence', 'reading', 'suneung'] as const).map((key) => {
        const result = results[key];
        const rate = calculateRate(result.correct, result.total);
        return {
          key,
          label: AREA_CONFIG[key].label,
          total: result.total,
          correct: result.correct,
          rate,
          color: AREA_CONFIG[key].color,
          Icon: AREA_CONFIG[key].icon,
        };
      })
    : [];

  // 레이더 차트 데이터
  const radarData = results && session?.analysis
    ? [
        {
          area: '어휘',
          score: calculateRate(results.vocab.correct, results.vocab.total),
        },
        {
          area: '구조',
          score: calculateRate(results.sentence.correct, results.sentence.total),
        },
        {
          area: '사실확인',
          score: session.analysis.readingByType.factual.total > 0
            ? calculateRate(session.analysis.readingByType.factual.correct, session.analysis.readingByType.factual.total)
            : 0,
        },
        {
          area: '추론',
          score: session.analysis.readingByType.inferential.total > 0
            ? calculateRate(session.analysis.readingByType.inferential.correct, session.analysis.readingByType.inferential.total)
            : 0,
        },
        {
          area: '문맥',
          score: calculateRate(results.reading.correct, results.reading.total),
        },
        {
          area: '종합',
          score: calculateRate(results.suneung.correct, results.suneung.total),
        },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              레벨테스트 결과
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={handlePrint} className="no-print">
              <Printer className="w-4 h-4 mr-2" />
              인쇄/PDF
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : session ? (
          <div ref={printRef} className="space-y-5">
            {/* 학생 기본정보 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{session.student_name}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(session.started_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatElapsedTime(session.elapsed_seconds)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 추천 레벨 + 종합 점수 */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    추천 학습 레벨
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-600">
                      {session.recommended_level || '-'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {session.recommended_level ? LEVEL_LABELS[session.recommended_level] : ''}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: overallGrade.color }}
                  >
                    <span className="text-2xl font-bold text-white">{overallGrade.label}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{overallRate}점</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  총 문항
                </span>
                <span className="font-semibold">
                  {results?.overall.correct || 0} / {results?.overall.total || 0} 정답
                </span>
              </div>
            </div>

            {/* 영역별 성취도 테이블 */}
            <div className="section border rounded-xl overflow-hidden">
              <h3 className="section-title font-semibold text-gray-900 px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                영역별 성취도
              </h3>
              <table className="area-table w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 border-b text-xs font-medium text-gray-500">영역</th>
                    <th className="text-center py-3 px-2 border-b w-16 text-xs font-medium text-gray-500">배점</th>
                    <th className="text-center py-3 px-2 border-b w-16 text-xs font-medium text-gray-500">득점</th>
                    <th className="py-3 px-4 border-b w-48 text-xs font-medium text-gray-500">성취도</th>
                  </tr>
                </thead>
                <tbody>
                  {areaData.map((area) => (
                    <tr key={area.key} className="border-b last:border-b-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${area.color}15` }}
                          >
                            <area.Icon className="w-5 h-5" style={{ color: area.color }} />
                          </div>
                          <span className="font-medium">{area.label}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2 text-gray-600">{area.total}</td>
                      <td className="text-center py-3 px-2 font-semibold">{area.correct}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${area.rate}%`, backgroundColor: area.color }}
                            />
                          </div>
                          <span className="text-sm font-bold min-w-[40px] text-right" style={{ color: area.color }}>
                            {area.rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 레이더 차트 (화면용) */}
            {radarData.length > 0 && (
              <div className="section border rounded-xl overflow-hidden print:hidden">
                <h3 className="section-title font-semibold text-gray-900 px-4 py-3 bg-gray-50 border-b">
                  역량 분석 차트
                </h3>
                <div className="p-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickCount={5} />
                        <Radar name="성취도" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* 역량 분석 (인쇄용 - 레이더 차트 대체) */}
            {radarData.length > 0 && (
              <div className="hidden print:block section" style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <h3 style={{ fontWeight: 600, color: '#111827', padding: '12px 16px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '20px', height: '20px', backgroundColor: '#8B5CF6', borderRadius: '4px', display: 'inline-block' }}></span>
                  역량 분석
                </h3>
                <div style={{ padding: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        {radarData.slice(0, 3).map((item) => (
                          <td key={item.area} style={{ width: '33.33%', padding: '8px', textAlign: 'center', verticalAlign: 'top' }}>
                            <div style={{ backgroundColor: item.score >= 60 ? '#DCFCE7' : '#FEE2E2', borderRadius: '12px', padding: '16px', border: `2px solid ${item.score >= 60 ? '#22C55E' : '#EF4444'}` }}>
                              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>{item.area}</p>
                              <p style={{ fontSize: '28px', fontWeight: 700, color: item.score >= 60 ? '#16A34A' : '#DC2626', margin: 0 }}>
                                {item.score}%
                              </p>
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        {radarData.slice(3, 6).map((item) => (
                          <td key={item.area} style={{ width: '33.33%', padding: '8px', textAlign: 'center', verticalAlign: 'top' }}>
                            <div style={{ backgroundColor: item.score >= 60 ? '#DCFCE7' : '#FEE2E2', borderRadius: '12px', padding: '16px', border: `2px solid ${item.score >= 60 ? '#22C55E' : '#EF4444'}` }}>
                              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>{item.area}</p>
                              <p style={{ fontSize: '28px', fontWeight: 700, color: item.score >= 60 ? '#16A34A' : '#DC2626', margin: 0 }}>
                                {item.score}%
                              </p>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 막대 그래프 (화면용) */}
            {areaData.length > 0 && (
              <div className="section border rounded-xl overflow-hidden print:hidden">
                <h3 className="section-title font-semibold text-gray-900 px-4 py-3 bg-gray-50 border-b">
                  영역별 성취도 비교
                </h3>
                <div className="p-4">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={areaData} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 0 }}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis type="category" dataKey="label" width={70} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={24}>
                          {areaData.map((entry, index) => (
                            <Cell key={index} fill={getBarColor(entry.rate)} />
                          ))}
                          <LabelList dataKey="rate" position="right" formatter={(value) => `${value}%`} style={{ fontSize: 12, fontWeight: 600, fill: '#374151' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* 범례 */}
                  <div className="flex justify-center gap-4 mt-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-green-500" />
                      우수 (80%+)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-amber-500" />
                      양호 (60%+)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-red-400" />
                      보완 필요
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 영역별 성취도 비교 (인쇄용) */}
            {areaData.length > 0 && (
              <div className="hidden print:block section" style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <h3 style={{ fontWeight: 600, color: '#111827', padding: '12px 16px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '20px', height: '20px', backgroundColor: '#3B82F6', borderRadius: '4px', display: 'inline-block' }}></span>
                  영역별 성취도 비교
                </h3>
                <div style={{ padding: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {areaData.map((area) => (
                        <tr key={area.key}>
                          <td style={{ width: '80px', padding: '10px 8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: area.color, marginRight: '8px' }}></span>
                            {area.label}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <div style={{ width: '100%', height: '28px', backgroundColor: '#e5e7eb', borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
                              <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                borderRadius: '14px',
                                width: `${area.rate}%`,
                                minWidth: area.rate > 0 ? '20px' : '0',
                                backgroundColor: getBarColor(area.rate),
                                transition: 'width 0.3s'
                              }}></div>
                            </div>
                          </td>
                          <td style={{ width: '60px', padding: '10px 8px', textAlign: 'right', fontSize: '16px', fontWeight: 700, color: getBarColor(area.rate) }}>
                            {area.rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* 범례 */}
                  <table style={{ width: '100%', marginTop: '16px' }}>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'center', fontSize: '12px', color: '#4b5563', padding: '4px' }}>
                          <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#22C55E', marginRight: '6px', verticalAlign: 'middle' }}></span>
                          <span style={{ verticalAlign: 'middle' }}>우수 (80%+)</span>
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '12px', color: '#4b5563', padding: '4px' }}>
                          <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#F59E0B', marginRight: '6px', verticalAlign: 'middle' }}></span>
                          <span style={{ verticalAlign: 'middle' }}>양호 (60%+)</span>
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '12px', color: '#4b5563', padding: '4px' }}>
                          <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#EF4444', marginRight: '6px', verticalAlign: 'middle' }}></span>
                          <span style={{ verticalAlign: 'middle' }}>보완 필요</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 글 구조 파악 분석 */}
            {session.analysis && Object.keys(session.analysis.sentenceByStructure).length > 0 && (
              <div className="section border rounded-xl overflow-hidden">
                <h3 className="section-title font-semibold text-gray-900 px-4 py-3 bg-gray-50 border-b">
                  글 구조 파악 분석
                </h3>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(session.analysis.sentenceByStructure).map(([type, data]) => {
                      const rate = calculateRate(data.correct, data.total);
                      const grade = getGrade(rate);
                      const label = STRUCTURE_TYPE_LABELS[type] || type;
                      return (
                        <div key={type} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border">
                          <span className="text-sm font-medium">{label}</span>
                          <Badge style={{ backgroundColor: grade.color, color: 'white' }}>
                            {rate}%
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 독해 유형 분석 */}
            {session.analysis &&
              (session.analysis.readingByType.factual.total > 0 ||
                session.analysis.readingByType.inferential.total > 0) && (
                <div className="section border rounded-xl overflow-hidden">
                  <h3 className="section-title font-semibold text-gray-900 px-4 py-3 bg-gray-50 border-b">
                    독해 유형 분석
                  </h3>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    {(['factual', 'inferential'] as const).map((type) => {
                      const data = session.analysis!.readingByType[type];
                      if (data.total === 0) return null;
                      const rate = calculateRate(data.correct, data.total);
                      const grade = getGrade(rate);
                      return (
                        <div key={type} className="p-4 rounded-xl bg-gray-50 border text-center">
                          <p className="text-xs text-gray-500 mb-2">{READING_TYPE_LABELS[type]}</p>
                          <div
                            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-2"
                            style={{ backgroundColor: grade.color }}
                          >
                            <span className="text-lg font-bold text-white">{grade.label}</span>
                          </div>
                          <p className="text-2xl font-bold">{rate}%</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {data.correct}/{data.total}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* 종합 분석 코멘트 */}
            {session.analysis && session.analysis.overallComments.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-700 mb-3">📊 종합 분석</h3>
                <ul className="space-y-2">
                  {session.analysis.overallComments.map((comment, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{comment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
