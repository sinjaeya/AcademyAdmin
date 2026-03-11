import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerAcademyId, isServerUserAdmin } from '@/lib/auth/server-context';

// 사전 검색기록 목록 조회
export async function GET(request: NextRequest) {
  try {
    const academyId = await getServerAcademyId();
    const isAdmin = await isServerUserAdmin();
    const searchParams = request.nextUrl.searchParams;

    // 페이지네이션 파라미터
    const pageParam = Number(searchParams.get('page') ?? '1');
    const page = pageParam > 0 ? pageParam : 1;
    const pageSize = 50;

    // 필터 파라미터
    const search = searchParams.get('search');
    const studentId = searchParams.get('student_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const supabase = createServerClient();

    // 쿼리 빌더
    let query = supabase
      .from('dictionary_search_log')
      .select('id, query, searched_at, student:student_id(id, name)', { count: 'exact' })
      .order('searched_at', { ascending: false });

    // 학원 격리: 관리자가 아니면 본인 학원 학생만 조회
    if (!isAdmin && !academyId) {
      return NextResponse.json(
        { success: false, error: '학원 정보가 없습니다.' },
        { status: 403 }
      );
    }
    if (!isAdmin && academyId) {
      const { data: students } = await supabase
        .from('student')
        .select('id')
        .eq('academy_id', academyId);

      const studentIds = students?.map((s: { id: number }) => s.id) || [];

      if (studentIds.length === 0) {
        // 해당 학원에 학생이 없으면 빈 결과 반환
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          page: 1,
          pageSize
        });
      }

      query = query.in('student_id', studentIds);
    }

    // 필터 적용
    if (search) {
      query = query.ilike('query', `%${search}%`);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (dateFrom) {
      // KST 타임존 적용
      query = query.gte('searched_at', `${dateFrom}T00:00:00+09:00`);
    }
    if (dateTo) {
      // KST 타임존 적용 - 해당 일자 끝까지
      query = query.lte('searched_at', `${dateTo}T23:59:59+09:00`);
    }

    // 페이지네이션 적용
    const from = (page - 1) * pageSize;
    const { data, count, error } = await query.range(from, from + pageSize - 1);

    if (error) {
      console.error('사전 검색기록 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: '사전 검색기록을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
      total: count ?? 0,
      page,
      pageSize
    });
  } catch (error) {
    console.error('사전 검색기록 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
