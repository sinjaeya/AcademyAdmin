import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 시험기간 숙제 중단 (미완료 숙제 삭제)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { exam_schedule_id } = body;

    const { academy_id } = body;

    if (!exam_schedule_id) {
      return NextResponse.json(
        { success: false, error: 'exam_schedule_id는 필수입니다.' },
        { status: 400 }
      );
    }

    // 1단계: exam_schedule에서 school_id + grade 조회
    const { data: schedule, error: scheduleError } = await supabase
      .from('exam_schedule')
      .select('school_id, grade')
      .eq('id', exam_schedule_id)
      .single();

    if (scheduleError || !schedule) {
      console.error('exam_schedule 조회 오류:', scheduleError);
      return NextResponse.json(
        { success: false, error: '시험기간 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2단계: 해당 학원의 school_id + grade 학생 id 목록 조회 (학원 격리)
    let studentsQuery = supabase
      .from('student')
      .select('id')
      .eq('school_id', schedule.school_id)
      .eq('grade', schedule.grade)
      .eq('status', '재원');

    if (academy_id) {
      studentsQuery = studentsQuery.eq('academy_id', academy_id);
    }

    const { data: students, error: studentsError } = await studentsQuery;

    if (studentsError) {
      console.error('학생 목록 조회 오류:', studentsError);
      return NextResponse.json(
        { success: false, error: '학생 목록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json({
        success: true,
        data: { deleted_count: 0 },
        message: '해당 학교/학년 재원 학생이 없습니다.',
      });
    }

    const studentIds = students.map((s) => s.id);

    // 3단계: 해당 학생들의 미완료 숙제 삭제 (completed_at IS NULL)
    const { count, error: deleteError } = await supabase
      .from('homework_assignment')
      .delete({ count: 'exact' })
      .in('student_id', studentIds)
      .is('completed_at', null);

    if (deleteError) {
      console.error('homework_assignment 삭제 오류:', deleteError);
      return NextResponse.json(
        { success: false, error: '숙제 중단 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted_count: count ?? 0 },
    });
  } catch (error) {
    console.error('suspend-homework POST 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
