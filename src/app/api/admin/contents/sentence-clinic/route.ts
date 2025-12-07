import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 문장클리닉 목록 조회 (keyword로 검색)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 기본 쿼리
    let query = supabase
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
      `, { count: 'exact' });

    // keyword로 검색
    if (keyword) {
      query = query.ilike('keyword', `%${keyword}%`);
    }

    // 정렬 및 페이지네이션
    query = query.order('id', { ascending: true }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('문장클리닉 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('문장클리닉 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 문장클리닉 생성
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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

    // 필수 필드 검증
    if (!keyword || !text) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('short_passage')
      .insert({
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
      .select()
      .single();

    if (error) {
      console.error('문장클리닉 생성 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '문장클리닉이 생성되었습니다.'
    });
  } catch (error) {
    console.error('문장클리닉 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
