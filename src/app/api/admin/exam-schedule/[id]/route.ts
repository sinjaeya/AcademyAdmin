import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 시험기간 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const idNum = Number(id);

    if (isNaN(idNum)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { school_id, grade, exam_type, start_date, end_date, scope_unit_ids, textbook_id } = body;

    // 필수 필드 검증
    if (!school_id || !grade || !exam_type || !start_date || !end_date || !textbook_id) {
      return NextResponse.json(
        { success: false, error: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 날짜 순서 검증
    if (start_date > end_date) {
      return NextResponse.json(
        { success: false, error: '시작일은 종료일보다 이전이어야 합니다.' },
        { status: 400 }
      );
    }

    // 범위 단원 검증
    if (!Array.isArray(scope_unit_ids) || scope_unit_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '시험 범위 단원을 1개 이상 선택해야 합니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('exam_schedule')
      .update({
        school_id,
        grade,
        exam_type,
        start_date,
        end_date,
        scope_unit_ids,
        textbook_id,
      })
      .eq('id', idNum)
      .select()
      .single();

    if (error) {
      // UNIQUE 제약 위반 처리
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: '해당 학교/학년/시험유형의 시험기간이 이미 존재합니다.' },
          { status: 409 }
        );
      }
      console.error('exam_schedule 수정 오류:', error);
      return NextResponse.json(
        { success: false, error: '시험기간 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('exam-schedule PUT 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 시험기간 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const idNum = Number(id);

    if (isNaN(idNum)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('exam_schedule')
      .delete()
      .eq('id', idNum);

    if (error) {
      console.error('exam_schedule 삭제 오류:', error);
      return NextResponse.json(
        { success: false, error: '시험기간 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('exam-schedule DELETE 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
