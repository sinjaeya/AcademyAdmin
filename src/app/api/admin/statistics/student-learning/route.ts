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

    // 테스트 세션 통계 조회 (완료된 세션만) - 정답률 포함
    const { data: sessions, error: sessionsError } = await supabase
      .from('test_session')
      .select('student_id, test_type, total_items, accuracy_rate')
      .not('completed_at', 'is', null);

    if (sessionsError) {
      console.error('테스트 세션 조회 오류:', sessionsError);
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    // 문장클리닉 학습 기록 조회 (short_passage_learning_history 테이블) - 정답 여부 포함
    const { data: sentenceLearningData, error: sentenceLearningError } = await supabase
      .from('short_passage_learning_history')
      .select('student_id, cloze_is_correct, keyword_is_correct');

    if (sentenceLearningError) {
      console.error('문장클리닉 조회 오류:', sentenceLearningError);
      return NextResponse.json({ error: sentenceLearningError.message }, { status: 500 });
    }

    // 학생별 문장클리닉 지문 수 및 정답률 집계
    const sentenceLearningStats: Record<number, { count: number; correctCount: number; totalQuestions: number }> = {};
    sentenceLearningData?.forEach((record) => {
      const studentId = record.student_id;
      if (!sentenceLearningStats[studentId]) {
        sentenceLearningStats[studentId] = { count: 0, correctCount: 0, totalQuestions: 0 };
      }
      sentenceLearningStats[studentId].count += 1;
      // 각 지문당 2개 문제 (cloze, keyword)
      sentenceLearningStats[studentId].totalQuestions += 2;
      if (record.cloze_is_correct) sentenceLearningStats[studentId].correctCount += 1;
      if (record.keyword_is_correct) sentenceLearningStats[studentId].correctCount += 1;
    });

    // 학생별 통계 집계 (정답률 포함)
    const studentStats: Record<number, {
      wordPangCount: number;
      wordPangAccuracySum: number;
      wordPangSessionCount: number;
      passageQuizCount: number;
      passageQuizAccuracySum: number;
      passageQuizSessionCount: number;
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
          passageQuizSessionCount: 0
        };
      }

      const accuracy = parseFloat(session.accuracy_rate) || 0;

      switch (session.test_type) {
        case 'word_pang':
          // 세션 수가 아닌 학습한 총 단어 수로 변경
          studentStats[studentId].wordPangCount += session.total_items || 0;
          studentStats[studentId].wordPangAccuracySum += accuracy;
          studentStats[studentId].wordPangSessionCount += 1;
          break;
        case 'passage_quiz':
          studentStats[studentId].passageQuizCount += 1;
          studentStats[studentId].passageQuizAccuracySum += accuracy;
          studentStats[studentId].passageQuizSessionCount += 1;
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
        passageQuizSessionCount: 0
      };

      // 문장클리닉은 별도 테이블에서 조회한 데이터 사용
      const sentenceStats = sentenceLearningStats[student.id] || { count: 0, correctCount: 0, totalQuestions: 0 };

      // 평균 정답률 계산
      const wordPangAccuracy = stats.wordPangSessionCount > 0
        ? Math.round(stats.wordPangAccuracySum / stats.wordPangSessionCount)
        : null;
      const sentenceLearningAccuracy = sentenceStats.totalQuestions > 0
        ? Math.round((sentenceStats.correctCount / sentenceStats.totalQuestions) * 100)
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
        sentenceLearningCount: sentenceStats.count,
        sentenceLearningAccuracy,
        passageQuizCount: stats.passageQuizCount,
        passageQuizAccuracy,
        totalCount: stats.wordPangCount + sentenceStats.count + stats.passageQuizCount
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
