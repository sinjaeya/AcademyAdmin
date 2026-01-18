'use client';

import { useState, useEffect, use } from 'react';
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
  School,
  Timer,
  TrendingUp,
  AlertCircle,
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
  DOMAIN_LABELS,
  VOCAB_DIFFICULTY_LABELS,
  getGrade,
  calculateRate,
  formatElapsedTime,
  formatDate,
} from '@/types/level-test';

// 영역 설정
const AREA_CONFIG = {
  vocab: { label: '어휘력', color: '#3B82F6', icon: BookOpen, description: '한자어와 어휘의 의미를 정확히 파악하는 능력' },
  sentence: { label: '구조 파악', color: '#10B981', icon: FileText, description: '글의 논리적 구조와 전개 방식을 이해하는 능력' },
  reading: { label: '독해력', color: '#8B5CF6', icon: Scroll, description: '지문의 내용을 정확히 이해하고 분석하는 능력' },
  suneung: { label: '종합 사고', color: '#F59E0B', icon: GraduationCap, description: '수능형 지문에서 핵심 정보를 파악하는 능력' },
};

// 레벨 설명
const LEVEL_DESCRIPTIONS: Record<string, string> = {
  'Lv3_Mid1': '중학교 1학년 수준의 교과서와 지문을 무리 없이 이해할 수 있습니다.',
  'Lv4_Mid2': '중학교 2학년 수준의 복잡한 지문도 분석하고 이해할 수 있습니다.',
  'Lv5_Mid3': '중학교 3학년 수준으로 고등학교 진학을 위한 기초가 탄탄합니다.',
  'Lv6_High1': '고등학교 1학년 수준의 지문과 어휘를 다룰 수 있습니다.',
};

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default function LevelTestReportPage({ params }: PageProps) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<LevelTestSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    const loadDetail = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/admin/level-test/${sessionId}`);
        const result = await response.json();
        if (result.success) {
          setSession(result.data);
        } else {
          setError(result.error || '데이터를 불러올 수 없습니다.');
        }
      } catch (err) {
        console.error('상세 로드 오류:', err);
        setError('서버 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [sessionId]);

  // 프린트 핸들러
  const handlePrint = (): void => {
    window.print();
  };

  // 막대 그래프 색상
  const getBarColor = (rate: number): string => {
    if (rate >= 80) return '#22C55E';
    if (rate >= 60) return '#F59E0B';
    if (rate >= 40) return '#FB923C';
    return '#EF4444';
  };

  // 시간 포맷 (ms -> 초)
  const formatTimeMs = (ms: number): string => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}초`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-gray-600">{error || '데이터를 찾을 수 없습니다.'}</p>
      </div>
    );
  }

  const results = session.results;
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
          description: AREA_CONFIG[key].description,
          total: result.total,
          correct: result.correct,
          rate,
          color: AREA_CONFIG[key].color,
          Icon: AREA_CONFIG[key].icon,
        };
      })
    : [];

  // 레이더 차트 데이터
  const radarData = results && session.analysis
    ? [
        { area: '어휘', score: calculateRate(results.vocab.correct, results.vocab.total) },
        { area: '구조', score: calculateRate(results.sentence.correct, results.sentence.total) },
        {
          area: '사실확인',
          score: session.analysis.readingByType.factual.total > 0
            ? calculateRate(session.analysis.readingByType.factual.correct, session.analysis.readingByType.factual.total)
            : 0
        },
        {
          area: '추론',
          score: session.analysis.readingByType.inferential.total > 0
            ? calculateRate(session.analysis.readingByType.inferential.correct, session.analysis.readingByType.inferential.total)
            : 0
        },
        { area: '문맥', score: calculateRate(results.reading.correct, results.reading.total) },
        { area: '종합', score: calculateRate(results.suneung.correct, results.suneung.total) },
      ]
    : [];

  return (
    <div className="min-h-screen bg-white">
      {/* 인쇄 버튼 (화면에서만 표시) */}
      <div className="fixed top-4 right-4 print:hidden z-50">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          인쇄 / PDF 저장
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-[800px] mx-auto px-6 py-8 print:px-0 print:py-0">
        {/* 헤더 - 학원 브랜딩 */}
        <header className="text-center border-b-2 border-gray-800 pb-6 mb-8">
          {session.academy_logo_url && (
            <img
              src={session.academy_logo_url}
              alt={session.academy_name || '학원 로고'}
              className="h-16 mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {session.academy_name || '국어 학습 진단'}
          </h1>
          <p className="text-lg text-gray-600">레벨테스트 결과 리포트</p>
        </header>

        {/* 학생 정보 + 테스트 정보 */}
        <section className="bg-gray-50 rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{session.student_name}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                  {session.student_school && (
                    <span className="flex items-center gap-1">
                      <School className="w-4 h-4" />
                      {session.student_school}
                    </span>
                  )}
                  {session.student_grade && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {session.student_grade}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div className="flex items-center gap-1 justify-end">
                <Calendar className="w-4 h-4" />
                {formatDate(session.started_at)}
              </div>
              <div className="flex items-center gap-1 justify-end mt-1">
                <Clock className="w-4 h-4" />
                소요시간: {formatElapsedTime(session.elapsed_seconds)}
              </div>
            </div>
          </div>
        </section>

        {/* 핵심 결과 - 추천 레벨 + 등급 */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <span className="font-medium">추천 학습 레벨</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-blue-600">
                  {session.recommended_level || '-'}
                </span>
                <span className="text-lg text-gray-600">
                  {session.recommended_level ? LEVEL_LABELS[session.recommended_level] : ''}
                </span>
              </div>
              {session.recommended_level && LEVEL_DESCRIPTIONS[session.recommended_level] && (
                <p className="text-sm text-gray-600 mt-2 max-w-md">
                  {LEVEL_DESCRIPTIONS[session.recommended_level]}
                </p>
              )}
            </div>
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: overallGrade.color }}
              >
                <span className="text-3xl font-bold text-white">{overallGrade.label}</span>
              </div>
              <p className="text-lg font-semibold text-gray-700 mt-2">{overallRate}점</p>
              <p className="text-xs text-gray-500">
                {results?.overall.correct || 0} / {results?.overall.total || 0} 정답
              </p>
            </div>
          </div>
        </section>

        {/* 영역별 성취도 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">영역별 성취도</h3>
          </div>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 border-b text-xs font-medium text-gray-500">영역</th>
                  <th className="text-center py-3 px-2 border-b w-16 text-xs font-medium text-gray-500">배점</th>
                  <th className="text-center py-3 px-2 border-b w-16 text-xs font-medium text-gray-500">득점</th>
                  <th className="py-3 px-4 border-b text-xs font-medium text-gray-500">성취도</th>
                </tr>
              </thead>
              <tbody>
                {areaData.map((area) => (
                  <tr key={area.key} className="border-b last:border-b-0">
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${area.color}15` }}
                        >
                          <area.Icon className="w-5 h-5" style={{ color: area.color }} />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{area.label}</span>
                          <p className="text-xs text-gray-500 mt-0.5">{area.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-2 text-gray-600">{area.total}</td>
                    <td className="text-center py-4 px-2 font-semibold">{area.correct}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${area.rate}%`, backgroundColor: area.color }}
                          />
                        </div>
                        <span className="text-sm font-bold min-w-[45px] text-right" style={{ color: area.color }}>
                          {area.rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 역량 분석 차트 (화면용) */}
        {radarData.length > 0 && (
          <section className="mb-6 print:hidden">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">역량 분석 차트</h3>
            </div>
            <div className="border rounded-xl p-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="area" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickCount={5} />
                    <Radar name="성취도" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* 역량 분석 (인쇄용) */}
        {radarData.length > 0 && (
          <section className="hidden print:block mb-6 page-break-inside-avoid">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">역량 분석</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {radarData.map((item) => {
                const grade = getGrade(item.score);
                return (
                  <div
                    key={item.area}
                    className="text-center p-4 rounded-xl border-2"
                    style={{
                      backgroundColor: item.score >= 60 ? '#DCFCE7' : '#FEE2E2',
                      borderColor: item.score >= 60 ? '#22C55E' : '#EF4444',
                    }}
                  >
                    <p className="text-sm text-gray-600 font-medium mb-1">{item.area}</p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: grade.color }}
                    >
                      {item.score}%
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 막대 그래프 (화면용) */}
        {areaData.length > 0 && (
          <section className="mb-6 print:hidden">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-gray-900">영역별 성취도 비교</h3>
            </div>
            <div className="border rounded-xl p-4">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={areaData} layout="vertical" margin={{ top: 5, right: 50, bottom: 5, left: 0 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="label" width={80} tick={{ fontSize: 13, fill: '#374151' }} axisLine={false} tickLine={false} />
                    <Bar dataKey="rate" radius={[0, 6, 6, 0]} barSize={28}>
                      {areaData.map((entry, index) => (
                        <Cell key={index} fill={getBarColor(entry.rate)} />
                      ))}
                      <LabelList dataKey="rate" position="right" formatter={(value: number) => `${value}%`} style={{ fontSize: 13, fontWeight: 600, fill: '#374151' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* 범례 */}
              <div className="flex justify-center gap-6 mt-4 text-xs text-gray-600">
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
          </section>
        )}

        {/* 세분화 분석 */}
        <div className="page-break-inside-avoid">
          {/* 어휘 난이도별 분석 */}
          {session.analysis && Object.keys(session.analysis.vocabByDifficulty || {}).length > 0 && (
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">어휘력 난이도별 분석</h3>
              </div>
              <div className="border rounded-xl p-4">
                <div className="grid grid-cols-3 gap-4">
                  {(['1', '2', '3'] as const).map((level) => {
                    const data = session.analysis?.vocabByDifficulty?.[level];
                    if (!data || data.total === 0) return null;
                    const rate = calculateRate(data.correct, data.total);
                    const grade = getGrade(rate);
                    return (
                      <div key={level} className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-2">{VOCAB_DIFFICULTY_LABELS[level]}</p>
                        <div
                          className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-2"
                          style={{ backgroundColor: grade.color }}
                        >
                          <span className="text-xl font-bold text-white">{grade.label}</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: grade.color }}>{rate}%</p>
                        <p className="text-xs text-gray-500 mt-1">{data.correct}/{data.total}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* 글 구조 파악 분석 */}
          {session.analysis && Object.keys(session.analysis.sentenceByStructure || {}).length > 0 && (
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">글 구조 파악 분석</h3>
              </div>
              <div className="border rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-4">
                  글의 전개 방식과 논리 구조를 파악하는 능력을 분석합니다.
                </p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(session.analysis.sentenceByStructure).map(([type, data]) => {
                    const rate = calculateRate(data.correct, data.total);
                    const grade = getGrade(rate);
                    const label = STRUCTURE_TYPE_LABELS[type] || type;
                    return (
                      <div
                        key={type}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg border"
                        style={{ backgroundColor: `${grade.color}10`, borderColor: `${grade.color}40` }}
                      >
                        <span className="font-medium text-gray-800">{label}</span>
                        <span
                          className="px-2 py-1 rounded text-white text-sm font-bold"
                          style={{ backgroundColor: grade.color }}
                        >
                          {rate}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* 독해 유형 분석 */}
          {session.analysis && (session.analysis.readingByType.factual.total > 0 || session.analysis.readingByType.inferential.total > 0) && (
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Scroll className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">독해 유형 분석</h3>
              </div>
              <div className="border rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-4">
                  지문을 읽고 정보를 파악하는 방식을 사실적 독해와 추론적 독해로 구분하여 분석합니다.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {(['factual', 'inferential'] as const).map((type) => {
                    const data = session.analysis!.readingByType[type];
                    if (data.total === 0) return null;
                    const rate = calculateRate(data.correct, data.total);
                    const grade = getGrade(rate);
                    const descriptions = {
                      factual: '지문에 명시된 정보를 정확히 찾아내는 능력',
                      inferential: '지문의 내용을 바탕으로 숨겨진 의미를 파악하는 능력',
                    };
                    return (
                      <div key={type} className="p-5 rounded-xl bg-gray-50 border text-center">
                        <p className="text-sm font-medium text-gray-700 mb-3">{READING_TYPE_LABELS[type]}</p>
                        <div
                          className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-2"
                          style={{ backgroundColor: grade.color }}
                        >
                          <span className="text-xl font-bold text-white">{grade.label}</span>
                        </div>
                        <p className="text-3xl font-bold" style={{ color: grade.color }}>{rate}%</p>
                        <p className="text-xs text-gray-500 mt-1">{data.correct}/{data.total}</p>
                        <p className="text-xs text-gray-500 mt-2">{descriptions[type]}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* 수능형 도메인별 분석 */}
          {session.analysis && Object.keys(session.analysis.suneungByDomain || {}).length > 0 && (
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-900">수능형 영역별 분석</h3>
              </div>
              <div className="border rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-4">
                  수능형 지문의 주제 영역별로 이해도를 분석합니다. 각 영역에서 다루는 지문의 특성에 따라 학습 방향을 설정할 수 있습니다.
                </p>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(session.analysis.suneungByDomain).map(([domain, data]) => {
                    const rate = calculateRate(data.correct, data.total);
                    const grade = getGrade(rate);
                    const label = DOMAIN_LABELS[domain] || domain;
                    return (
                      <div key={domain} className="text-center p-3 bg-gray-50 rounded-xl border">
                        <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
                        <p className="text-2xl font-bold" style={{ color: grade.color }}>{rate}%</p>
                        <p className="text-xs text-gray-500">{data.correct}/{data.total}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* 영역별 평균 풀이 시간 */}
          {session.analysis && Object.keys(session.analysis.avgTimeByArea || {}).length > 0 && (
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Timer className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-bold text-gray-900">영역별 평균 풀이 시간</h3>
              </div>
              <div className="border rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-4">
                  각 영역에서 문제 하나를 푸는 데 걸린 평균 시간입니다. 너무 빠르거나 느린 영역은 학습 전략 조정이 필요할 수 있습니다.
                </p>
                <div className="grid grid-cols-4 gap-4">
                  {(['vocab', 'sentence', 'reading', 'suneung'] as const).map((area) => {
                    const data = session.analysis?.avgTimeByArea?.[area];
                    if (!data) return null;
                    const config = AREA_CONFIG[area];
                    return (
                      <div key={area} className="text-center p-4 bg-gray-50 rounded-xl">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
                          style={{ backgroundColor: `${config.color}15` }}
                        >
                          <config.icon className="w-5 h-5" style={{ color: config.color }} />
                        </div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{config.label}</p>
                        <p className="text-xl font-bold text-gray-900">{formatTimeMs(data.avgMs)}</p>
                        <p className="text-xs text-gray-500">문항당 평균</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 종합 분석 코멘트 */}
        {session.analysis && session.analysis.overallComments.length > 0 && (
          <section className="mb-6">
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
              <h3 className="text-base font-bold text-blue-800 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                종합 분석 및 학습 제안
              </h3>
              <ul className="space-y-3">
                {session.analysis.overallComments.map((comment, i) => (
                  <li key={i} className="flex items-start gap-3 text-blue-800">
                    <ChevronRight className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" />
                    <span>{comment}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 푸터 */}
        <footer className="mt-10 pt-6 border-t text-center text-sm text-gray-500">
          <p>본 리포트는 학생의 현재 국어 학습 수준을 진단한 결과입니다.</p>
          <p className="mt-1">정확한 학습 방향 설정을 위해 담당 선생님과 상담을 권장합니다.</p>
          {session.academy_name && (
            <p className="mt-4 font-bold text-xl text-gray-700">{session.academy_name}</p>
          )}
          <p className="text-xl text-gray-600">연락처: 010-3745-9631</p>
        </footer>
      </div>

      {/* 인쇄 스타일 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
