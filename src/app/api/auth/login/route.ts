import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { message: '이메일과 비밀번호를 입력해주세요' }
        },
        { status: 400 }
      );
    }

    // admin_users 테이블에서 사용자 조회
    const { data: user, error } = await supabase
      .from('admin_users')
      .select(`
        id,
        email,
        password_hash,
        name,
        role_id,
        academy_id,
        academy_name,
        is_active,
        roles:role_id (
          name
        )
      `)
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: '이메일 또는 비밀번호가 일치하지 않습니다' }
        },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: { message: '이메일 또는 비밀번호가 일치하지 않습니다' }
        },
        { status: 401 }
      );
    }

    // 역할명 추출
    const roleName = user.roles && typeof user.roles === 'object' && 'name' in user.roles
      ? (user.roles as any).name
      : '';

    // 성공 시 사용자 정보 반환 (password_hash 제외)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role_id: user.role_id,
        role_name: roleName,
        academy_id: user.academy_id,
        academy_name: user.academy_name
      }
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: '로그인 처리 중 오류가 발생했습니다' }
      },
      { status: 500 }
    );
  }
}

