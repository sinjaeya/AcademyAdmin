import { createServerClient } from '@/lib/supabase/server'
import { ExtendedUser, Academy, UserRole, UserContext } from '@/types'

/**
 * 서버 사이드에서 현재 사용자의 전체 정보를 가져옵니다 (학원 정보 포함)
 */
export async function getUserContext(): Promise<UserContext | null> {
  try {
    const supabase = createServerClient()
    
    // 현재 사용자 세션 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('사용자 인증 오류:', authError)
      return null
    }

    // 사용자의 역할 정보와 학원 정보를 함께 조회
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_role')
      .select(`
        *,
        academy:academy_id (
          *
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (userRoleError) {
      console.error('사용자 역할 정보 조회 오류:', userRoleError)
      return null
    }

    if (!userRoleData) {
      console.error('사용자 역할 정보가 없습니다.')
      return null
    }

    // 타입 변환
    const extendedUser: ExtendedUser = {
      ...user,
      user_role: userRoleData as UserRole,
      academy: userRoleData.academy as Academy
    }

    const userContext: UserContext = {
      user: extendedUser,
      academy: userRoleData.academy as Academy,
      isAdmin: userRoleData.role === 'admin' || userRoleData.role === 'owner'
    }

    return userContext
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
    
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_role')
      .select(`
        *,
        academy:academy_id (
          *
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (userRoleError || !userRoleData) {
      return null
    }

    // auth.users에서 기본 사용자 정보 가져오기
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser.user) {
      return null
    }

    const extendedUser: ExtendedUser = {
      ...authUser.user,
      user_role: userRoleData as UserRole,
      academy: userRoleData.academy as Academy
    }

    const userContext: UserContext = {
      user: extendedUser,
      academy: userRoleData.academy as Academy,
      isAdmin: userRoleData.role === 'admin' || userRoleData.role === 'owner'
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
