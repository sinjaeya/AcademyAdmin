import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 이지국어교습소 academy_id
const EJIGUK_ACADEMY_ID = '219a944e-529b-4b50-ad73-4ed694af8af8';

// 풀스택-국어 학생 통계 조회 (이지국어교습소 재원 학생만)
export async function GET(): Promise<NextResponse> {
  try {
    // 이지국어교습소 재원 학생 목록 조회
    const { data: students, error: studentsError } = await supabase
      .from('student')
      .select('id, name, school, grade, status')
      .eq('status', '재원')
      .eq('academy_id', EJIGUK_ACADEMY_ID)
      .order('name', { ascending: true });

    if (studentsError) {
      console.error('학생 목록 조회 오류:', studentsError);
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }

    // 테스트 세션 통계 조회 (완료된 세션만)
    const { data: sessions, error: sessionsError } = await supabase
      .from('test_session')
      .select('student_id, test_type, total_items')
      .not('completed_at', 'is', null);

    if (sessionsError) {
      console.error('테스트 세션 조회 오류:', sessionsError);
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    // 학생별 통계 집계
    const studentStats: Record<number, {
      wordPangCount: number;
      sentenceLearningCount: number;
      passageQuizCount: number;
    }> = {};

    sessions?.forEach((session) => {
      const studentId = session.student_id;
      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          wordPangCount: 0,
          sentenceLearningCount: 0,
          passageQuizCount: 0
        };
      }

      switch (session.test_type) {
        case 'word_pang':
          studentStats[studentId].wordPangCount += 1;
          break;
        case 'sentence_learning':
          studentStats[studentId].sentenceLearningCount += 1;
          break;
        case 'passage_quiz':
          studentStats[studentId].passageQuizCount += 1;
          break;
      }
    });

    // 학생 데이터와 통계 결합
    const result = students?.map((student) => {
      const stats = studentStats[student.id] || {
        wordPangCount: 0,
        sentenceLearningCount: 0,
        passageQuizCount: 0
      };

      return {
        id: student.id,
        name: student.name,
        school: student.school,
        grade: student.grade,
        status: student.status,
        wordPangCount: stats.wordPangCount,
        sentenceLearningCount: stats.sentenceLearningCount,
        passageQuizCount: stats.passageQuizCount,
        totalCount: stats.wordPangCount + stats.sentenceLearningCount + stats.passageQuizCount
      };
    }) || [];

    // 전체 통계 계산
    const totalStats = {
      totalStudents: result.length,
      totalWordPang: result.reduce((sum, s) => sum + s.wordPangCount, 0),
      totalSentenceLearning: result.reduce((sum, s) => sum + s.sentenceLearningCount, 0),
      totalPassageQuiz: result.reduce((sum, s) => sum + s.passageQuizCount, 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        students: result,
        summary: totalStats
      }
    });
  } catch (error) {
    console.error('학생별 학습통계 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
