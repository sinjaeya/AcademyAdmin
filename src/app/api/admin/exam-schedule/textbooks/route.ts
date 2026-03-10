import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// textbooks.level + grade + semester로 라벨 생성
function buildTextbookLabel(publisher: string, level: string, grade: number, semester: number): string {
  const levelPrefix: Record<string, string> = { '초등': '초', '중등': '중', '고등': '고' };
  const prefix = levelPrefix[level] ?? level;
  return `${publisher} ${prefix}${grade}-${semester}`;
}

// 학교+학년별 교재 목록 조회
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get('school_id');
    const grade = searchParams.get('grade');

    if (!schoolId || !grade) {
      return NextResponse.json(
        { success: false, error: 'school_id와 grade는 필수입니다.' },
        { status: 400 }
      );
    }

    // school_grade_textbook + textbooks JOIN 조회
    const { data, error } = await supabase
      .from('school_grade_textbook')
      .select(`
        textbook_id,
        textbooks:textbook_id (
          id,
          publisher,
          level,
          grade,
          semester
        )
      `)
      .eq('school_id', Number(schoolId))
      .eq('grade', grade);

    if (error) {
      console.error('school_grade_textbook 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '교재 목록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Supabase 조인 결과 타입
    type TextbookInfo = {
      id: string;
      publisher: string;
      level: string;
      grade: number;
      semester: number;
    };
    type Row = {
      textbook_id: string;
      textbooks: TextbookInfo | TextbookInfo[] | null;
    };

    // 교재 목록으로 변환
    const result: { id: string; label: string }[] = [];
    for (const row of ((data ?? []) as unknown as Row[])) {
      const tb = Array.isArray(row.textbooks) ? row.textbooks[0] : row.textbooks;
      if (tb) {
        result.push({
          id: row.textbook_id,
          label: buildTextbookLabel(tb.publisher, tb.level, tb.grade, tb.semester),
        });
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('exam-schedule/textbooks GET 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
