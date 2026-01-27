import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 문장클리닉 단건 조회 (v2)
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;

    const { data, error } = await supabase
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

// 문장클리닉 수정 (v2)
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      keyword,
      grade_level,
      text,
      quizzes // Array<{ id?, quiz_order, quiz_type, question, option_1~4, correct_answer, explanation, sentence_a?, sentence_b? }>
    } = body;

    // 필수 필드 검증
    if (!keyword || !text) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // 1. 지문 업데이트
    const { data: passage, error: passageError } = await supabase
      .from('short_passage_v2')
      .update({
        keyword,
        grade_level,
        text,
        char_count: text.length
      })
      .eq('id', id)
      .select()
      .single();

    if (passageError) {
      console.error('지문 수정 오류:', passageError);
      return NextResponse.json({ error: passageError.message }, { status: 500 });
    }

    // 2. 퀴즈 업데이트 (기존 퀴즈 삭제 후 재생성)
    if (quizzes && Array.isArray(quizzes)) {
      // 기존 퀴즈 삭제
      await supabase
        .from('short_passage_quiz_v2')
        .delete()
        .eq('passage_id', id);

      // 새 퀴즈 생성
      const quizRecords = quizzes.map((q: any) => ({
        passage_id: id,
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
        console.error('퀴즈 수정 오류:', quizError);
        return NextResponse.json({ error: quizError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      data: passage,
      message: '문장클리닉이 수정되었습니다.'
    });
  } catch (error) {
    console.error('문장클리닉 수정 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 문장클리닉 삭제 (v2, cascade로 퀴즈도 함께 삭제됨)
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('short_passage_v2')
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
