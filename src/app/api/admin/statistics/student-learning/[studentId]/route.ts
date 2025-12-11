import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface DailyData {
  date: string;
  count: number;
  accuracy: number | null;
}

interface StudentLearningHistory {
  wordPang: DailyData[];
  sentenceClinic: DailyData[];
  passageQuiz: DailyData[];
}

// 학생별 일별 학습 추이 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
): Promise<NextResponse> {
  try {
    const { studentId } = await params;
    const studentIdNum = parseInt(studentId, 10);

    if (isNaN(studentIdNum)) {
      return NextResponse.json({ error: '유효하지 않은 학생 ID입니다.' }, { status: 400 });
    }

    // 단어팡 & 보물찾기 일별 데이터 조회 (test_session 테이블)
    const { data: sessions, error: sessionsError } = await supabase
      .from('test_session')
      .select('test_type, total_items, accuracy_rate, completed_at')
      .eq('student_id', studentIdNum)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true });

    if (sessionsError) {
      console.error('테스트 세션 조회 오류:', sessionsError);
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    // 문장클리닉 일별 데이터 조회 (short_passage_learning_history 테이블)
    const { data: sentenceData, error: sentenceError } = await supabase
      .from('short_passage_learning_history')
      .select('cloze_is_correct, keyword_is_correct, created_at')
      .eq('student_id', studentIdNum)
      .order('created_at', { ascending: true });

    if (sentenceError) {
      console.error('문장클리닉 조회 오류:', sentenceError);
      return NextResponse.json({ error: sentenceError.message }, { status: 500 });
    }

    // 단어팡 일별 집계
    const wordPangByDate: Record<string, { count: number; accuracySum: number; sessionCount: number }> = {};
    // 보물찾기 일별 집계
    const passageQuizByDate: Record<string, { count: number; accuracySum: number; sessionCount: number }> = {};

    sessions?.forEach((session) => {
      const date = new Date(session.completed_at).toISOString().split('T')[0];
      const accuracy = parseFloat(session.accuracy_rate) || 0;

      if (session.test_type === 'word_pang') {
        if (!wordPangByDate[date]) {
          wordPangByDate[date] = { count: 0, accuracySum: 0, sessionCount: 0 };
        }
        wordPangByDate[date].count += session.total_items || 0;
        wordPangByDate[date].accuracySum += accuracy;
        wordPangByDate[date].sessionCount += 1;
      } else if (session.test_type === 'passage_quiz') {
        if (!passageQuizByDate[date]) {
          passageQuizByDate[date] = { count: 0, accuracySum: 0, sessionCount: 0 };
        }
        passageQuizByDate[date].count += 1;
        passageQuizByDate[date].accuracySum += accuracy;
        passageQuizByDate[date].sessionCount += 1;
      }
    });

    // 문장클리닉 일별 집계
    const sentenceClinicByDate: Record<string, { count: number; correctCount: number; totalQuestions: number }> = {};

    sentenceData?.forEach((record) => {
      const date = new Date(record.created_at).toISOString().split('T')[0];

      if (!sentenceClinicByDate[date]) {
        sentenceClinicByDate[date] = { count: 0, correctCount: 0, totalQuestions: 0 };
      }
      sentenceClinicByDate[date].count += 1;
      sentenceClinicByDate[date].totalQuestions += 2;
      if (record.cloze_is_correct) sentenceClinicByDate[date].correctCount += 1;
      if (record.keyword_is_correct) sentenceClinicByDate[date].correctCount += 1;
    });

    // 결과 데이터 포맷팅
    const wordPang: DailyData[] = Object.entries(wordPangByDate).map(([date, data]) => ({
      date,
      count: data.count,
      accuracy: data.sessionCount > 0 ? Math.round(data.accuracySum / data.sessionCount) : null
    }));

    const passageQuiz: DailyData[] = Object.entries(passageQuizByDate).map(([date, data]) => ({
      date,
      count: data.count,
      accuracy: data.sessionCount > 0 ? Math.round(data.accuracySum / data.sessionCount) : null
    }));

    const sentenceClinic: DailyData[] = Object.entries(sentenceClinicByDate).map(([date, data]) => ({
      date,
      count: data.count,
      accuracy: data.totalQuestions > 0 ? Math.round((data.correctCount / data.totalQuestions) * 100) : null
    }));

    const result: StudentLearningHistory = {
      wordPang,
      sentenceClinic,
      passageQuiz
    };

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('학생별 학습 추이 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
