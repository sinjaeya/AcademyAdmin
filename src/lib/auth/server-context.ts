import { createServerClient } from '@/lib/supabase/server'
import { UserContext, Academy } from '@/types'

/**
 * 서버 컴포넌트에서 현재 사용자의 컨텍스트를 가져옵니다
 * 실제 사용 시에는 세션에서 사용자 ID를 가져와야 합니다
 */
export async function getServerUserContext(): Promise<UserContext | null> {
  try {
    // 임시로 하드코딩된 사용자 ID 사용 (실제로는 세션에서 가져와야 함)
    const userId = 'daacce13-eb9c-4822-87d2-088f2b8a529e'
    
    const supabase = createServerClient()
    
    // 사용자의 역할 정보와 학원 정보를 함께 조회
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

    const userContext: UserContext = {
      user: {
        id: userId,
        role: userRoleData.role as 'admin' | 'owner' | 'teacher' | 'tutor'
      } as any,
      academy: userRoleData.academy as Academy,
      isAdmin: userRoleData.role === 'admin' || userRoleData.role === 'owner'
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
    return userContext?.user.role || null
  } catch (error) {
    console.error('서버 사용자 역할 조회 오류:', error)
    return null
  }
}
