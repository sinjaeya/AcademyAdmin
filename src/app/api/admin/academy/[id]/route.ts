import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET: 특정 학원 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: academy, error } = await supabase
      .from('academy')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('학원 조회 오류:', error);
      return NextResponse.json(
        { error: '학원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      academy
    });

  } catch (error) {
    console.error('학원 조회 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 학원 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, address, phone, email, website, description, logo_url, is_active } = body;

    // 필수 필드 검증
    if (!name) {
      return NextResponse.json(
        { error: '학원명은 필수입니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 학원 정보 업데이트
    const { data: academy, error } = await supabase
      .from('academy')
      .update({
        name,
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        description: description || null,
        logo_url: logo_url || null,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('학원 수정 오류:', error);
      return NextResponse.json(
        { error: '학원 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      academy,
      message: '학원 정보가 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('학원 수정 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 학원 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 먼저 해당 학원에 연결된 사용자가 있는지 확인
    const { data: users, error: usersError } = await supabase
      .from('user_role')
      .select('id')
      .eq('academy_id', id)
      .limit(1);

    if (usersError) {
      console.error('사용자 확인 오류:', usersError);
      return NextResponse.json(
        { error: '학원 삭제 전 사용자 확인에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (users && users.length > 0) {
      return NextResponse.json(
        { error: '이 학원에 연결된 사용자가 있어 삭제할 수 없습니다. 먼저 사용자를 다른 학원으로 이동하거나 삭제해주세요.' },
        { status: 400 }
      );
    }

    // 학원 삭제
    const { error } = await supabase
      .from('academy')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('학원 삭제 오류:', error);
      return NextResponse.json(
        { error: '학원 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '학원이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('학원 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
