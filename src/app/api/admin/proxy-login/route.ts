import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerUserContext } from '@/lib/auth/server-context';
import { randomUUID } from 'crypto';

/**
 * POST: 대리 로그인 토큰 생성
 * 요청: { student_id: number }
 * 응답: { success: true, data: { token: string, url: string } }
 */
export async function POST(request: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === 'development';

    // 현재 로그인 사용자 컨텍스트 확인
    const userContext = await getServerUserContext();
    if (!userContext) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { student_id } = body;

    // student_id 검증
    if (!student_id) {
      return NextResponse.json(
        { success: false, error: 'student_id는 필수입니다.' },
        { status: 400 }
      );
    }

    // 학생 조회 (기존 students API와 동일한 패턴: select('*, academy:academy_id(id, name)'))
    const supabase = createServerClient();
    const { data: student, error: studentError } = await supabase
      .from('student')
      .select(`
        *,
        academy:academy_id (
          id,
          name
        )
      `)
      .eq('id', student_id)
      .single();

    // 디버그: 조회 결과 출력 (개발 환경에서만)
    if (isDev) {
      console.log('[proxy-login] 학생 조회 결과:', {
        student_id,
        student,
        studentError,
        student_academy_id: student?.academy_id,
        student_academy_object: student?.academy
      });

      console.log('[proxy-login] userContext:', {
        user_id: userContext.user.id,
        user_name: userContext.user.name,
        user_academy_id: userContext.user.academy_id,
        academy_object: userContext.academy
      });
    }

    if (studentError || !student) {
      console.error('학생 조회 오류:', studentError);
      return NextResponse.json(
        { success: false, error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 학원 격리 검증: 관리자가 아닌 경우 자기 학원 학생만 접근 가능
    if (!userContext.isAdmin && String(student.academy_id) !== String(userContext.user.academy_id)) {
      return NextResponse.json(
        { success: false, error: '해당 학생에 대한 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // academy_id 결정 로직
    // 1. 학생의 academy_id 우선
    // 2. 없으면 userContext.user.academy_id 사용
    // 3. 둘 다 없으면 에러
    let academyId: string | null = null;

    if (student.academy_id != null) {
      academyId = String(student.academy_id);
    } else if (userContext.user.academy_id != null) {
      academyId = String(userContext.user.academy_id);
    }

    if (isDev) {
      console.log('[proxy-login] academy_id 결정:', {
        from_student: student.academy_id,
        from_user: userContext.user.academy_id,
        final: academyId
      });
    }

    if (!academyId) {
      return NextResponse.json(
        {
          success: false,
          error: '학원 정보를 확인할 수 없습니다. (학생 academy_id와 관리자 academy_id 모두 null)',
          debug: {
            student_academy_id: student.academy_id,
            user_academy_id: userContext.user.academy_id
          }
        },
        { status: 400 }
      );
    }

    // 일회용 토큰 생성
    const token = randomUUID();

    // 토큰 만료 시간 설정 (현재 시각 + 5분)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // student_id를 숫자로 변환 (NaN 체크)
    const studentIdNum = Number(student_id);
    if (isNaN(studentIdNum)) {
      return NextResponse.json(
        { success: false, error: 'student_id는 유효한 숫자여야 합니다.' },
        { status: 400 }
      );
    }

    if (isDev) {
      console.log('[proxy-login] INSERT 데이터:', {
        token: token.substring(0, 8) + '...', // 토큰 앞 8자만 표시
        student_id: studentIdNum,
        admin_user_id: userContext.user.id,
        academy_id: academyId,
        expires_at: expiresAt.toISOString(),
        used: false
      });
    }

    // admin_proxy_login_tokens 테이블에 INSERT
    const { error: insertError } = await supabase
      .from('admin_proxy_login_tokens')
      .insert({
        token,
        student_id: studentIdNum,
        admin_user_id: userContext.user.id,
        academy_id: academyId,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (insertError) {
      console.error('토큰 생성 오류:', insertError);
      return NextResponse.json(
        { success: false, error: `토큰 생성 오류: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Student App URL 생성
    const studentAppUrl = process.env.NEXT_PUBLIC_STUDENT_APP_URL || 'http://localhost:3001';
    const proxyLoginUrl = `${studentAppUrl}/proxy-login?token=${token}`;

    if (isDev) {
      console.log(`[proxy-login] 대리 로그인 토큰 생성 완료: student_id=${studentIdNum}, admin=${userContext.user.name}, token=${token.substring(0, 8)}..., academy_id=${academyId}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        token,
        url: proxyLoginUrl
      },
      message: '대리 로그인 토큰이 생성되었습니다.'
    });
  } catch (error) {
    console.error('[proxy-login] API error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
