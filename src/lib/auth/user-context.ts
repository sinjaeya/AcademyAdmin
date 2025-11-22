import { createServerClient } from '@/lib/supabase/server'
import { User, Academy, UserContext } from '@/types'

/**
 * 서버 사이드에서 현재 사용자의 전체 정보를 가져옵니다 (학원 정보 포함)
 * 참고: 현재는 세션 기반 인증이 없으므로 null을 반환합니다.
 * 실제 구현 시에는 세션에서 사용자 ID를 가져와야 합니다.
 */
export async function getUserContext(): Promise<UserContext | null> {
  try {
    // TODO: 실제로는 세션에서 사용자 ID를 가져와야 함
    // 현재는 구현되지 않았으므로 null 반환
    return null
  } catch (error) {
    console.error('사용자 컨텍스트 조회 중 오류:', error)
    return null
  }
}

/**
 * 특정 사용자 ID로 사용자 정보를 가져옵니다
 */
export async function getUserById(userId: string): Promise<UserContext | null> {
  try {
    const supabase = createServerClient()
    
    // admin_users 테이블에서 사용자 정보와 역할 정보를 조회
    const { data: userData, error: userError } = await supabase
      .from('admin_users')
      .select(`
        id,
        email,
        name,
        role_id,
        academy_id,
        roles!inner (
          id,
          name,
          level
        ),
        academy:academy_id (
          id,
          name,
          address,
          phone,
          email,
          website,
          description,
          logo_url,
          settings,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return null
    }

    // roles는 배열이거나 단일 객체일 수 있음
    const rolesData = Array.isArray(userData.roles) 
      ? userData.roles[0] 
      : userData.roles
    const roleName = rolesData?.name || ''
    const roleLevel = rolesData?.level || 0
    const isAdmin = roleName.includes('관리자') || roleLevel === 1

    // academy도 배열이거나 단일 객체일 수 있음
    const academyData = Array.isArray(userData.academy)
      ? userData.academy[0]
      : userData.academy
    const academy = academyData ? (academyData as Academy) : null

    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role_id: userData.role_id,
      role_name: roleName,
      academy_id: userData.academy_id,
      academy_name: academy?.name || null
    }

    const userContext: UserContext = {
      user,
      academy,
      isAdmin
    }

    return userContext
  } catch (error) {
    console.error('사용자 ID로 조회 중 오류:', error)
    return null
  }
}

/**
 * 현재 사용자가 속한 학원의 ID를 반환합니다
 */
export async function getCurrentUserAcademyId(): Promise<string | null> {
  try {
    const userContext = await getUserContext()
    return userContext?.academy?.id || null
  } catch (error) {
    console.error('학원 ID 조회 중 오류:', error)
    return null
  }
}

/**
 * 현재 사용자가 관리자 권한을 가지고 있는지 확인합니다
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const userContext = await getUserContext()
    return userContext?.isAdmin || false
  } catch (error) {
    console.error('관리자 권한 확인 중 오류:', error)
    return false
  }
}
