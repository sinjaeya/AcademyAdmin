import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/teacher/passage-guide/[studentId]
 * 학생의 최근 학습한 지문 목록 조회
 * test_session과 test_result를 join하여 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await context.params;
    const supabase = createServerClient();

    // test_session과 test_result를 join하여 passage_quiz 타입의 데이터 가져오기
    const { data: sessions, error } = await supabase
      .from('test_session')
      .select(`
        id,
        student_id,
        test_type,
        started_at,
        completed_at,
        metadata,
        test_result (
          id,
          item_id,
          item_uuid
        )
      `)
      .eq('student_id', studentId)
      .eq('test_type', 'passage_quiz')
      .order('started_at', { ascending: false })
      .limit(200); // 최근 200개 세션

    if (error) {
      console.error('Error fetching test sessions:', error);
      return NextResponse.json(
        { error: '학습 데이터를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 지문 코드 수집 (중복 제거)
    const passageCodes = new Set<string>();
    const passageMap = new Map<string, {
      code: string;
      category: string;
      studyDate: string;
      sessionId: number;
    }>();

    if (sessions) {
      for (const session of sessions) {
        // metadata에서 passage_code 추출
        let passageCode: string | null = null;
        let category: string = '';

        if (session.metadata && typeof session.metadata === 'object') {
          const metadata = session.metadata as any;
          passageCode = metadata.passage_code || null;
          
          // category 정보가 있으면 사용, 없으면 passage_code로 대체
          if (metadata.category) {
            category = metadata.category;
          } else if (passageCode) {
            category = passageCode;
          }
        }

        // passage_code가 있고 아직 추가되지 않은 경우에만 추가
        if (passageCode && !passageCodes.has(passageCode)) {
          passageCodes.add(passageCode);
          
          // 날짜 추출 (started_at 사용)
          const studyDate = session.started_at 
            ? new Date(session.started_at).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

          passageMap.set(passageCode, {
            code: passageCode,
            category: category || passageCode,
            studyDate,
            sessionId: session.id
          });
        }
      }
    }

    // 각 지문에 대한 OX 퀴즈 통계 조회
    const passageList = Array.from(passageMap.values());
    
    for (const passage of passageList) {
      // passage 테이블에서 passage_id 찾기
      const { data: passageData } = await supabase
        .from('passage')
        .select('passage_id')
        .eq('code_id', passage.code)
        .single();

      if (passageData?.passage_id) {
        // passage_quiz_ox에서 해당 지문의 퀴즈 목록 가져오기
        const { data: quizzes } = await supabase
          .from('passage_quiz_ox')
          .select('quiz_id')
          .eq('passage_id', passageData.passage_id);

        const quizIds = quizzes?.map((q: any) => q.quiz_id) || [];

        if (quizIds.length > 0) {
          // test_result에서 학생의 답안 가져오기
          const { data: testResults } = await supabase
            .from('test_result')
            .select('is_correct')
            .eq('student_id', studentId)
            .in('item_uuid', quizIds);

          const totalQuizzes = quizIds.length;
          const correctCount = testResults?.filter((tr: any) => tr.is_correct === true).length || 0;
          const incorrectCount = testResults?.filter((tr: any) => tr.is_correct === false).length || 0;

          (passage as any).quizStats = {
            total: totalQuizzes,
            correct: correctCount,
            incorrect: incorrectCount
          };
        } else {
          (passage as any).quizStats = {
            total: 0,
            correct: 0,
            incorrect: 0
          };
        }
      } else {
        (passage as any).quizStats = {
          total: 0,
          correct: 0,
          incorrect: 0
        };
      }
    }

    // 최근 학습일 기준으로 정렬
    passageList.sort((a, b) => {
      const dateA = new Date(a.studyDate);
      const dateB = new Date(b.studyDate);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ data: passageList });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

