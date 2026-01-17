// 레벨테스트 상세 조회 API
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const supabase = createServerClient();
    const { sessionId } = await params;

    // 세션 정보 조회 (학생 정보 포함)
    const { data: session, error: sessionError } = await supabase
      .from('level_test_session')
      .select(`
        id,
        student_id,
        status,
        started_at,
        completed_at,
        elapsed_seconds,
        initial_difficulty,
        current_difficulty,
        progress,
        results,
        recommended_level,
        created_at,
        student:student_id (
          id,
          name,
          grade,
          academy_id
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('세션 조회 오류:', sessionError);
      return NextResponse.json(
        { success: false, error: '세션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 개별 답안 조회
    const { data: resultsItems, error: resultsError } = await supabase
      .from('level_test_result')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_index', { ascending: true });

    if (resultsError) {
      console.error('답안 조회 오류:', resultsError);
    }

    // 세분화 분석 생성
    const analysis = generateAnalysis(resultsItems || []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const studentInfo = session.student as any;

    const sessionDetail = {
      id: session.id,
      student_id: session.student_id,
      student_name: studentInfo?.name || '알 수 없음',
      student_grade: studentInfo?.grade || null,
      status: session.status,
      started_at: session.started_at,
      completed_at: session.completed_at,
      elapsed_seconds: session.elapsed_seconds,
      initial_difficulty: session.initial_difficulty,
      current_difficulty: session.current_difficulty,
      progress: session.progress,
      results: session.results,
      recommended_level: session.recommended_level,
      created_at: session.created_at,
      results_items: resultsItems || [],
      analysis,
    };

    return NextResponse.json({
      success: true,
      data: sessionDetail
    });
  } catch (error) {
    console.error('레벨테스트 상세 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 세분화 분석 생성 함수
interface ResultItem {
  question_type: string;
  is_correct: boolean;
  sub_type: string | null;
}

interface AnalysisResult {
  overallComments: string[];
  readingByType: {
    factual: { correct: number; total: number };
    inferential: { correct: number; total: number };
  };
  sentenceByStructure: Record<string, { correct: number; total: number }>;
  suneungByDomain: Record<string, { correct: number; total: number }>;
}

function generateAnalysis(items: ResultItem[]): AnalysisResult {
  const analysis: AnalysisResult = {
    overallComments: [],
    readingByType: {
      factual: { correct: 0, total: 0 },
      inferential: { correct: 0, total: 0 },
    },
    sentenceByStructure: {},
    suneungByDomain: {},
  };

  for (const item of items) {
    // 장문 독해 유형별 분석
    if (item.question_type === 'reading' && item.sub_type) {
      if (item.sub_type === 'factual') {
        analysis.readingByType.factual.total++;
        if (item.is_correct) analysis.readingByType.factual.correct++;
      } else if (item.sub_type === 'inferential') {
        analysis.readingByType.inferential.total++;
        if (item.is_correct) analysis.readingByType.inferential.correct++;
      }
    }

    // 단문 구조 유형별 분석
    if (item.question_type === 'sentence' && item.sub_type) {
      if (!analysis.sentenceByStructure[item.sub_type]) {
        analysis.sentenceByStructure[item.sub_type] = { correct: 0, total: 0 };
      }
      analysis.sentenceByStructure[item.sub_type].total++;
      if (item.is_correct) analysis.sentenceByStructure[item.sub_type].correct++;
    }

    // 수능형 도메인별 분석
    if (item.question_type === 'suneung' && item.sub_type) {
      if (!analysis.suneungByDomain[item.sub_type]) {
        analysis.suneungByDomain[item.sub_type] = { correct: 0, total: 0 };
      }
      analysis.suneungByDomain[item.sub_type].total++;
      if (item.is_correct) analysis.suneungByDomain[item.sub_type].correct++;
    }
  }

  // 코멘트 생성
  const vocabItems = items.filter(i => i.question_type === 'vocab');
  const vocabCorrect = vocabItems.filter(i => i.is_correct).length;
  const vocabRate = vocabItems.length > 0 ? (vocabCorrect / vocabItems.length) * 100 : 0;

  const sentenceItems = items.filter(i => i.question_type === 'sentence');
  const sentenceCorrect = sentenceItems.filter(i => i.is_correct).length;
  const sentenceRate = sentenceItems.length > 0 ? (sentenceCorrect / sentenceItems.length) * 100 : 0;

  const readingItems = items.filter(i => i.question_type === 'reading');
  const readingCorrect = readingItems.filter(i => i.is_correct).length;
  const readingRate = readingItems.length > 0 ? (readingCorrect / readingItems.length) * 100 : 0;

  // 코멘트 추가
  if (vocabRate >= 80) {
    analysis.overallComments.push('어휘력이 우수합니다.');
  } else if (vocabRate < 60) {
    analysis.overallComments.push('어휘력 보강이 필요합니다. 한자어 학습을 권장합니다.');
  }

  if (sentenceRate >= 80) {
    analysis.overallComments.push('글 구조 파악 능력이 뛰어납니다.');
  } else if (sentenceRate < 60) {
    analysis.overallComments.push('글 구조 파악 연습이 필요합니다.');
  }

  if (readingRate >= 80) {
    analysis.overallComments.push('독해력이 우수합니다.');
  } else if (readingRate < 60) {
    analysis.overallComments.push('독해력 향상을 위한 지문 연습을 권장합니다.');
  }

  // 추론적 독해가 약한 경우
  const inferentialRate = analysis.readingByType.inferential.total > 0
    ? (analysis.readingByType.inferential.correct / analysis.readingByType.inferential.total) * 100
    : 0;
  if (inferentialRate < 60 && analysis.readingByType.inferential.total > 0) {
    analysis.overallComments.push('추론적 독해 능력 보강이 필요합니다.');
  }

  return analysis;
}
