import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerAcademyId, isServerUserAdmin } from '@/lib/auth/server-context';

// 결제 내역 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log(`PUT /api/admin/payments/${id} - 요청 데이터:`, body);

    const supabase = createServerClient();

    // 학원 데이터 격리
    const academyId = await getServerAcademyId();
    const isAdmin = await isServerUserAdmin();

    // 업데이트할 데이터 구성
    const updateData: any = {};

    if (body.student_id !== undefined) updateData.student_id = body.student_id;
    if (body.payer_name !== undefined) updateData.payer_name = body.payer_name || null;
    if (body.amount !== undefined) updateData.amount = parseInt(body.amount);
    if (body.payment_date !== undefined) updateData.payment_date = body.payment_date;
    if (body.payment_method !== undefined) {
      // 입금방법 검증
      if (body.payment_method !== '무통장' && body.payment_method !== '카드') {
        return NextResponse.json(
          { error: '입금방법은 "무통장" 또는 "카드"여야 합니다.' },
          { status: 400 }
        );
      }
      updateData.payment_method = body.payment_method;
    }
    if (body.study_month !== undefined) {
      // 해당월 검증
      const validMonths = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
      if (!validMonths.includes(body.study_month)) {
        return NextResponse.json(
          { error: '해당월은 1월부터 12월까지의 값이어야 합니다.' },
          { status: 400 }
        );
      }
      updateData.study_month = body.study_month;
    }
    if (body.cash_receipt_issued !== undefined) {
      updateData.cash_receipt_issued = body.cash_receipt_issued === true || body.cash_receipt_issued === 'true';
    }
    // admin만 academy_id 변경 가능
    if (isAdmin && body.academy_id !== undefined) updateData.academy_id = body.academy_id || null;

    // 업데이트할 데이터가 없는 경우
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    let updateQuery = supabase
      .from('payment')
      .update(updateData)
      .eq('id', id);

    // 관리자가 아닌 경우 자기 학원 결제만 수정 가능
    if (!isAdmin && academyId) {
      updateQuery = updateQuery.eq('academy_id', academyId);
    }

    const { data, error } = await updateQuery
      .select(`
        *,
        student:student_id (id, name)
      `)
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json(
        { error: error.message || '결제 내역 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: '결제 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 학생 이름을 payment 객체에 포함
    return NextResponse.json({
      ...data,
      student_name: data.student?.name || null
    }, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 결제 내역 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`DELETE /api/admin/payments/${id}`);

    const supabase = createServerClient();

    // 학원 데이터 격리
    const academyId = await getServerAcademyId();
    const isAdmin = await isServerUserAdmin();

    // 먼저 존재하는지 확인 (자기 학원 소속인지도 체크)
    let checkQuery = supabase
      .from('payment')
      .select('id')
      .eq('id', id);

    if (!isAdmin && academyId) {
      checkQuery = checkQuery.eq('academy_id', academyId);
    }

    const { data: existingPayment, error: checkError } = await checkQuery.single();

    if (checkError || !existingPayment) {
      return NextResponse.json(
        { error: '결제 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 삭제 실행
    let deleteQuery = supabase
      .from('payment')
      .delete()
      .eq('id', id);

    if (!isAdmin && academyId) {
      deleteQuery = deleteQuery.eq('academy_id', academyId);
    }

    const { error } = await deleteQuery;

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { error: error.message || '결제 내역 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: '결제 내역이 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

