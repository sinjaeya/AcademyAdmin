import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserPermissions } from '@/lib/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/auth/permissions
 * 현재 로그인한 사용자의 권한 목록 반환 (클라이언트 사이드용)
 */
export async function GET(request: NextRequest) {
  try {
    // 쿠키나 헤더에서 사용자 정보 가져오기
    // 현재는 쿼리 파라미터로 role_id를 받거나, 
    // 세션에서 가져와야 하지만 간단하게 쿼리 파라미터 사용
    const searchParams = request.nextUrl.searchParams;
    const roleId = searchParams.get('role_id');

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: 'role_id가 필요합니다' },
        { status: 400 }
      );
    }

    // 권한 목록 가져오기 (카테고리별 그룹화)
    const groupedPermissions = await getUserPermissions(roleId);

    // 모든 permissionId를 플랫한 배열로 변환
    const permissionIds: string[] = [];
    Object.values(groupedPermissions).forEach(permissions => {
      permissions.forEach(perm => {
        permissionIds.push(perm.id);
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        permissionIds,
        groupedPermissions
      }
    });

  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    return NextResponse.json(
      { success: false, error: '권한을 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
}

