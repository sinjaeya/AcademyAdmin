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

    // v2 테이블 쿼리 (퀴즈 포함)
    let query = supabase
      .from('short_passage_v2')
      .select(`
        id,
        keyword,
        grade_level,
        text,
        char_count,
        qa_status,
        created_at,
        updated_at,
        quizzes:short_passage_quiz_v2(
          id,
          quiz_order,
          quiz_type,
          question,
          option_1,
          option_2,
          option_3,
          option_4,
          correct_answer,
          explanation,
          sentence_a,
          sentence_b
        )
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

// 문장클리닉 v2 생성 (지문 + 퀴즈 4개)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      keyword,
      grade_level,
      text,
      quizzes // Array<{ quiz_order, quiz_type, question, option_1~4, correct_answer, explanation }>
    } = body;

    // 필수 필드 검증
    if (!keyword || !text || !quizzes || quizzes.length !== 4) {
      return NextResponse.json({ error: '필수 필드가 누락되었거나 퀴즈가 4개가 아닙니다.' }, { status: 400 });
    }

    // 1. 지문 생성
    const { data: passage, error: passageError } = await supabase
      .from('short_passage_v2')
      .insert({
        keyword,
        grade_level,
        text,
        char_count: text.length
      })
      .select()
      .single();

    if (passageError) {
      console.error('지문 생성 오류:', passageError);
      return NextResponse.json({ error: passageError.message }, { status: 500 });
    }

    // 2. 퀴즈 생성
    const quizRecords = quizzes.map((q: any) => ({
      passage_id: passage.id,
      quiz_order: q.quiz_order,
      quiz_type: q.quiz_type,
      question: q.question,
      option_1: q.option_1,
      option_2: q.option_2,
      option_3: q.option_3,
      option_4: q.option_4,
      correct_answer: q.correct_answer,
      explanation: q.explanation || null,
      sentence_a: q.sentence_a || null,
      sentence_b: q.sentence_b || null
    }));

    const { error: quizError } = await supabase
      .from('short_passage_quiz_v2')
      .insert(quizRecords);

    if (quizError) {
      console.error('퀴즈 생성 오류:', quizError);
      // 지문 롤백
      await supabase.from('short_passage_v2').delete().eq('id', passage.id);
      return NextResponse.json({ error: quizError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { passage, quizzes: quizRecords },
      message: '문장클리닉 v2가 생성되었습니다.'
    });
  } catch (error) {
    console.error('문장클리닉 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
