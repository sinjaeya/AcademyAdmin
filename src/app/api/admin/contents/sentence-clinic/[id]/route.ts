import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 문장클리닉 단건 조회
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('short_passage')
      .select(`
        id,
        grade_level,
        structure_type,
        keyword,
        text,
        cloze_summary,
        cloze_option_1,
        cloze_option_2,
        cloze_option_3,
        cloze_option_4,
        cloze_answer,
        cloze_explanation,
        keyword_question,
        keyword_option_1,
        keyword_option_2,
        keyword_option_3,
        keyword_option_4,
        keyword_answer,
        keyword_explanation
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('문장클리닉 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: '문장클리닉을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('문장클리닉 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 문장클리닉 수정
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      grade_level,
      structure_type,
      keyword,
      text,
      cloze_summary,
      cloze_option_1,
      cloze_option_2,
      cloze_option_3,
      cloze_option_4,
      cloze_answer,
      cloze_explanation,
      keyword_question,
      keyword_option_1,
      keyword_option_2,
      keyword_option_3,
      keyword_option_4,
      keyword_answer,
      keyword_explanation
    } = body;

    const { data, error } = await supabase
      .from('short_passage')
      .update({
        grade_level,
        structure_type,
        keyword,
        text,
        cloze_summary,
        cloze_option_1,
        cloze_option_2,
        cloze_option_3,
        cloze_option_4,
        cloze_answer,
        cloze_explanation,
        keyword_question,
        keyword_option_1,
        keyword_option_2,
        keyword_option_3,
        keyword_option_4,
        keyword_answer,
        keyword_explanation
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('문장클리닉 수정 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '문장클리닉이 수정되었습니다.'
    });
  } catch (error) {
    console.error('문장클리닉 수정 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 문장클리닉 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('short_passage')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('문장클리닉 삭제 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '문장클리닉이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('문장클리닉 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
