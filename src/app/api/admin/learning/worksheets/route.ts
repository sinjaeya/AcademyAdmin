import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/learning/worksheets
 * 학습지 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // URL 파라미터에서 학생명 가져오기
    const searchParams = request.nextUrl.searchParams;
    const studentName = searchParams.get('student_name');
    
    if (!studentName) {
      return NextResponse.json(
        { error: '학생명이 필요합니다' },
        { status: 400 }
      );
    }
    
    // mathflat_worksheets 테이블에서 학생의 학습지 데이터 조회
    const { data, error } = await supabase
      .from('mathflat_worksheets')
      .select('*')
      .eq('student_name', studentName)
      .order('issued_date', { ascending: false });
    
    if (error) {
      console.error('학습지 데이터 조회 오류:', error);
      return NextResponse.json(
        { error: '학습지 데이터를 가져오는 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
