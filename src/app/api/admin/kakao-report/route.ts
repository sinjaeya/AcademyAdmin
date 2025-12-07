import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 이지국어교습소 academy_id
const EJIGUK_ACADEMY_ID = '219a944e-529b-4b50-ad73-4ed694af8af8';

// 학생별 학습 데이터 조회
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('student_id');
    const date = searchParams.get('date');
    const getDates = searchParams.get('get_dates') === 'true';

    // 학생 ID가 있으면 해당 학생의 학습 데이터 조회
    if (studentId) {
      // 학생 정보 조회
      const { data: student, error: studentError } = await supabase
        .from('student')
        .select('id, name, parent_phone, school, grade')
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
      }

      // 학습 이력 날짜 목록 조회 (최대 3개)
      if (getDates) {
        const { data: dateData, error: dateError } = await supabase
          .from('test_session')
          .select('completed_at')
          .eq('student_id', studentId)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false });

        if (dateError) {
          console.error('날짜 조회 오류:', dateError);
          return NextResponse.json({ error: dateError.message }, { status: 500 });
        }

        // 고유한 날짜만 추출 (최대 3개)
        const uniqueDates = [...new Set(
          dateData?.map((item) => item.completed_at?.split('T')[0]).filter(Boolean)
        )].slice(0, 3);

        return NextResponse.json({
          success: true,
          data: {
            student,
            learningDates: uniqueDates
          }
        });
      }

      // 특정 날짜의 학습 세션 조회
      if (!date) {
        return NextResponse.json({ error: '날짜를 선택해주세요.' }, { status: 400 });
      }

      // 해당 날짜의 학습 세션 조회
      const { data: sessions, error: sessionsError } = await supabase
        .from('test_session')
        .select('test_type, total_items, correct_count, accuracy_rate, metadata')
        .eq('student_id', studentId)
        .gte('completed_at', `${date}T00:00:00`)
        .lt('completed_at', `${date}T23:59:59`)
        .not('completed_at', 'is', null);

      if (sessionsError) {
        console.error('세션 조회 오류:', sessionsError);
        return NextResponse.json({ error: sessionsError.message }, { status: 500 });
      }

      // 학습 유형별 집계
      const stats = {
        wordPang: { totalItems: 0, correctCount: 0, sessions: 0 },
        sentenceLearning: { totalItems: 0, correctCount: 0, sessions: 0 },
        passageQuiz: { totalItems: 0, correctCount: 0, sessions: 0 }
      };

      sessions?.forEach((session) => {
        switch (session.test_type) {
          case 'word_pang':
            stats.wordPang.totalItems += session.total_items || 0;
            stats.wordPang.correctCount += session.correct_count || 0;
            stats.wordPang.sessions += 1;
            break;
          case 'sentence_learning':
            stats.sentenceLearning.totalItems += session.total_items || 0;
            stats.sentenceLearning.correctCount += session.correct_count || 0;
            stats.sentenceLearning.sessions += 1;
            break;
          case 'passage_quiz':
            stats.passageQuiz.totalItems += session.total_items || 0;
            stats.passageQuiz.correctCount += session.correct_count || 0;
            stats.passageQuiz.sessions += 1;
            break;
        }
      });

      // 정답률 계산
      const calculateAccuracy = (correct: number, total: number): number => {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
      };

      return NextResponse.json({
        success: true,
        data: {
          student,
          date,
          stats: {
            wordPang: {
              ...stats.wordPang,
              accuracy: calculateAccuracy(stats.wordPang.correctCount, stats.wordPang.totalItems)
            },
            sentenceLearning: {
              ...stats.sentenceLearning,
              accuracy: calculateAccuracy(stats.sentenceLearning.correctCount, stats.sentenceLearning.totalItems)
            },
            passageQuiz: {
              ...stats.passageQuiz,
              accuracy: calculateAccuracy(stats.passageQuiz.correctCount, stats.passageQuiz.totalItems)
            }
          },
          hasData: sessions && sessions.length > 0
        }
      });
    }

    // 학생 ID가 없으면 이지국어교습소 재원 학생 목록 반환
    const { data: students, error: studentsError } = await supabase
      .from('student')
      .select('id, name, parent_phone, school, grade')
      .eq('status', '재원')
      .eq('academy_id', EJIGUK_ACADEMY_ID)
      .order('name', { ascending: true });

    if (studentsError) {
      console.error('학생 목록 조회 오류:', studentsError);
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { students }
    });
  } catch (error) {
    console.error('카톡 리포트 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 카카오톡 메시지 발송
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { studentId, studentName, parentPhone, message } = body;

    if (!studentId || !studentName || !parentPhone || !message) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // webhook_log에 기록
    const { error: logError } = await supabase
      .from('webhook_log')
      .insert({
        student_id: studentId,
        student_name: studentName,
        webhook_url: 'kakao_message',
        request_payload: { parentPhone, message },
        response_status: 200,
        response_body: '메시지 발송 요청 완료'
      });

    if (logError) {
      console.error('웹훅 로그 저장 오류:', logError);
    }

    // TODO: 실제 카카오톡 API 연동 또는 Make.com 웹훅 호출
    // 현재는 로그만 저장하고 성공 응답

    return NextResponse.json({
      success: true,
      message: '카카오톡 메시지가 발송되었습니다.'
    });
  } catch (error) {
    console.error('카톡 발송 오류:', error);
    return NextResponse.json({ error: '메시지 발송 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
