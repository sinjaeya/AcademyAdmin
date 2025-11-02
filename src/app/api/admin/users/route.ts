import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 사용자 목록 조회
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // admin_users 테이블에서 조회 (roles 테이블과 조인)
    const { data: users, error: usersError } = await supabase
      .from('admin_users')
      .select(`
        id,
        email,
        name,
        role_id,
        academy_id,
        academy_name,
        is_active,
        created_at,
        updated_at,
        roles:role_id (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Supabase error:', usersError);
      return NextResponse.json(
        { error: '사용자 목록을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // roles 조인 결과 처리
    const formattedUsers = (users || []).map((user: any) => {
      const roleName = user.roles && typeof user.roles === 'object' && 'name' in user.roles
        ? (user.roles as any).name
        : '';
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role_id: user.role_id,
        role_name: roleName,
        academy_id: user.academy_id,
        academy_name: user.academy_name,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 새 사용자 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role_id, academy_id, academy_name } = body;

    // 필수 필드 검증
    if (!email || !password || !name || !role_id) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 이름, 역할은 필수입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 유효성 검증
    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 이메일 중복 체크
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 10);

    // admin_users 테이블에 INSERT
    const { data, error } = await supabase
      .from('admin_users')
      .insert([{
        email,
        password_hash: passwordHash,
        name,
        role_id,
        academy_id: academy_id || null,
        academy_name: academy_name || null,
        is_active: true
      }])
      .select(`
        id,
        email,
        name,
        role_id,
        academy_id,
        academy_name,
        is_active,
        created_at,
        updated_at,
        roles:role_id (
          name
        )
      `);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '사용자 추가 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 응답 데이터 포맷팅
    const user = data[0];
    const roleName = user.roles && typeof user.roles === 'object' && 'name' in user.roles
      ? (user.roles as any).name
      : '';

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role_id: user.role_id,
        role_name: roleName,
        academy_id: user.academy_id,
        academy_name: user.academy_name,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      message: '사용자가 성공적으로 추가되었습니다.'
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
