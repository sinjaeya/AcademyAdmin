import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const supabase = createServerClient();

    // 총 콘텐츠 수 조회 (병렬)
    const [vocaRes, passageRes, quizRes, hwRes] = await Promise.all([
      supabase.from('korean_voca_quiz').select('*', { count: 'exact', head: true }),
      supabase.from('short_passage_v2').select('*', { count: 'exact', head: true }),
      supabase.from('passage_quiz_ox').select('*', { count: 'exact', head: true }),
      supabase.from('handwriting_passage').select('*', { count: 'exact', head: true }),
    ]);

    // 학생의 완료 세션 수 조회 (test_type별 그룹)
    const { data: sessions } = await supabase
      .from('test_session')
      .select('test_type, completed_at')
      .eq('student_id', Number(studentId))
      .in('test_type', ['word_pang', 'passage_quiz', 'sentence_clinic_v2', 'handwriting'])
      .not('completed_at', 'is', null);

    // test_type별 완료 세션 수 집계
    const completedCounts: Record<string, number> = {};
    sessions?.forEach(s => {
      completedCounts[s.test_type] = (completedCounts[s.test_type] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        wordPang: { total: vocaRes.count ?? 0, completed: completedCounts['word_pang'] ?? 0 },
        sentenceClinic: { total: passageRes.count ?? 0, completed: completedCounts['sentence_clinic_v2'] ?? 0 },
        passageQuiz: { total: quizRes.count ?? 0, completed: completedCounts['passage_quiz'] ?? 0 },
        handwriting: { total: hwRes.count ?? 0, completed: completedCounts['handwriting'] ?? 0 },
      }
    });
  } catch (error) {
    console.error('학생 진행현황 조회 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
}
