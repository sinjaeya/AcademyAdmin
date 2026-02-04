import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerAcademyId, isServerUserAdmin } from '@/lib/auth/server-context';

/**
 * GET /api/admin/learning/worksheets
 * 학습지 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // URL 파라미터에서 학생명 가져오기
    const searchParams = request.nextUrl.searchParams;
    const studentName = searchParams.get('student_name');

    if (!studentName) {
      return NextResponse.json(
        { error: '학생명이 필요합니다' },
        { status: 400 }
      );
    }

    // 학원 데이터 격리: 해당 학생이 자기 학원 소속인지 확인
    const academyId = await getServerAcademyId();
    const isAdmin = await isServerUserAdmin();

    if (!isAdmin && academyId) {
      const { data: studentData } = await supabase
        .from('student')
        .select('id')
        .eq('name', studentName)
        .eq('academy_id', academyId)
        .limit(1);

      if (!studentData || studentData.length === 0) {
        return NextResponse.json(
          { error: '접근 권한이 없습니다' },
          { status: 403 }
        );
      }
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
