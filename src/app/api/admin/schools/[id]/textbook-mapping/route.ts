import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 교재 라벨 생성 헬퍼
function buildTextbookLabel(textbook: {
  subject?: string | null;
  level?: string | null;
  grade?: number | null;
  semester?: number | null;
  publisher?: string | null;
}): string {
  const parts = [
    textbook.subject,
    textbook.level,
    textbook.grade != null ? `${textbook.grade}학년` : null,
    textbook.semester != null ? `${textbook.semester}학기` : null,
    textbook.publisher ? `(${textbook.publisher})` : null,
  ].filter(Boolean);
  return parts.join(' ');
}

// 특정 학교의 학년별 교재 매핑 + 전체 교재 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schoolId = Number(id);

    if (isNaN(schoolId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 학교 ID입니다.' }, { status: 400 });
    }

    const supabase = createServerClient();

    // 현재 학교의 매핑 목록 조회
    const { data: mappings, error: mappingError } = await supabase
      .from('school_grade_textbook')
      .select(`
        school_id,
        grade,
        textbook_id,
        textbooks (*)
      `)
      .eq('school_id', schoolId);

    if (mappingError) {
      console.error('교재 매핑 조회 오류:', mappingError);
      return NextResponse.json({ success: false, error: '교재 매핑 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 전체 교재 목록 조회
    const { data: textbooks, error: textbookError } = await supabase
      .from('textbooks')
      .select('*')
      .order('grade', { ascending: true });

    if (textbookError) {
      console.error('교재 목록 조회 오류:', textbookError);
      return NextResponse.json({ success: false, error: '교재 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 교재에 label 추가
    const textbooksWithLabel = (textbooks ?? []).map((tb) => ({
      ...tb,
      label: buildTextbookLabel(tb),
    }));

    return NextResponse.json({
      success: true,
      data: {
        mappings: mappings ?? [],
        textbooks: textbooksWithLabel,
      },
    });
  } catch (error) {
    console.error('textbook-mapping GET 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 학년-교재 매핑 추가 (복수 교재 지원)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schoolId = Number(id);

    if (isNaN(schoolId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 학교 ID입니다.' }, { status: 400 });
    }

    const supabase = createServerClient();
    const body = await request.json();
    const { grade, textbook_id } = body;

    if (!grade || !textbook_id) {
      return NextResponse.json({ success: false, error: 'grade와 textbook_id는 필수입니다.' }, { status: 400 });
    }

    // PK (school_id, grade, textbook_id) 기준 단순 insert
    const { data, error } = await supabase
      .from('school_grade_textbook')
      .insert({ school_id: schoolId, grade, textbook_id })
      .select()
      .single();

    if (error) {
      // 중복 키 에러 (23505: unique_violation)
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: '이미 추가된 교재입니다.' }, { status: 409 });
      }
      console.error('교재 매핑 추가 오류:', error);
      return NextResponse.json({ success: false, error: '교재 매핑 저장 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('textbook-mapping PUT 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 특정 학년-교재 매핑 삭제 (grade + textbook_id 기준)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schoolId = Number(id);

    if (isNaN(schoolId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 학교 ID입니다.' }, { status: 400 });
    }

    const { searchParams } = request.nextUrl;
    const grade = searchParams.get('grade');
    const textbookId = searchParams.get('textbook_id');

    if (!grade || !textbookId) {
      return NextResponse.json({ success: false, error: 'grade와 textbook_id 파라미터는 필수입니다.' }, { status: 400 });
    }

    const supabase = createServerClient();

    // PK 3개 컬럼 모두 일치하는 행만 삭제 (textbook_id는 UUID string)
    const { error } = await supabase
      .from('school_grade_textbook')
      .delete()
      .eq('school_id', schoolId)
      .eq('grade', grade)
      .eq('textbook_id', textbookId);

    if (error) {
      console.error('교재 매핑 삭제 오류:', error);
      return NextResponse.json({ success: false, error: '교재 매핑 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('textbook-mapping DELETE 오류:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
