import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

// 학생 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;

    // status 파라미터가 있으면 사용, 없으면 기본값 '재원' 사용
    const status = searchParams.get('status') || '재원';
    // academy_id 파라미터로 학원별 필터링
    const academyId = searchParams.get('academy_id');

    let query = supabase
      .from('student')
      .select(`
        *,
        academy:academy_id (
          id,
          name
        )
      `);

    // academy_id가 있으면 해당 학원 학생만 조회
    if (academyId) {
      query = query.eq('academy_id', academyId);
    }

    // status가 'all'이 아니면 필터링 적용
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: students, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '학생 목록을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 당월 납부 여부 확인 (study_month 기준)
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentMonthStr = `${currentMonth}월`; // '1월', '2월', ..., '12월'

    // 학생 ID 목록 수집 (BIGINT - 숫자 타입)
    const studentIds = (students || []).map((s: any) => {
      const id = typeof s.id === 'string' ? parseInt(s.id) : s.id;
      return isNaN(id) ? null : id;
    }).filter((id): id is number => id !== null);
    
    // 해당월 납부 내역 조회 (study_month 컬럼 기준)
    const paidStudentIds = new Set<number>();
    if (studentIds.length > 0) {
      const { data: payments, error: paymentError } = await supabase
        .from('payment')
        .select('student_id')
        .in('student_id', studentIds)
        .eq('study_month', currentMonthStr);

      if (!paymentError && payments) {
        payments.forEach((p: any) => {
          paidStudentIds.add(p.student_id);
        });
      }
    }

    // 학생 목록에 당월 납부 여부 추가 및 academy 정보 정리 (ID를 숫자로 변환하여 매칭)
    const studentsWithPaymentStatus = (students || []).map((student: any) => {
      const studentId = typeof student.id === 'string' ? parseInt(student.id) : student.id;
      const academy = student.academy && typeof student.academy === 'object' && !Array.isArray(student.academy)
        ? student.academy
        : null;
      
      return {
        ...student,
        academy_id: student.academy_id || null,
        academy_name: academy?.name || student.currentAcademy || null, // 하위 호환성을 위해 currentAcademy도 유지
        hasPaidThisMonth: !isNaN(studentId) && paidStudentIds.has(studentId)
      };
    });

    return NextResponse.json(studentsWithPaymentStatus);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 새 학생 추가 - 순차 처리 방식
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('POST /api/admin/students - 요청 데이터:', body);
    
    const supabase = createServerClient();

    // 비밀번호 해싱 처리
    let passwordHash = null;
    if (body.password && body.password.trim() !== '') {
      passwordHash = await bcrypt.hash(body.password, 10);
    } else {
      // 비밀번호가 없으면 기본 비밀번호 설정 (예: 'student1234')
      passwordHash = await bcrypt.hash('student1234', 10);
    }

    // 필드명 매핑 (정확한 컬럼명 사용)
    const studentToInsert: any = {
      name: body.name,
      phone_number: body.phone_number || null,
      phone_middle_4: body.phone_middle_4 || null,
      school: body.school || null,
      grade: body.grade || null,
      parent_phone: body.parent_phone || null,
      parent_type: body.parent_type || '엄마',  // 기본값: '엄마'
      email: body.email || null,
      password: passwordHash,
      rubric_grade_level: body.rubric_grade_level || 'middle',
      rubric_difficulty_level: body.rubric_difficulty_level || 'medium',
      sentence_level: body.sentence_level || 'Lv3_Mid1',  // 기본값: 'Lv3_Mid1' (중1)
      status: body.status || 'active',
    };

    // academy_id가 제공된 경우 사용, 없으면 currentAcademy로 academy_id 찾기
    if (body.academy_id) {
      studentToInsert.academy_id = body.academy_id;
    } else if (body.currentAcademy) {
      // currentAcademy 이름으로 academy_id 찾기
      const { data: academy } = await supabase
        .from('academy')
        .select('id')
        .eq('name', body.currentAcademy)
        .single();
      
      if (academy) {
        studentToInsert.academy_id = academy.id;
      }
    }

    // 1단계: student 테이블에 학생 정보 추가
    const { data: studentData, error: studentError } = await supabase
      .from('student')
      .insert([studentToInsert])
      .select();

    if (studentError) {
      console.error('Student insert error:', studentError);
      return NextResponse.json(
        { error: '학생 추가 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 2단계: 이메일이 있으면 auth.users에 사용자 생성 (더미)
    if (body.email) {
      try {
        const authResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/auth-users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: body.email })
        });

        if (authResponse.ok) {
          const authResult = await authResponse.json();
          console.log('Auth user created (dummy):', authResult.user.id);
          
          // 3단계: student 테이블의 auth_user_id 업데이트 (더미 ID)
          const { error: updateError } = await supabase
            .from('student')
            .update({ 
              auth_user_id: authResult.user.id,
              is_app_registered: true 
            })
            .eq('id', studentData[0].id);

          if (updateError) {
            console.error('Student update error:', updateError);
            // auth.users는 생성되었지만 student 업데이트 실패
            // 이 경우는 로그만 남기고 계속 진행
          } else {
            console.log('Student auth_user_id updated successfully (dummy)');
          }
        } else {
          const errorText = await authResponse.text();
          console.error('Auth user creation failed:', errorText);
          // auth.users 생성 실패해도 학생 추가는 성공으로 처리
        }
      } catch (authError) {
        console.error('Auth user creation error:', authError);
        // auth.users 생성 실패해도 학생 추가는 성공으로 처리
      }
    }

    console.log('학생 추가 성공:', studentData);
    return NextResponse.json(studentData);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
