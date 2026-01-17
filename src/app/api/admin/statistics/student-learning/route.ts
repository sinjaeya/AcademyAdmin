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
      .select('id, name, school, grade, status, sentence_level')
      .eq('status', '재원')
      .eq('academy_id', EJIGUK_ACADEMY_ID)
      .order('name', { ascending: true });

    if (studentsError) {
      console.error('학생 목록 조회 오류:', studentsError);
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }

    // 테스트 세션 통계 조회 (완료된 세션만) - 정답률, 정답 수, 메타데이터 포함
    const { data: sessions, error: sessionsError } = await supabase
      .from('test_session')
      .select('student_id, test_type, total_items, accuracy_rate, correct_count, metadata')
      .not('completed_at', 'is', null);

    if (sessionsError) {
      console.error('테스트 세션 조회 오류:', sessionsError);
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    // 학생별 통계 집계
    const studentStats: Record<number, {
      wordPangCount: number;
      wordPangAccuracySum: number;
      wordPangSessionCount: number;
      passageQuizCount: number;
      passageQuizAccuracySum: number;
      passageQuizSessionCount: number;
      sentenceLearningCount: number;
      sentenceLearningCorrectCount: number;
      sentenceLearningTotalQuestions: number;
      handwritingCount: number;
      handwritingPassages: Set<string>;
    }> = {};

    sessions?.forEach((session) => {
      const studentId = session.student_id;
      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          wordPangCount: 0,
          wordPangAccuracySum: 0,
          wordPangSessionCount: 0,
          passageQuizCount: 0,
          passageQuizAccuracySum: 0,
          passageQuizSessionCount: 0,
          sentenceLearningCount: 0,
          sentenceLearningCorrectCount: 0,
          sentenceLearningTotalQuestions: 0,
          handwritingCount: 0,
          handwritingPassages: new Set()
        };
      }

      const accuracy = parseFloat(session.accuracy_rate) || 0;

      switch (session.test_type) {
        case 'word_pang':
          studentStats[studentId].wordPangCount += session.total_items || 0;
          studentStats[studentId].wordPangAccuracySum += accuracy;
          studentStats[studentId].wordPangSessionCount += 1;
          break;
        case 'passage_quiz':
          studentStats[studentId].passageQuizCount += 1;
          studentStats[studentId].passageQuizAccuracySum += accuracy;
          studentStats[studentId].passageQuizSessionCount += 1;
          break;
        case 'sentence_clinic':
          studentStats[studentId].sentenceLearningCount += 1;
          studentStats[studentId].sentenceLearningCorrectCount += (session.correct_count || 0);
          studentStats[studentId].sentenceLearningTotalQuestions += (session.total_items || 0);
          break;
        case 'handwriting':
          studentStats[studentId].handwritingCount += 1;
          if (session.metadata && (session.metadata as any).passage_id) {
            studentStats[studentId].handwritingPassages.add((session.metadata as any).passage_id);
          }
          break;
      }
    });

    // 학생 데이터와 통계 결합
    const result = students?.map((student) => {
      const stats = studentStats[student.id] || {
        wordPangCount: 0,
        wordPangAccuracySum: 0,
        wordPangSessionCount: 0,
        passageQuizCount: 0,
        passageQuizAccuracySum: 0,
        passageQuizSessionCount: 0,
        sentenceLearningCount: 0,
        sentenceLearningCorrectCount: 0,
        sentenceLearningTotalQuestions: 0,
        handwritingCount: 0,
        handwritingPassages: new Set()
      };

      // 평균 정답률 계산
      const wordPangAccuracy = stats.wordPangSessionCount > 0
        ? Math.round(stats.wordPangAccuracySum / stats.wordPangSessionCount)
        : null;
      const sentenceLearningAccuracy = stats.sentenceLearningTotalQuestions > 0
        ? Math.round((stats.sentenceLearningCorrectCount / stats.sentenceLearningTotalQuestions) * 100)
        : null;
      const passageQuizAccuracy = stats.passageQuizSessionCount > 0
        ? Math.round(stats.passageQuizAccuracySum / stats.passageQuizSessionCount)
        : null;

      return {
        id: student.id,
        name: student.name,
        school: student.school,
        grade: student.grade,
        status: student.status,
        sentenceLevel: student.sentence_level,
        wordPangCount: stats.wordPangCount,
        wordPangAccuracy,
        sentenceLearningCount: stats.sentenceLearningCount,
        sentenceLearningAccuracy,
        passageQuizCount: stats.passageQuizCount,
        passageQuizAccuracy,
        handwritingCount: stats.handwritingCount,
        handwritingPassageCount: stats.handwritingPassages.size,
        totalCount: stats.wordPangCount + stats.sentenceLearningCount + stats.passageQuizCount + stats.handwritingCount
      };
    }) || [];

    // 전체 통계 계산
    const totalStats = {
      totalStudents: result.length,
      totalWordPang: result.reduce((sum, s) => sum + s.wordPangCount, 0),
      totalSentenceLearning: result.reduce((sum, s) => sum + s.sentenceLearningCount, 0),
      totalPassageQuiz: result.reduce((sum, s) => sum + s.passageQuizCount, 0),
      totalHandwriting: result.reduce((sum, s) => sum + s.handwritingCount, 0)
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
