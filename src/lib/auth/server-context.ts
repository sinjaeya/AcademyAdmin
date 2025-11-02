import { createServerClient } from '@/lib/supabase/server'
import { UserContext, Academy, User } from '@/types'

/**
 * 서버 컴포넌트에서 현재 사용자의 컨텍스트를 가져옵니다
 * 실제 사용 시에는 세션에서 사용자 ID를 가져와야 합니다
 */
export async function getServerUserContext(): Promise<UserContext | null> {
  try {
    // 임시로 하드코딩된 사용자 ID 사용 (실제로는 세션에서 가져와야 함)
    const userId = 'daacce13-eb9c-4822-87d2-088f2b8a529e'
    
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

    const roleName = (userData.roles as { name: string })?.name || ''
    const isAdmin = roleName.includes('관리자') || (userData.roles as { level: number })?.level === 1

    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role_id: userData.role_id,
      role_name: roleName,
      academy_id: userData.academy_id,
      academy_name: userData.academy ? (userData.academy as Academy).name : null
    }

    const userContext: UserContext = {
      user,
      academy: userData.academy as Academy | null,
      isAdmin
    }

    return userContext
  } catch (error) {
    console.error('서버 사용자 컨텍스트 조회 오류:', error)
    return null
  }
}

/**
 * 서버 컴포넌트에서 현재 사용자의 학원 ID를 가져옵니다
 */
export async function getServerAcademyId(): Promise<string | null> {
  try {
    const userContext = await getServerUserContext()
    return userContext?.academy?.id || null
  } catch (error) {
    console.error('서버 학원 ID 조회 오류:', error)
    return null
  }
}

/**
 * 서버 컴포넌트에서 현재 사용자가 관리자인지 확인합니다
 */
export async function isServerUserAdmin(): Promise<boolean> {
  try {
    const userContext = await getServerUserContext()
    return userContext?.isAdmin || false
  } catch (error) {
    console.error('서버 관리자 권한 확인 오류:', error)
    return false
  }
}

/**
 * 서버 컴포넌트에서 현재 사용자의 역할을 가져옵니다
 */
export async function getServerUserRole(): Promise<string | null> {
  try {
    const userContext = await getServerUserContext()
    return userContext?.user.role_name || null
  } catch (error) {
    console.error('서버 사용자 역할 조회 오류:', error)
    return null
  }
}
