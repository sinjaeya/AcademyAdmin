import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    // ID 형식 확인 (ts_123 또는 sc_uuid)
    if (id.startsWith('ts_')) {
      // test_session 삭제 (id는 bigint)
      const recordIdStr = id.replace('ts_', '');
      const recordId = parseInt(recordIdStr, 10);

      if (isNaN(recordId)) {
        return NextResponse.json({ error: '잘못된 ID 형식입니다.' }, { status: 400 });
      }

      const { error } = await supabase
        .from('test_session')
        .delete()
        .eq('id', recordId)
        .is('completed_at', null); // 진행 중인 것만 삭제 가능

      if (error) {
        console.error('Error deleting test_session:', error);
        return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 });
      }
    } else if (id.startsWith('sc_')) {
      // short_passage_learning_history 삭제 (id는 uuid)
      const recordId = id.replace('sc_', '');
      const { error } = await supabase
        .from('short_passage_learning_history')
        .delete()
        .eq('id', recordId)
        .is('completed_at', null); // 진행 중인 것만 삭제 가능

      if (error) {
        console.error('Error deleting sentence_clinic:', error);
        return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: '잘못된 ID 형식입니다.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete learning API:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
