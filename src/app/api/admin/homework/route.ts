import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 숙제 현황 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;

    const academyId = searchParams.get('academy_id');
    const dateParam = searchParams.get('date');
    const statusFilter = searchParams.get('status') || 'all'; // all | pending | completed

    // 날짜 기본값: 오늘 (KST 기준)
    const targetDate = dateParam || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });

    if (!academyId) {
      return NextResponse.json({ success: false, error: 'academy_id는 필수입니다.' }, { status: 400 });
    }

    // homework_assignment 조회 (학원 격리: student.academy_id 기준)
    let query = supabase
      .from('homework_assignment')
      .select(`
        id,
        student_id,
        assigned_date,
        word_count,
        session_id,
        completed_at,
        student:student_id (
          id,
          name,
          school,
          grade,
          academy_id
        )
      `)
      .eq('assigned_date', targetDate);

    const { data: assignments, error: assignError } = await query;

    if (assignError) {
      console.error('homework_assignment 조회 오류:', assignError);
      return NextResponse.json({ success: false, error: '숙제 현황 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 학원 격리 필터 적용 (student.academy_id 기준)
    const filtered = (assignments || []).filter((row) => {
      // Supabase JOIN 결과는 배열 또는 단일 객체일 수 있음
      const student = Array.isArray(row.student) ? row.student[0] : row.student;
      const s = student as { academy_id?: string } | null;
      return s?.academy_id === academyId;
    });

    // 상태 필터 적용
    const statusFiltered = filtered.filter((row) => {
      if (statusFilter === 'completed') return row.completed_at !== null;
      if (statusFilter === 'pending') return row.completed_at === null;
      return true;
    });

    // 완료된 항목의 정답률 조회 (session_id → test_session.score)
    const completedSessionIds = statusFiltered
      .filter((row) => row.session_id !== null)
      .map((row) => row.session_id as number);

    let scoreMap: Record<number, number | null> = {};

    if (completedSessionIds.length > 0) {
      const { data: sessions, error: sessionError } = await supabase
        .from('test_session')
        .select('id, score')
        .in('id', completedSessionIds);

      if (sessionError) {
        console.error('test_session 조회 오류:', sessionError);
      } else {
        for (const s of sessions || []) {
          scoreMap[s.id] = s.score;
        }
      }
    }

    // 응답 데이터 구성
    const data = statusFiltered.map((row) => {
      // Supabase JOIN 결과는 배열 또는 단일 객체일 수 있음
      const rawStudent = Array.isArray(row.student) ? row.student[0] : row.student;
      const student = rawStudent as {
        id: number;
        name: string;
        school: string | null;
        grade: string | null;
        academy_id: string | null;
      } | null;

      const score = row.session_id !== null ? (scoreMap[row.session_id] ?? null) : null;

      return {
        id: row.id,
        student_id: row.student_id,
        student_name: student?.name || '',
        school: student?.school || '',
        grade: student?.grade || '',
        assigned_date: row.assigned_date,
        word_count: row.word_count,
        session_id: row.session_id,
        completed_at: row.completed_at,
        is_completed: row.completed_at !== null,
        score, // 정답률 (0~100 또는 null)
      };
    });

    // 이름 기준 정렬
    data.sort((a, b) => a.student_name.localeCompare(b.student_name, 'ko'));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('homework GET 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 숙제 삭제 (개별 또는 날짜 전체)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;

    const id = searchParams.get('id'); // 개별 삭제
    const date = searchParams.get('date'); // 날짜 전체 삭제
    const academyId = searchParams.get('academy_id');

    if (id) {
      // 개별 삭제
      const { error } = await supabase
        .from('homework_assignment')
        .delete()
        .eq('id', Number(id));

      if (error) {
        console.error('homework_assignment 삭제 오류:', error);
        return NextResponse.json({ success: false, error: '숙제 삭제 중 오류가 발생했습니다.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: '숙제가 삭제되었습니다.' });
    }

    if (date && academyId) {
      // 날짜 전체 삭제: 해당 학원 학생의 숙제만 삭제
      const { data: students } = await supabase
        .from('student')
        .select('id')
        .eq('academy_id', academyId);

      const studentIds = (students || []).map((s) => s.id);
      if (studentIds.length === 0) {
        return NextResponse.json({ success: true, message: '삭제할 숙제가 없습니다.' });
      }

      const { error } = await supabase
        .from('homework_assignment')
        .delete()
        .eq('assigned_date', date)
        .in('student_id', studentIds);

      if (error) {
        console.error('homework_assignment 전체 삭제 오류:', error);
        return NextResponse.json({ success: false, error: '전체 삭제 중 오류가 발생했습니다.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `${date} 숙제가 전체 삭제되었습니다.` });
    }

    return NextResponse.json({ success: false, error: 'id 또는 date+academy_id 파라미터가 필요합니다.' }, { status: 400 });
  } catch (error) {
    console.error('homework DELETE 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 숙제 일괄 배정
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    const { academy_id, date, student_ids } = body as {
      academy_id: string;
      date?: string;
      student_ids?: number[];
    };

    if (!academy_id) {
      return NextResponse.json({ success: false, error: 'academy_id는 필수입니다.' }, { status: 400 });
    }

    // 날짜 기본값: 오늘 (KST 기준)
    const targetDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });

    // 대상 학생 목록 조회
    let studentsQuery = supabase
      .from('student')
      .select('id, daily_word_count')
      .eq('academy_id', academy_id)
      .eq('status', '재원');

    if (student_ids && student_ids.length > 0) {
      studentsQuery = studentsQuery.in('id', student_ids);
    }

    const { data: students, error: studentsError } = await studentsQuery;

    if (studentsError) {
      console.error('학생 조회 오류:', studentsError);
      return NextResponse.json({ success: false, error: '학생 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ success: false, error: '배정할 학생이 없습니다.' }, { status: 400 });
    }

    // 이미 배정된 학생 확인
    const allStudentIds = students.map((s) => s.id);
    const { data: existing } = await supabase
      .from('homework_assignment')
      .select('student_id')
      .eq('assigned_date', targetDate)
      .in('student_id', allStudentIds);

    const existingStudentIds = new Set((existing || []).map((e) => e.student_id));

    // 새로 배정할 학생만 필터링 (UNIQUE 제약으로 이미 배정된 학생 스킵)
    const toInsert = students
      .filter((s) => !existingStudentIds.has(s.id))
      .map((s) => ({
        student_id: s.id,
        assigned_date: targetDate,
        word_count: s.daily_word_count ?? 30,
      }));

    if (toInsert.length === 0) {
      return NextResponse.json({
        success: true,
        data: { assigned_count: 0, skipped_count: students.length },
        message: '이미 모든 학생에게 숙제가 배정되어 있습니다.',
      });
    }

    const { error: insertError } = await supabase
      .from('homework_assignment')
      .insert(toInsert);

    if (insertError) {
      console.error('homework_assignment 삽입 오류:', insertError);
      return NextResponse.json({ success: false, error: '숙제 배정 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        assigned_count: toInsert.length,
        skipped_count: students.length - toInsert.length,
      },
      message: `${toInsert.length}명에게 숙제를 배정했습니다.`,
    });
  } catch (error) {
    console.error('homework POST 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
