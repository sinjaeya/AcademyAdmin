// 레벨테스트 목록 조회 API
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status'); // completed, in_progress, abandoned
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // 기본 쿼리 - level_test_session 조회
    let query = supabase
      .from('level_test_session')
      .select(`
        id,
        student_id,
        status,
        started_at,
        completed_at,
        elapsed_seconds,
        initial_difficulty,
        current_difficulty,
        progress,
        results,
        recommended_level,
        created_at
      `, { count: 'exact' })
      .order('started_at', { ascending: false });

    // 학원 필터링 (student 테이블의 academy_id 사용)
    if (academyId) {
      // 먼저 해당 학원의 학생 ID 목록 조회
      const { data: students } = await supabase
        .from('student')
        .select('id')
        .eq('academy_id', academyId);

      if (students && students.length > 0) {
        const studentIds = students.map(s => s.id);
        query = query.in('student_id', studentIds);
      } else {
        // 학원에 학생이 없으면 빈 결과 반환
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          page,
          pageSize
        });
      }
    }

    // 학생 ID 필터링
    if (studentId) {
      query = query.eq('student_id', parseInt(studentId, 10));
    }

    // 상태 필터링
    if (status) {
      query = query.eq('status', status);
    }

    // 페이지네이션
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('레벨테스트 목록 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '데이터 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 학생 정보 별도 조회
    const studentIds = [...new Set((data || []).map(s => s.student_id))];
    const studentMap = new Map<number, string>();

    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from('student')
        .select('id, name')
        .in('id', studentIds);

      (students || []).forEach(s => {
        studentMap.set(s.id, s.name);
      });
    }

    // 데이터 변환
    const sessions = (data || []).map((session) => {
      return {
        id: session.id,
        student_id: session.student_id,
        student_name: studentMap.get(session.student_id) || '알 수 없음',
        status: session.status,
        started_at: session.started_at,
        completed_at: session.completed_at,
        elapsed_seconds: session.elapsed_seconds,
        initial_difficulty: session.initial_difficulty,
        current_difficulty: session.current_difficulty,
        progress: session.progress,
        results: session.results,
        recommended_level: session.recommended_level,
        created_at: session.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: sessions,
      total: count || 0,
      page,
      pageSize
    });
  } catch (error) {
    console.error('레벨테스트 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
