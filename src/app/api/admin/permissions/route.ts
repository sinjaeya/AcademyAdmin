import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clearPermissionCache } from '@/lib/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/admin/permissions
 * 역할, 권한, 역할-권한 매핑 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 모든 역할 조회
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: false });

    if (rolesError) {
      console.error('Failed to fetch roles:', rolesError);
      return NextResponse.json(
        { success: false, error: '역할 목록을 불러오는데 실패했습니다' },
        { status: 500 }
      );
    }

    // 모든 권한 조회
    const { data: permissions, error: permissionsError } = await supabase
      .from('permissions')
      .select('*')
      .order('display_order');

    if (permissionsError) {
      console.error('Failed to fetch permissions:', permissionsError);
      return NextResponse.json(
        { success: false, error: '권한 목록을 불러오는데 실패했습니다' },
        { status: 500 }
      );
    }

    // 역할-권한 매핑 조회
    const { data: rolePermissions, error: mappingError } = await supabase
      .from('role_permissions')
      .select('role_id, permission_id');

    if (mappingError) {
      console.error('Failed to fetch role permissions:', mappingError);
      return NextResponse.json(
        { success: false, error: '권한 매핑을 불러오는데 실패했습니다' },
        { status: 500 }
      );
    }

    // 역할별 권한 ID 배열로 그룹화
    const rolePermissionsMap: Record<string, string[]> = {};
    rolePermissions?.forEach(rp => {
      if (!rolePermissionsMap[rp.role_id]) {
        rolePermissionsMap[rp.role_id] = [];
      }
      rolePermissionsMap[rp.role_id].push(rp.permission_id);
    });

    return NextResponse.json({
      success: true,
      data: {
        roles,
        permissions,
        rolePermissions: rolePermissionsMap
      }
    });

  } catch (error) {
    console.error('GET /api/admin/permissions error:', error);
    return NextResponse.json(
      { success: false, error: '권한 데이터를 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/permissions
 * 역할-권한 매핑 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rolePermissions } = body;

    if (!rolePermissions || typeof rolePermissions !== 'object') {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 요청 데이터입니다' },
        { status: 400 }
      );
    }

    // 1. 기존 role_permissions 모두 삭제
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .neq('role_id', '___NEVER_MATCH___'); // 모든 행 삭제

    if (deleteError) {
      console.error('Failed to delete existing permissions:', deleteError);
      return NextResponse.json(
        { success: false, error: '기존 권한 삭제에 실패했습니다' },
        { status: 500 }
      );
    }

    // 2. 새로운 매핑 데이터 생성
    const newMappings: Array<{ role_id: string; permission_id: string }> = [];
    
    Object.entries(rolePermissions).forEach(([roleId, permissionIds]) => {
      if (Array.isArray(permissionIds)) {
        permissionIds.forEach(permissionId => {
          newMappings.push({
            role_id: roleId,
            permission_id: permissionId
          });
        });
      }
    });

    // 3. 새로운 매핑 INSERT
    if (newMappings.length > 0) {
      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(newMappings);

      if (insertError) {
        console.error('Failed to insert new permissions:', insertError);
        return NextResponse.json(
          { success: false, error: '권한 저장에 실패했습니다' },
          { status: 500 }
        );
      }
    }

    // 4. 캐시 무효화
    clearPermissionCache();

    return NextResponse.json({
      success: true,
      message: '권한이 성공적으로 저장되었습니다'
    });

  } catch (error) {
    console.error('POST /api/admin/permissions error:', error);
    return NextResponse.json(
      { success: false, error: '권한 저장 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

