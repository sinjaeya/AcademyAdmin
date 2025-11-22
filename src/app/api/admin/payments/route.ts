import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerAcademyId, isServerUserAdmin } from '@/lib/auth/server-context';

// 결제 내역 목록 조회
export async function GET() {
  try {
    const supabase = createServerClient();
    const academyId = await getServerAcademyId();
    const isAdmin = await isServerUserAdmin();

    // 쿼리 빌더 시작
    let query = supabase
      .from('payment')
      .select('*');

    // 관리자가 아닌 경우 현재 학원의 데이터만 조회
    if (!isAdmin && academyId) {
      query = query.eq('academy_id', academyId);
    }

    // 입금일시 기준 내림차순 정렬
    const { data, error } = await query
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      // 테이블이 없는 경우 빈 배열 반환
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json([]);
      }
      return NextResponse.json(
        { error: error.message || '결제 내역을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 데이터가 없는 경우 빈 배열 반환
    if (!data || data.length === 0) {
      return NextResponse.json([]);
    }

    // 학생 ID 목록 수집 (BIGINT를 문자열로 변환)
    const studentIds = [...new Set(data.map((payment: any) => payment.student_id).filter(Boolean))];

    // 학생 정보 별도 조회
    const studentMap = new Map<string | number, { id: number; name: string }>();
    if (studentIds.length > 0) {
      const { data: studentsData, error: studentsError } = await supabase
        .from('student')
        .select('id, name')
        .in('id', studentIds);

      if (!studentsError && studentsData) {
        studentsData.forEach((student: { id: number; name: string }) => {
          // 숫자 ID를 키로 사용 (student_id와 타입 일치)
          studentMap.set(student.id, student);
        });
      }
    }

    // 학생 이름을 payment 객체에 포함
    const formattedData = (data || []).map((payment: any) => {
      // student_id가 숫자이므로 숫자로 매칭
      const student = studentMap.get(payment.student_id);
      
      return {
        ...payment,
        student_name: student?.name || null
      };
    });

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('API error:', error);
    // 테이블이 없는 경우 빈 배열 반환
    if (error instanceof Error && (error.message.includes('does not exist') || error.message.includes('42P01'))) {
      return NextResponse.json([]);
    }
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 새 결제 내역 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('POST /api/admin/payments - 요청 데이터:', body);
    
    const supabase = createServerClient();
    const academyId = await getServerAcademyId();

    // 필수 필드 검증
    if (!body.student_id || !body.amount || !body.payment_method || !body.study_month) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다. (학생, 금액, 입금방법, 해당월)' },
        { status: 400 }
      );
    }

    // 입금방법 검증
    if (body.payment_method !== '무통장' && body.payment_method !== '카드') {
      return NextResponse.json(
        { error: '입금방법은 "무통장" 또는 "카드"여야 합니다.' },
        { status: 400 }
      );
    }

    // 해당월 검증
    const validMonths = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    if (!validMonths.includes(body.study_month)) {
      return NextResponse.json(
        { error: '해당월은 1월부터 12월까지의 값이어야 합니다.' },
        { status: 400 }
      );
    }

    // 학생 정보 조회하여 academy_id 확인
    const { data: studentData, error: studentError } = await supabase
      .from('student')
      .select('currentAcademy')
      .eq('id', body.student_id)
      .single();

    if (studentError || !studentData) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // academy_id 결정: body에 있으면 사용, 없으면 학생의 학원 또는 현재 사용자의 학원
    let finalAcademyId = body.academy_id;
    if (!finalAcademyId) {
      // 학생의 학원 정보는 다른 방식으로 저장되어 있을 수 있으므로
      // 현재 사용자의 학원 ID를 사용
      finalAcademyId = academyId;
    }

    // payment_date 처리: 클라이언트에서 전달된 값 사용 (없으면 서버 시간)
    let paymentDate = body.payment_date;
    if (!paymentDate) {
      paymentDate = new Date().toISOString();
    }

    // payment 객체 생성
    const paymentToInsert = {
      student_id: body.student_id,
      payer_name: body.payer_name || null,
      amount: parseInt(body.amount),
      payment_date: paymentDate,
      payment_method: body.payment_method,
      study_month: body.study_month,
      cash_receipt_issued: body.cash_receipt_issued === true || body.cash_receipt_issued === 'true',
      academy_id: finalAcademyId || null
    };

    console.log('INSERT payment:', paymentToInsert);

    const { data, error } = await supabase
      .from('payment')
      .insert(paymentToInsert)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: error.message || '결제 내역 추가에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 추가된 payment에 학생 이름 포함
    if (data && data.student_id) {
      const { data: studentData, error: studentError } = await supabase
        .from('student')
        .select('id, name')
        .eq('id', data.student_id)
        .single();

      if (!studentError && studentData) {
        return NextResponse.json({
          ...data,
          student_name: studentData.name
        }, { status: 201 });
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

