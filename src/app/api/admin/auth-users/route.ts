import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// auth.users에 새 사용자 생성 (실제 구현)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: '이메일은 필수입니다.' },
        { status: 400 }
      );
    }

    // Service Role Key를 사용하여 실제 auth.users에 계정 생성
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: 'temp123!', // 임시 패스워드
      email_confirm: true
    });

    if (error) {
      console.error('Auth user creation error:', error);
      return NextResponse.json(
        { error: '사용자 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    console.log('실제 Auth user created:', data.user.id);
    return NextResponse.json({
      success: true,
      user: data.user,
      message: '사용자가 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
