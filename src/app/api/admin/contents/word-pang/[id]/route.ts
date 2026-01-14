import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 단어팡 퀴즈 단건 조회
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('korean_voca_quiz')
      .select(`
        id,
        voca_id,
        option_1,
        option_2,
        option_3,
        option_4,
        correct_answer,
        explanation,
        qa_score,
        created_at,
        updated_at,
        korean_voca (
          id,
          word,
          meaning,
          grade,
          part_of_speech,
          original_word
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('단어팡 퀴즈 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: '퀴즈를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('단어팡 퀴즈 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 단어팡 퀴즈 수정
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { option_1, option_2, option_3, option_4, correct_answer, explanation, qa_score, word, voca_id } = body;

    // 필수 필드 검증
    if (!option_1 || !option_2 || !option_3 || !option_4 || !correct_answer) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // correct_answer 범위 검증
    if (correct_answer < 1 || correct_answer > 4) {
      return NextResponse.json({ error: '정답은 1~4 사이여야 합니다.' }, { status: 400 });
    }

    // 단어 수정 (word 필드가 있고 voca_id가 있는 경우)
    if (word && voca_id) {
      const { error: vocaError } = await supabase
        .from('korean_voca')
        .update({ word })
        .eq('id', voca_id);

      if (vocaError) {
        console.error('단어 수정 오류:', vocaError);
        return NextResponse.json({ error: '단어 수정 실패: ' + vocaError.message }, { status: 500 });
      }
    }

    // 퀴즈 수정
    const { data, error } = await supabase
      .from('korean_voca_quiz')
      .update({
        option_1,
        option_2,
        option_3,
        option_4,
        correct_answer,
        explanation,
        qa_score,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        voca_id,
        option_1,
        option_2,
        option_3,
        option_4,
        correct_answer,
        explanation,
        qa_score,
        created_at,
        updated_at,
        korean_voca (
          id,
          word,
          meaning,
          grade,
          part_of_speech,
          original_word
        )
      `)
      .single();

    if (error) {
      console.error('단어팡 퀴즈 수정 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '퀴즈가 수정되었습니다.'
    });
  } catch (error) {
    console.error('단어팡 퀴즈 수정 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 단어팡 퀴즈 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('korean_voca_quiz')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('단어팡 퀴즈 삭제 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '퀴즈가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('단어팡 퀴즈 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
