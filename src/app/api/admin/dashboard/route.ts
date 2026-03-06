import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerUserContext } from '@/lib/auth/server-context';

// KST 기준 오늘 날짜 범위 계산
function getTodayKSTRange() {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayKST = kstNow.toISOString().split('T')[0];
  const todayStart = `${todayKST}T00:00:00+09:00`;
  const todayEnd = `${todayKST}T23:59:59+09:00`;
  return { todayStart, todayEnd, todayKST };
}

// KST 기준 이번 달 시작일 계산
function getMonthStartKST() {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kstNow.getFullYear();
  const month = kstNow.getMonth(); // 0-based
  const monthStart = new Date(year, month, 1);
  const monthStartStr = `${monthStart.toISOString().split('T')[0]}T00:00:00+09:00`;
  return monthStartStr;
}

// 대시보드 데이터 조회 (GET)
export async function GET() {
  try {
    const userContext = await getServerUserContext();

    if (!userContext) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();
    const { todayStart, todayEnd } = getTodayKSTRange();
    const monthStartStr = getMonthStartKST();

    // 역할별 데이터 조회
    if (userContext.isAdmin) {
      // ===== Admin 역할: 전체 시스템 통계 =====
      const [
        academyResult,
        studentsResult,
        paymentsResult,
        sessionsResult,
        recentStudentsResult
      ] = await Promise.all([
        // 1. 전체 학원 수
        supabase
          .from('academy')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),

        // 2. 전체 학생 수 (상태별)
        supabase
          .from('student')
          .select('status'),

        // 3. 이번 달 수납 현황
        supabase
          .from('payment')
          .select('amount, payment_method')
          .gte('payment_date', monthStartStr),

        // 4. 오늘 학습 세션 수
        supabase
          .from('test_session')
          .select('test_type')
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),

        // 5. 최근 등록 학생 5명
        supabase
          .from('student')
          .select(`
            id,
            name,
            grade,
            school,
            school_id,
            academy_id,
            academy:academy_id(name),
            school_info:school_id(short_name),
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // 학생 상태별 그룹핑
      const studentsByStatus = {
        total: studentsResult.data?.length || 0,
        active: studentsResult.data?.filter(s => s.status === '재원').length || 0,
        paused: studentsResult.data?.filter(s => s.status === '휴원').length || 0,
        terminated: studentsResult.data?.filter(s => s.status === '해지').length || 0
      };

      // 수납 총액 계산
      const totalPayments = paymentsResult.data?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

      // 세션 타입별 카운트
      const sessionsByType: Record<string, number> = {};
      sessionsResult.data?.forEach(s => {
        const type = s.test_type || 'unknown';
        sessionsByType[type] = (sessionsByType[type] || 0) + 1;
      });

      // 최근 학생 목록 정리
      const recentStudents = recentStudentsResult.data?.map(s => {
        const academy = s.academy as { name: string } | { name: string }[] | null;
        const academy_name = Array.isArray(academy)
          ? academy[0]?.name
          : academy?.name;

        // school_info: schools 테이블 JOIN 결과
        const schoolInfo = s.school_info as { short_name: string } | { short_name: string }[] | null;
        const schoolShortName = Array.isArray(schoolInfo)
          ? schoolInfo[0]?.short_name
          : schoolInfo?.short_name;
        // school_id FK 있으면 short_name 우선, 없으면 기존 school 텍스트 폴백
        const school_name = schoolShortName || s.school || null;

        return {
          id: s.id,
          name: s.name,
          grade: s.grade,
          school: s.school,
          school_name,
          academy_name,
          created_at: s.created_at
        };
      }) || [];

      return NextResponse.json({
        success: true,
        data: {
          role: 'admin',
          academyCount: academyResult.count || 0,
          students: studentsByStatus,
          payments: {
            totalAmount: totalPayments,
            count: paymentsResult.data?.length || 0
          },
          sessions: {
            total: sessionsResult.data?.length || 0,
            byType: sessionsByType
          },
          recentStudents
        }
      });
    } else if (userContext.user.role_id === 'academy_owner') {
      // ===== Academy Owner 역할: 내 학원 통계 =====
      const academyId = userContext.user.academy_id;

      if (!academyId) {
        return NextResponse.json({
          success: true,
          data: {
            role: 'academy_owner',
            students: { total: 0, active: 0, paused: 0, terminated: 0 },
            todayAttendance: 0,
            payments: { totalAmount: 0, count: 0 },
            sessions: { total: 0, byType: {} },
            recentStudents: []
          }
        });
      }

      const [
        studentsResult,
        attendanceResult,
        paymentsResult,
        sessionsResult,
        recentStudentsResult
      ] = await Promise.all([
        // 1. 내 학원 학생 수 (상태별)
        supabase
          .from('student')
          .select('status')
          .eq('academy_id', academyId),

        // 2. 오늘 출석 현황
        supabase
          .from('check_in_board')
          .select('id', { count: 'exact', head: true })
          .eq('academy_id', academyId)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),

        // 3. 이번 달 수납 현황
        supabase
          .from('payment')
          .select('amount, payment_method')
          .eq('academy_id', academyId)
          .gte('payment_date', monthStartStr),

        // 4. 오늘 학습 세션
        supabase
          .from('test_session')
          .select('test_type')
          .eq('academy_id', academyId)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),

        // 5. 최근 등록 학생 5명
        supabase
          .from('student')
          .select('id, name, grade, school, created_at')
          .eq('academy_id', academyId)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // 학생 상태별 그룹핑
      const studentsByStatus = {
        total: studentsResult.data?.length || 0,
        active: studentsResult.data?.filter(s => s.status === '재원').length || 0,
        paused: studentsResult.data?.filter(s => s.status === '휴원').length || 0,
        terminated: studentsResult.data?.filter(s => s.status === '해지').length || 0
      };

      // 수납 총액 계산
      const totalPayments = paymentsResult.data?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

      // 세션 타입별 카운트
      const sessionsByType: Record<string, number> = {};
      sessionsResult.data?.forEach(s => {
        const type = s.test_type || 'unknown';
        sessionsByType[type] = (sessionsByType[type] || 0) + 1;
      });

      return NextResponse.json({
        success: true,
        data: {
          role: 'academy_owner',
          students: studentsByStatus,
          todayAttendance: attendanceResult.count || 0,
          payments: {
            totalAmount: totalPayments,
            count: paymentsResult.data?.length || 0
          },
          sessions: {
            total: sessionsResult.data?.length || 0,
            byType: sessionsByType
          },
          recentStudents: recentStudentsResult.data || []
        }
      });
    } else {
      // ===== Teacher 및 기타 역할: 제한된 통계 =====
      const academyId = userContext.user.academy_id;

      if (!academyId) {
        return NextResponse.json({
          success: true,
          data: {
            role: 'teacher',
            todayAttendance: 0,
            activeSessions: 0,
            completedSessions: 0
          }
        });
      }

      const [
        attendanceResult,
        activeSessionsResult,
        completedSessionsResult
      ] = await Promise.all([
        // 1. 오늘 출석 학생 수
        supabase
          .from('check_in_board')
          .select('id', { count: 'exact', head: true })
          .eq('academy_id', academyId)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),

        // 2. 현재 활성 세션 (completed_at이 NULL)
        supabase
          .from('test_session')
          .select('id', { count: 'exact', head: true })
          .eq('academy_id', academyId)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .is('completed_at', null),

        // 3. 오늘 완료 세션 수
        supabase
          .from('test_session')
          .select('id', { count: 'exact', head: true })
          .eq('academy_id', academyId)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .not('completed_at', 'is', null)
      ]);

      return NextResponse.json({
        success: true,
        data: {
          role: 'teacher',
          todayAttendance: attendanceResult.count || 0,
          activeSessions: activeSessionsResult.count || 0,
          completedSessions: completedSessionsResult.count || 0
        }
      });
    }
  } catch (error) {
    console.error('대시보드 API 오류:', error);
    return NextResponse.json(
      { error: '대시보드 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
