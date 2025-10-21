import { createServerClient } from '@/lib/supabase/server'
import { getServerAcademyId } from '@/lib/auth/server-context'
import { Academy } from '@/types'

/**
 * 학원별 데이터 조회를 위한 기본 쿼리 빌더
 */
export class AcademyQueryBuilder {
  private supabase: ReturnType<typeof createServerClient>
  private academyId: string | null
  private tableName: string

  constructor(tableName: string, academyId?: string) {
    this.supabase = createServerClient()
    this.academyId = academyId || null
    this.tableName = tableName
  }

  /**
   * academyId를 설정합니다
   */
  async setAcademyId() {
    if (!this.academyId) {
      this.academyId = await getServerAcademyId()
    }
    return this
  }

  /**
   * 현재 사용자의 학원에 속한 데이터만 조회
   */
  select(columns: string = '*') {
    let query = this.supabase.from(this.tableName).select(columns)
    
    if (this.academyId) {
      query = query.eq('academy_id', this.academyId)
    }
    
    return query
  }

  /**
   * 학원 ID를 명시적으로 지정하여 조회
   */
  selectByAcademy(academyId: string, columns: string = '*') {
    return this.supabase
      .from(this.tableName)
      .select(columns)
      .eq('academy_id', academyId)
  }

  /**
   * 모든 학원의 데이터 조회 (관리자용)
   */
  selectAll(columns: string = '*') {
    return this.supabase.from(this.tableName).select(columns)
  }

  /**
   * 특정 학원의 데이터 삽입
   */
  insert(data: Record<string, unknown>) {
    const dataWithAcademy = {
      ...data,
      academy_id: this.academyId
    }
    
    return this.supabase.from(this.tableName).insert(dataWithAcademy)
  }

  /**
   * 특정 학원의 데이터 업데이트
   */
  update(data: Record<string, unknown>) {
    let query = this.supabase.from(this.tableName).update(data)
    
    if (this.academyId) {
      query = query.eq('academy_id', this.academyId)
    }
    
    return query
  }

  /**
   * 특정 학원의 데이터 삭제
   */
  delete() {
    let query = this.supabase.from(this.tableName).delete()
    
    if (this.academyId) {
      query = query.eq('academy_id', this.academyId)
    }
    
    return query
  }
}

/**
 * 학생 데이터 조회용 헬퍼 함수
 */
export function getStudentsQuery() {
  return new AcademyQueryBuilder('students')
}

/**
 * 결제 데이터 조회용 헬퍼 함수
 */
export function getPaymentsQuery() {
  return new AcademyQueryBuilder('payments')
}

/**
 * 출석 데이터 조회용 헬퍼 함수
 */
export function getAttendanceQuery() {
  return new AcademyQueryBuilder('attendance')
}

/**
 * 학원 정보 조회
 */
export async function getAcademyInfo(): Promise<Academy | null> {
  try {
    const academyId = getServerAcademyId()
    if (!academyId) return null

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('academy')
      .select('*')
      .eq('id', academyId)
      .single()

    if (error) {
      console.error('학원 정보 조회 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('학원 정보 조회 중 오류:', error)
    return null
  }
}

/**
 * 사용자의 학원에 속한 모든 사용자 조회
 */
export async function getAcademyUsers() {
  try {
    const academyId = getServerAcademyId()
    if (!academyId) return { data: null, error: new Error('학원 ID가 없습니다.') }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('user_role')
      .select(`
        *,
        academy:academy_id (*)
      `)
      .eq('academy_id', academyId)
      .eq('is_active', true)

    return { data, error }
  } catch (error) {
    console.error('학원 사용자 조회 오류:', error)
    return { data: null, error }
  }
}

/**
 * 학원별 통계 데이터 조회
 */
export async function getAcademyStats() {
  try {
    const academyId = await getServerAcademyId()
    if (!academyId) return null

    const supabase = createServerClient()
    
    // 현재는 students와 payments 테이블이 없으므로 user_role만 조회
    const { count: userCount } = await supabase
      .from('user_role')
      .select('*', { count: 'exact', head: true })
      .eq('academy_id', academyId)

    const { count: teacherCount } = await supabase
      .from('user_role')
      .select('*', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .in('role', ['teacher', 'tutor'])

    return {
      totalUsers: userCount || 0,
      totalTeachers: teacherCount || 0,
      totalStudents: 0, // students 테이블이 없음
      totalPayments: 0, // payments 테이블이 없음
      recentStudents: [] // students 테이블이 없음
    }
  } catch (error) {
    console.error('학원 통계 조회 오류:', error)
    return null
  }
}
