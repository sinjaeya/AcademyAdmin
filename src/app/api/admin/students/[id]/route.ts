import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

// 학생 정보 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    // 핸드폰 번호에서 중간 4자리 추출
    const extractMiddle4Digits = (phoneNumber: string): string => {
      const digits = phoneNumber.replace(/\D/g, '');
      
      if (digits.length === 11) {
        return digits.substring(3, 7);
      }
      
      if (digits.length === 10) {
        return digits.substring(2, 6);
      }
      
      return '';
    };

    // 업데이트할 데이터 준비 (undefined 값 제거)
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone_number !== undefined) {
      updateData.phone_number = body.phone_number;
      // 핸드폰 번호가 변경되면 중간 4자리 자동 추출
      updateData.phone_middle_4 = extractMiddle4Digits(body.phone_number);
    }
    if (body.phone_middle_4 !== undefined) updateData.phone_middle_4 = body.phone_middle_4;
    if (body.school !== undefined) updateData.school = body.school;
    if (body.grade !== undefined) updateData.grade = body.grade;
    if (body.parent_phone !== undefined) updateData.parent_phone = body.parent_phone;
    if (body.parent_type !== undefined && body.parent_type !== '') {
      updateData.parent_type = body.parent_type;
    }
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.rubric_grade_level !== undefined) updateData.rubric_grade_level = body.rubric_grade_level || null;
    if (body.rubric_difficulty_level !== undefined) updateData.rubric_difficulty_level = body.rubric_difficulty_level || null;
    if (body.sentence_level !== undefined) updateData.sentence_level = body.sentence_level || null;
    // academy_id가 제공된 경우 사용 (UUID 타입)
    if (body.academy_id !== undefined) {
      updateData.academy_id = body.academy_id || null;
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.study_time !== undefined) updateData.study_time = String(body.study_time);  // TEXT 타입
    
    // 비밀번호가 제공된 경우에만 해싱하여 업데이트
    if (body.password !== undefined && body.password !== null && body.password.trim() !== '') {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    // 업데이트할 데이터가 없으면 에러 반환
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('student')
      .update(updateData)
      .eq('id', studentId)
      .select(`
        *,
        academy:academy_id (
          id,
          name
        )
      `);

    if (error) {
      console.error('Error updating student:', error);
      console.error('Request body:', JSON.stringify(body, null, 2));
      return NextResponse.json(
        { error: error.message || '학생 정보 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error('No data returned from update');
      return NextResponse.json(
        { error: '업데이트된 데이터를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // academy 정보 정리
    const updatedStudent = data[0];
    const academy = updatedStudent.academy && typeof updatedStudent.academy === 'object' && !Array.isArray(updatedStudent.academy)
      ? updatedStudent.academy
      : null;

    return NextResponse.json({
      success: true,
      data: {
        ...updatedStudent,
        academy_id: updatedStudent.academy_id || null,
        academy_name: academy?.name || null,
      },
      message: '학생 정보가 성공적으로 업데이트되었습니다.'
    }, { status: 200 });

  } catch (error) {
    console.error('Error in PUT /api/admin/students/[id]:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 학생 정보 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from('student')
      .delete()
      .eq('id', studentId);

    if (error) {
      console.error('Error deleting student:', error);
      return NextResponse.json(
        { error: '학생 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '학생이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/students/[id]:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
