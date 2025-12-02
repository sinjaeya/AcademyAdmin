import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET: 설정 목록 조회
export async function GET() {
  try {
    const supabase = createServerClient();
    
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('설정 목록 조회 오류:', error);
      return NextResponse.json(
        { error: '설정 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: settings || []
    });

  } catch (error) {
    console.error('설정 목록 조회 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 설정 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value } = body;

    if (!name || !value) {
      return NextResponse.json(
        { error: 'name과 value는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 중복 체크
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 변수명입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('settings')
      .insert({
        name,
        value
      })
      .select()
      .single();

    if (error) {
      console.error('설정 추가 오류:', error);
      return NextResponse.json(
        { error: error.message || '설정 추가에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      setting: data
    }, { status: 201 });

  } catch (error) {
    console.error('설정 추가 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}



