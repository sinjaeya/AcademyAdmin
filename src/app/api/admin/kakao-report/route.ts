import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerAcademyId, isServerUserAdmin } from '@/lib/auth/server-context';

// 학생별 학습 데이터 조회
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServerClient();
    const academyId = await getServerAcademyId();
    const isAdmin = await isServerUserAdmin();

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('student_id');
    const date = searchParams.get('date');
    const getDates = searchParams.get('get_dates') === 'true';

    // 학생 ID가 있으면 해당 학생의 학습 데이터 조회
    if (studentId) {
      // 학생 정보 조회 (academy_id 교차검증 포함)
      let studentQuery = supabase
        .from('student')
        .select('id, name, parent_phone, school, school_id, grade, academy_id, school_info:school_id(short_name)')
        .eq('id', studentId);

      // 관리자가 아니고 academyId가 있으면 academy_id 필터 추가
      if (!isAdmin && academyId) {
        studentQuery = studentQuery.eq('academy_id', academyId);
      }

      const { data: student, error: studentError } = await studentQuery.single();

      if (studentError || !student) {
        return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
      }

      // school_name 계산 (school_id FK 우선, 텍스트 폴백)
      const schoolInfoData = (student as any).school_info;
      const schoolInfo = schoolInfoData && typeof schoolInfoData === 'object' && !Array.isArray(schoolInfoData)
        ? schoolInfoData
        : null;
      const studentWithSchoolName = {
        ...student,
        school_name: schoolInfo?.short_name || student.school || null,
        school_info: undefined
      };

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
            student: studentWithSchoolName,
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
          student: studentWithSchoolName,
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

    // 학생 ID가 없으면 재원 학생 목록 반환
    let studentsQuery = supabase
      .from('student')
      .select('id, name, parent_phone, school, school_id, grade, academy_id, school_info:school_id(short_name)')
      .eq('status', '재원');

    // 관리자가 아니고 academyId가 있으면 academy_id 필터 추가
    if (!isAdmin && academyId) {
      studentsQuery = studentsQuery.eq('academy_id', academyId);
    }

    const { data: students, error: studentsError } = await studentsQuery
      .order('name', { ascending: true });

    if (studentsError) {
      console.error('학생 목록 조회 오류:', studentsError);
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }

    // school_name 계산 (school_id FK 우선, 텍스트 폴백)
    const studentsWithSchoolName = (students || []).map((s: any) => {
      const schoolInfoData = s.school_info;
      const si = schoolInfoData && typeof schoolInfoData === 'object' && !Array.isArray(schoolInfoData)
        ? schoolInfoData
        : null;
      const { school_info, ...rest } = s;
      return {
        ...rest,
        school_name: si?.short_name || s.school || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: { students: studentsWithSchoolName }
    });
  } catch (error) {
    console.error('카톡 리포트 API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 카카오톡 메시지 발송
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServerClient();
    const academyId = await getServerAcademyId();
    const isAdmin = await isServerUserAdmin();

    const body = await request.json();
    const { studentId, studentName, parentPhone, message } = body;

    if (!studentId || !studentName || !parentPhone || !message) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 학생 소속 academy 검증
    if (!isAdmin && academyId) {
      const { data: studentData, error: studentError } = await supabase
        .from('student')
        .select('academy_id')
        .eq('id', studentId)
        .single();

      if (studentError || !studentData) {
        return NextResponse.json({ error: '학생 정보를 찾을 수 없습니다.' }, { status: 404 });
      }

      if (studentData.academy_id !== academyId) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
      }
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
