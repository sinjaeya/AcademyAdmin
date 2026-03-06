import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 학교 목록 조회 (학년별 매핑 건수 포함)
export async function GET() {
  try {
    const supabase = createServerClient();

    const [schoolsRes, mappingsRes] = await Promise.all([
      supabase.from('schools').select('*').order('full_name', { ascending: true }),
      supabase.from('school_grade_textbook').select('school_id, grade'),
    ]);

    if (schoolsRes.error) {
      console.error('schools 조회 오류:', schoolsRes.error);
      return NextResponse.json({ success: false, error: '학교 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // school_id별 학년별 매핑 건수 집계
    const summary: Record<number, Record<string, number>> = {};
    for (const row of mappingsRes.data || []) {
      if (!summary[row.school_id]) summary[row.school_id] = {};
      summary[row.school_id][row.grade] = (summary[row.school_id][row.grade] || 0) + 1;
    }

    const data = (schoolsRes.data || []).map((s) => ({
      ...s,
      mapping_summary: summary[s.id] || {},
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('schools GET 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 새 학교 추가
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { full_name, short_name } = body;

    if (!full_name || !short_name) {
      return NextResponse.json({ success: false, error: '학교 이름(full_name, short_name)은 필수입니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('schools')
      .insert({ full_name, short_name })
      .select()
      .single();

    if (error) {
      console.error('schools 추가 오류:', error);
      return NextResponse.json({ success: false, error: '학교 추가 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('schools POST 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
