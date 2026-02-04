import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerAcademyId, isServerUserAdmin } from '@/lib/auth/server-context';

/**
 * GET /api/admin/checkinout/detail
 * 등하원 상세 정보 조회 (카카오톡 발송 내역 + 갤러리 링크)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;

    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: '학생 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 학원 데이터 격리: 학생이 자기 학원 소속인지 확인
    const academyId = await getServerAcademyId();
    const isAdmin = await isServerUserAdmin();

    if (!isAdmin && academyId) {
      const { data: studentData } = await supabase
        .from('student')
        .select('academy_id')
        .eq('id', parseInt(studentId))
        .single();

      if (!studentData || studentData.academy_id !== academyId) {
        return NextResponse.json(
          { success: false, error: '접근 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 날짜 범위 설정 (해당 날짜의 00:00:00 ~ 23:59:59)
    const startDate = date ? `${date}T00:00:00.000Z` : null;
    const endDate = date ? `${date}T23:59:59.999Z` : null;

    // 1. 카카오톡 발송 내역 조회 (kakao_send_history 테이블)
    let messagesQuery = supabase
      .from('kakao_send_history')
      .select('id, check_in_out, has_today_study, today_study_data, success, sent_at')
      .eq('student_id', parseInt(studentId))
      .order('sent_at', { ascending: false });

    // 관리자가 아닌 경우 자기 학원 데이터만 조회
    if (!isAdmin && academyId) {
      messagesQuery = messagesQuery.eq('academy_id', academyId);
    }

    // 날짜 필터가 있으면 적용
    if (startDate && endDate) {
      messagesQuery = messagesQuery
        .gte('sent_at', startDate)
        .lte('sent_at', endDate);
    }

    const { data: messages, error: messagesError } = await messagesQuery.limit(10);

    if (messagesError) {
      console.error('kakao_send_history 조회 오류:', messagesError);
    }

    // 2. 갤러리 링크 조회 (parent_share_links 테이블)
    let galleryQuery = supabase
      .from('parent_share_links')
      .select('token, is_active, valid_until, share_date')
      .eq('student_id', parseInt(studentId))
      .eq('is_active', true)
      .order('share_date', { ascending: false })
      .limit(1);

    // 관리자가 아닌 경우 자기 학원 데이터만 조회
    if (!isAdmin && academyId) {
      galleryQuery = galleryQuery.eq('academy_id', academyId);
    }

    const { data: galleryData, error: galleryError } = await galleryQuery.single();

    if (galleryError && galleryError.code !== 'PGRST116') {
      // PGRST116: 결과 없음 에러는 무시
      console.error('parent_share_links 조회 오류:', galleryError);
    }

    // 갤러리 URL 생성
    const galleryLink = galleryData ? {
      token: galleryData.token,
      isActive: galleryData.is_active,
      validUntil: galleryData.valid_until,
      url: `https://gallery.busanedu.co.kr/gallery/${galleryData.token}`
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        messages: messages || [],
        galleryLink
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
