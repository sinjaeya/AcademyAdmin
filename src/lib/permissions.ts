import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface Permission {
  id: string;
  category: string;
  action: string;
  name: string;
  description: string | null;
  display_order: number;
}

export interface GroupedPermissions {
  [category: string]: Permission[];
}

// 메모리 캐시 (앱 재시작 시까지 유지)
let permissionCache: Record<string, string[]> = {};
let allPermissionsCache: Permission[] = [];
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * role_permissions 테이블에서 권한 로드 (5분 캐싱)
 */
export async function loadPermissions(): Promise<Record<string, string[]>> {
  const now = Date.now();
  
  // 캐시가 유효하면 재사용
  if (cacheTime && (now - cacheTime) < CACHE_DURATION) {
    return permissionCache;
  }
  
  // DB에서 권한 로드
  const { data } = await supabase
    .from('role_permissions')
    .select('role_id, permission_id');
  
  // 역할별로 그룹화
  permissionCache = (data || []).reduce((acc, item) => {
    if (!acc[item.role_id]) acc[item.role_id] = [];
    acc[item.role_id].push(item.permission_id);
    return acc;
  }, {} as Record<string, string[]>);
  
  cacheTime = now;
  return permissionCache;
}

/**
 * 모든 권한 정의 로드
 */
export async function loadAllPermissions(): Promise<Permission[]> {
  const now = Date.now();
  
  // 캐시가 유효하면 재사용
  if (cacheTime && (now - cacheTime) < CACHE_DURATION && allPermissionsCache.length > 0) {
    return allPermissionsCache;
  }
  
  const { data } = await supabase
    .from('permissions')
    .select('*')
    .order('display_order');
  
  allPermissionsCache = data || [];
  return allPermissionsCache;
}

/**
 * 특정 역할이 특정 권한을 가지는지 확인
 */
export async function hasPermission(roleId: string, permissionId: string): Promise<boolean> {
  const permissions = await loadPermissions();
  return permissions[roleId]?.includes(permissionId) || false;
}

/**
 * 사용자의 모든 권한 목록 조회 (카테고리별 그룹화)
 */
export async function getUserPermissions(roleId: string): Promise<GroupedPermissions> {
  const [rolePermissions, allPermissions] = await Promise.all([
    loadPermissions(),
    loadAllPermissions()
  ]);
  
  const userPermissionIds = rolePermissions[roleId] || [];
  
  // 사용자가 가진 권한만 필터링하고 카테고리별로 그룹화
  const grouped: GroupedPermissions = {};
  
  allPermissions.forEach(perm => {
    if (userPermissionIds.includes(perm.id)) {
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push(perm);
    }
  });
  
  return grouped;
}

/**
 * 모든 권한을 카테고리별로 그룹화 (사용자 권한 여부 포함)
 */
export async function getAllPermissionsGrouped(roleId: string): Promise<{
  category: string;
  permissions: (Permission & { hasPermission: boolean })[];
}[]> {
  const [rolePermissions, allPermissions] = await Promise.all([
    loadPermissions(),
    loadAllPermissions()
  ]);
  
  const userPermissionIds = rolePermissions[roleId] || [];
  
  // 카테고리별로 그룹화
  const grouped: Record<string, (Permission & { hasPermission: boolean })[]> = {};
  
  allPermissions.forEach(perm => {
    if (!grouped[perm.category]) {
      grouped[perm.category] = [];
    }
    grouped[perm.category].push({
      ...perm,
      hasPermission: userPermissionIds.includes(perm.id)
    });
  });
  
  // 배열로 변환
  return Object.entries(grouped).map(([category, permissions]) => ({
    category,
    permissions
  }));
}

/**
 * 캐시 무효화 (권한 변경 시 호출)
 */
export function clearPermissionCache() {
  cacheTime = 0;
  permissionCache = {};
  allPermissionsCache = [];
}

/**
 * 카테고리명을 한글로 변환
 */
export function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    students: '학생 관리',
    payments: '결제 관리',
    users: '사용자 관리',
    academy: '학원 설정',
    reports: '리포트'
  };
  return names[category] || category;
}

