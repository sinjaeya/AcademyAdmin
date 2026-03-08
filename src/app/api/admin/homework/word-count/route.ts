import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 학생별 daily_word_count 조정
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    const { student_id, daily_word_count } = body as {
      student_id: number;
      daily_word_count: number;
    };

    if (!student_id || daily_word_count === undefined) {
      return NextResponse.json(
        { success: false, error: 'student_id와 daily_word_count는 필수입니다.' },
        { status: 400 }
      );
    }

    // 유효 범위 검증 (1 ~ 100)
    if (daily_word_count < 1 || daily_word_count > 100) {
      return NextResponse.json(
        { success: false, error: '단어 수는 1 ~ 100 사이여야 합니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('student')
      .update({ daily_word_count })
      .eq('id', student_id)
      .select('id, daily_word_count')
      .single();

    if (error) {
      console.error('daily_word_count 업데이트 오류:', error);
      return NextResponse.json(
        { success: false, error: '단어 수 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { student_id: data.id, daily_word_count: data.daily_word_count },
    });
  } catch (error) {
    console.error('homework word-count PUT 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
