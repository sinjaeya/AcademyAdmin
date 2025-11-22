import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 등/하원 데이터 타입 정의
interface CheckInOutData {
  id: string;
  student_name: string;
  check_in_time: string;
  check_in_status: string;
  check_out_time: string;
  current_academy: string;
  created_at: string;
  updated_at: string;
}

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
    
    // check_in_board 테이블에서 선택한 날짜의 데이터만 조회
    // created_at이 선택한 날짜의 00:00:00 UTC 이상이고 다음 날 00:00:00 UTC 미만인 데이터
    const { data: checkInOutData, error: fetchError } = await supabase
      .from('check_in_board')
      .select('*')
      .gte('created_at', startDate)
      .lt('created_at', endDate)
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


