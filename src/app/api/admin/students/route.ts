import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 학생 목록 조회
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('student')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '학생 목록을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
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

    // 필드명 매핑 (정확한 컬럼명 사용)
    const studentToInsert = {
      name: body.name,
      phone_number: body.phone_number || null,
      phone_middle_4: body.phone_middle_4 || null,
      school: body.school || null,
      grade: body.grade || null,
      parent_phone: body.parent_phone || null,
      parent_type: body.parent_type || '엄마',  // 기본값: '엄마'
      email: body.email || null,
      currentAcademy: body.currentAcademy || null,  // DB에서 camelCase 사용
      status: body.status || 'active',
    };

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
