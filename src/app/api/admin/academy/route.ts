import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET: 학원 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // 모든 학원 조회 (관리자용)
    const { data: academies, error } = await supabase
      .from('academy')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('학원 목록 조회 오류:', error);
      return NextResponse.json(
        { error: '학원 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      academies: academies || []
    });

  } catch (error) {
    console.error('학원 목록 조회 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 학원 추가
export async function POST(request: NextRequest) {
  try {
    // 환경변수 확인
    console.log('환경변수 확인:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '없음',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '없음'
    });

    const body = await request.json();
    console.log('학원 추가 요청 데이터:', body);
    
    const { name, address, phone, email, website, description, logo_url, is_active } = body;

    // 필수 필드 검증
    if (!name) {
      console.log('필수 필드 누락: name');
      return NextResponse.json(
        { error: '학원명은 필수입니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    console.log('Supabase 서버 클라이언트 사용');

    // 새 학원 추가
    const insertData = {
      name,
      address: address || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      description: description || null,
      logo_url: logo_url || null,
      is_active: is_active !== undefined ? is_active : true
    };
    
    console.log('삽입할 데이터:', insertData);

    const { data: academy, error } = await supabase
      .from('academy')
      .insert(insertData)
      .select()
      .single();

    console.log('Supabase 응답:', { academy, error });

    if (error) {
      console.error('학원 추가 오류:', error);
      return NextResponse.json(
        { 
          error: '학원 추가에 실패했습니다.',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    console.log('학원 추가 성공:', academy);

    return NextResponse.json({
      success: true,
      academy,
      message: '학원이 성공적으로 추가되었습니다.'
    });

  } catch (error) {
    console.error('학원 추가 중 오류:', error);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
