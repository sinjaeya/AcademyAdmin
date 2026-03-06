import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 학교 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schoolId = Number(id);

    if (isNaN(schoolId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 학교 ID입니다.' }, { status: 400 });
    }

    const supabase = createServerClient();
    const body = await request.json();
    const { full_name, short_name } = body;

    if (!full_name || !short_name) {
      return NextResponse.json({ success: false, error: '학교 이름(full_name, short_name)은 필수입니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('schools')
      .update({ full_name, short_name })
      .eq('id', schoolId)
      .select()
      .single();

    if (error) {
      console.error('schools 수정 오류:', error);
      return NextResponse.json({ success: false, error: '학교 정보 수정 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('schools PUT 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 학교 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schoolId = Number(id);

    if (isNaN(schoolId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 학교 ID입니다.' }, { status: 400 });
    }

    const supabase = createServerClient();

    // 해당 학교에 소속된 학생이 있는지 확인
    const { count, error: countError } = await supabase
      .from('student')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId);

    if (countError) {
      console.error('학생 수 확인 오류:', countError);
      return NextResponse.json({ success: false, error: '학생 연결 여부 확인 중 오류가 발생했습니다.' }, { status: 500 });
    }

    if (count && count > 0) {
      return NextResponse.json(
        { success: false, error: `이 학교에 소속된 학생이 ${count}명 있어 삭제할 수 없습니다. 먼저 학생의 학교 정보를 변경해주세요.` },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('schools')
      .delete()
      .eq('id', schoolId);

    if (error) {
      console.error('schools 삭제 오류:', error);
      return NextResponse.json({ success: false, error: '학교 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('schools DELETE 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
