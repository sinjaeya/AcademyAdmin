import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerAcademyId, isServerUserAdmin } from '@/lib/auth/server-context';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const academyId = await getServerAcademyId();
    const isAdmin = await isServerUserAdmin();

    // ID 형식 확인 (ts_123 또는 sc_123) - 둘 다 test_session ID로 처리
    let sessionId: number | null = null;
    if (id.startsWith('ts_')) {
      sessionId = parseInt(id.replace('ts_', ''), 10);
    } else if (id.startsWith('sc_')) {
      sessionId = parseInt(id.replace('sc_', ''), 10);
    }

    if (!sessionId || isNaN(sessionId)) {
      return NextResponse.json({ error: '잘못된 ID 형식입니다.' }, { status: 400 });
    }

    // 학원 소속 검증 (admin이 아닌 경우)
    if (!isAdmin && academyId) {
      const { data: session } = await supabase
        .from('test_session')
        .select('student_id')
        .eq('id', sessionId)
        .single();

      if (session) {
        const { data: student } = await supabase
          .from('student')
          .select('academy_id')
          .eq('id', session.student_id)
          .single();

        if (!student || student.academy_id !== academyId) {
          return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
        }
      }
    }

    // 1. handwriting_canvas 삭제 (내손내줄인 경우)
    const { error: canvasError } = await supabase
      .from('handwriting_canvas')
      .delete()
      .eq('session_id', sessionId);

    if (canvasError) {
      console.error('Error deleting handwriting_canvas:', canvasError);
    }

    // 2. test_result 삭제
    const { error: resultError } = await supabase
      .from('test_result')
      .delete()
      .eq('session_id', sessionId);

    if (resultError) {
      console.error('Error deleting test_result:', resultError);
    }

    // 3. test_session 삭제
    const { error } = await supabase
      .from('test_session')
      .delete()
      .eq('id', sessionId)
      .is('completed_at', null); // 진행 중인 것만 삭제 가능

    if (error) {
      console.error('Error deleting test_session:', error);
      return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete learning API:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
