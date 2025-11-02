import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 사용자 정보 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { email, password, name, role_id, academy_id, academy_name, is_active } = body;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 업데이트할 데이터 준비
    const updateData: any = {};

    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (role_id !== undefined) updateData.role_id = role_id;
    if (academy_id !== undefined) updateData.academy_id = academy_id || null;
    if (academy_name !== undefined) updateData.academy_name = academy_name || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    // 비밀번호가 제공된 경우에만 해싱하여 업데이트
    if (password) {
      // 비밀번호 유효성 검증
      if (password.length < 8) {
        return NextResponse.json(
          { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
          { status: 400 }
        );
      }
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    // 이메일 변경 시 중복 체크
    if (email) {
      const { data: existingUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: '이미 등록된 이메일입니다.' },
          { status: 400 }
        );
      }
    }

    // admin_users 테이블 업데이트
    const { data, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', userId)
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
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: '사용자 정보 업데이트 중 오류가 발생했습니다.' },
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
      message: '사용자 정보가 성공적으로 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사용자 정보 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 실제 삭제 (또는 is_active = false로 소프트 삭제)
    // 실제 삭제 사용
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { error: '사용자 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
