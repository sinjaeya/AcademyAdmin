import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { UserContext, Academy, User } from '@/types'

/**
 * 서버 컴포넌트/API Route에서 현재 로그인 사용자의 컨텍스트를 가져옵니다
 * 로그인 시 설정된 admin-session 쿠키에서 사용자 ID를 읽습니다
 */
export async function getServerUserContext(): Promise<UserContext | null> {
  try {
    // 쿠키에서 사용자 ID 읽기
    const cookieStore = await cookies()
    const userId = cookieStore.get('admin-session')?.value

    if (!userId) {
      return null
    }
    
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
          updated_at,
          type
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
      academy_name: academy?.name || null,
      academy_type: academy?.type || 'full'
    }

    const userContext: UserContext = {
      user,
      academy,
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

/**
 * 서버 컴포넌트에서 현재 사용자의 학원 타입을 가져옵니다
 */
export async function getServerAcademyType(): Promise<string> {
  try {
    const userContext = await getServerUserContext()
    return userContext?.academy?.type || 'full'
  } catch (error) {
    console.error('서버 학원 타입 조회 오류:', error)
    return 'full'
  }
}
