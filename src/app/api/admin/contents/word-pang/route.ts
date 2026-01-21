import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 단어팡 퀴즈 목록 조회 (voca_id 또는 단어로 검색)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vocaId = searchParams.get('voca_id');
    const word = searchParams.get('word');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 기본 쿼리: korean_voca_quiz와 korean_voca 조인
    let query = supabase
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
        korean_voca!inner (
          id,
          word,
          meaning,
          grade,
          part_of_speech,
          original_word
        )
      `, { count: 'exact' });

    // voca_id로 검색
    if (vocaId) {
      query = query.eq('voca_id', vocaId);
    }

    // 단어로 검색 (korean_voca.word에서 검색)
    if (word) {
      query = query.ilike('korean_voca.word', `%${word}%`);
    }

    // 정렬 및 페이지네이션
    query = query.order('voca_id', { ascending: true }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('단어팡 퀴즈 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 한자 정보 추가 조회 (voca_id 검색인 경우)
    let enrichedData = data;
    if (data && data.length > 0) {
      const vocaIds = data.map((d: { voca_id: number }) => d.voca_id);
      const { data: hanjaData } = await supabase
        .from('korean_voca_hanja')
        .select('id, voca_id, hanja_sequence, hanja_char, hanja_pronunciation, contextual_meaning')
        .in('voca_id', vocaIds)
        .order('hanja_sequence', { ascending: true });

      // 각 퀴즈에 한자 정보 매핑
      if (hanjaData) {
        type HanjaItem = typeof hanjaData[number];
        const hanjaMap = new Map<number, HanjaItem[]>();
        hanjaData.forEach((h) => {
          const existing = hanjaMap.get(h.voca_id) || [];
          hanjaMap.set(h.voca_id, [...existing, h]);
        });

        enrichedData = data.map((quiz: { voca_id: number }) => ({
          ...quiz,
          korean_voca_hanja: hanjaMap.get(quiz.voca_id) || []
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('단어팡 퀴즈 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 단어팡 퀴즈 생성
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { voca_id, option_1, option_2, option_3, option_4, correct_answer, explanation, qa_score } = body;

    // 필수 필드 검증
    if (!voca_id || !option_1 || !option_2 || !option_3 || !option_4 || !correct_answer) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // 이미 해당 voca_id에 대한 퀴즈가 있는지 확인
    const { data: existing } = await supabase
      .from('korean_voca_quiz')
      .select('id')
      .eq('voca_id', voca_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: '해당 단어에 대한 퀴즈가 이미 존재합니다.' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('korean_voca_quiz')
      .insert({
        voca_id,
        option_1,
        option_2,
        option_3,
        option_4,
        correct_answer,
        explanation,
        qa_score,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('단어팡 퀴즈 생성 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '퀴즈가 생성되었습니다.'
    });
  } catch (error) {
    console.error('단어팡 퀴즈 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
