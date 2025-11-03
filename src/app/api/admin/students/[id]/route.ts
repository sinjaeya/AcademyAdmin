import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

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
    if (body.currentAcademy !== undefined) updateData.currentAcademy = body.currentAcademy;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.study_time !== undefined) updateData.study_time = body.study_time;

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
      .select();

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

    return NextResponse.json({
      success: true,
      data: data[0],
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
