import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// PUT: 설정 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, value } = body;

    if (!name || !value) {
      return NextResponse.json(
        { error: 'name과 value는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 중복 체크 (자기 자신 제외)
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('name', name)
      .neq('id', id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 변수명입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('settings')
      .update({
        name,
        value
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('설정 수정 오류:', error);
      return NextResponse.json(
        { error: error.message || '설정 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: '설정을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      setting: data
    });

  } catch (error) {
    console.error('설정 수정 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 설정 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('설정 삭제 오류:', error);
      return NextResponse.json(
        { error: error.message || '설정 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '설정이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('설정 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}



