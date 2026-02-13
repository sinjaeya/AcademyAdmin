import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerAcademyId, isServerUserAdmin } from '@/lib/auth/server-context';

// 로그인 로그 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const academyId = await getServerAcademyId();
    const isAdmin = await isServerUserAdmin();
    const searchParams = request.nextUrl.searchParams;

    // 페이지네이션 파라미터
    const pageParam = Number(searchParams.get('page') ?? '1');
    const limitParam = Number(searchParams.get('limit') ?? '30');
    const page = pageParam > 0 ? pageParam : 1;
    const limit = limitParam > 0 && limitParam <= 100 ? limitParam : 30;
    const offset = (page - 1) * limit;

    // 필터 파라미터
    const loginType = searchParams.get('login_type');
    const success = searchParams.get('success');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // 쿼리 빌더
    let query = supabase
      .from('login_logs')
      .select('*', { count: 'exact' });

    // 학원 격리: 관리자가 아니면 본인 학원만
    if (!isAdmin && academyId) {
      query = query.eq('academy_id', academyId);
    }

    // 필터 적용
    if (loginType) {
      query = query.eq('login_type', loginType);
    }
    if (success !== null && success !== undefined && success !== '') {
      query = query.eq('success', success === 'true');
    }
    if (search) {
      query = query.or(`student_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (dateFrom) {
      // KST 타임존 적용
      query = query.gte('created_at', `${dateFrom}T00:00:00+09:00`);
    }
    if (dateTo) {
      // KST 타임존 적용 - 해당 일자 끝까지
      query = query.lte('created_at', `${dateTo}T23:59:59+09:00`);
    }

    // 정렬 + 페이지네이션
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('로그인 로그 조회 실패:', error);
      return NextResponse.json(
        { error: '로그인 로그를 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
      count: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit)
    });
  } catch (error) {
    console.error('로그인 로그 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
