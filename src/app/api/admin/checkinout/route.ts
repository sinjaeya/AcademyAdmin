import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerAcademyId, isServerUserAdmin } from '@/lib/auth/server-context';

/**
 * GET /api/admin/checkinout
 * 등/하원 기록 조회 (날짜별)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    
    // 쿼리 파라미터에서 날짜 가져오기 (기본값: 오늘)
    const dateParam = searchParams.get('date');
    const selectedDate = dateParam || new Date().toISOString().split('T')[0];
    
    // 날짜 범위 설정 (UTC 기준)
    // 예: '2025-11-02' -> '2025-11-02T00:00:00.000Z' ~ '2025-11-03T00:00:00.000Z' (미만)
    const startDate = `${selectedDate}T00:00:00.000Z`;
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const endDate = `${nextDate.toISOString().split('T')[0]}T00:00:00.000Z`;

    // 학원 데이터 격리
    const academyId = await getServerAcademyId();
    const isAdmin = await isServerUserAdmin();

    let query = supabase
      .from('check_in_board')
      .select('*')
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    // 관리자가 아닌 경우 자기 학원 데이터만 조회
    if (!isAdmin && academyId) {
      query = query.eq('academy_id', academyId);
    }

    const { data: checkInOutData, error: fetchError } = await query
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('Supabase error:', fetchError);
      return NextResponse.json(
        { error: '등/하원 기록을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      data: checkInOutData || [],
      total: checkInOutData?.length || 0
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


