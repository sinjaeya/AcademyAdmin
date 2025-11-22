import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/teacher/passage-guide/[studentId]/[code]/quiz
 * 학생의 해당 지문에 대한 OX 퀴즈 결과 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ studentId: string; code: string }> }
) {
  try {
    const { studentId, code } = await context.params;
    const supabase = createServerClient();

    // 1. passage 테이블에서 code_id로 passage_id 찾기
    const { data: passageData, error: passageError } = await supabase
      .from('passage')
      .select('passage_id')
      .eq('code_id', code)
      .single();

    if (passageError || !passageData) {
      return NextResponse.json({ data: [] });
    }

    const passageId = passageData.passage_id;

    // 2. passage_quiz_ox에서 해당 passage_id의 퀴즈 목록 가져오기
    const { data: quizzes, error: quizzesError } = await supabase
      .from('passage_quiz_ox')
      .select('*')
      .eq('passage_id', passageId)
      .order('quiz_order', { ascending: true });

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError);
      return NextResponse.json(
        { error: '퀴즈 목록을 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!quizzes || quizzes.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 3. test_result에서 학생의 답안 가져오기
    const quizIds = quizzes.map((q: any) => q.quiz_id);
    const { data: testResults, error: testResultsError } = await supabase
      .from('test_result')
      .select('*')
      .eq('student_id', studentId)
      .in('item_uuid', quizIds);

    if (testResultsError) {
      console.error('Error fetching test results:', testResultsError);
      // test_result가 없어도 퀴즈 목록은 반환
    }

    // 4. 퀴즈와 답안 매칭
    const quizResults = quizzes.map((quiz: any) => {
      const result = testResults?.find(
        (tr: any) => tr.item_uuid === quiz.quiz_id
      );

      // 학생 답안 변환 (selected_answer: 1 = O, 0 = X)
      let studentAnswer: string | null = null;
      if (result?.selected_answer !== null && result?.selected_answer !== undefined) {
        studentAnswer = result.selected_answer === 1 ? 'O' : 'X';
      }

      return {
        quiz_id: quiz.quiz_id,
        statement: quiz.statement,
        correct_answer: quiz.answer, // 정답 (O 또는 X)
        student_answer: studentAnswer, // 학생 답안 (O 또는 X 또는 null)
        is_correct: result?.is_correct ?? null,
        evidence: quiz.evidence,
        reasoning: quiz.reasoning,
        quiz_order: quiz.quiz_order,
        ox_type: quiz.ox_type,
        difficulty_level: quiz.difficulty_level
      };
    });

    return NextResponse.json({ data: quizResults });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

