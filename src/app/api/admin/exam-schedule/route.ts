import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 시험기간 목록 항목 타입
export interface ExamScheduleItem {
  id: number;
  school_id: number;
  school_name: string;
  grade: string;
  exam_type: 'midterm' | 'final';
  exam_type_label: string;
  start_date: string;
  end_date: string;
  scope_unit_ids: string[];
  scope_count: number;
  textbook_id: string;
  textbook_label: string;
  d_day: number | null;
  created_at: string;
}

// textbooks.level + grade + semester로 라벨 생성
function buildTextbookLabel(publisher: string, level: string, grade: number, semester: number): string {
  const levelPrefix: Record<string, string> = { '초등': '초', '중등': '중', '고등': '고' };
  const prefix = levelPrefix[level] ?? level;
  return `${publisher} ${prefix}${grade}-${semester}`;
}

// KST 기준 오늘 날짜 문자열 반환 (YYYY-MM-DD)
function getTodayKst(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

// D-day 계산 (start_date - today, 음수면 시험 시작됨)
function calcDDay(startDate: string, todayStr: string): number {
  const start = new Date(startDate).getTime();
  const today = new Date(todayStr).getTime();
  return Math.round((start - today) / (1000 * 60 * 60 * 24));
}

// 시험기간 목록 조회
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createServerClient();

    // exam_schedule + schools + textbooks JOIN 조회
    const { data, error } = await supabase
      .from('exam_schedule')
      .select(`
        id,
        school_id,
        grade,
        exam_type,
        start_date,
        end_date,
        scope_unit_ids,
        textbook_id,
        created_at,
        schools:school_id (
          short_name
        ),
        textbooks:textbook_id (
          publisher,
          level,
          grade,
          semester
        )
      `)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('exam_schedule 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '시험기간 목록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const todayStr = getTodayKst();

    // DB 결과를 응답 타입으로 변환
    type RawRow = {
      id: number;
      school_id: number;
      grade: string;
      exam_type: 'midterm' | 'final';
      start_date: string;
      end_date: string;
      scope_unit_ids: string[];
      textbook_id: string;
      created_at: string;
      schools: { short_name: string } | { short_name: string }[] | null;
      textbooks: {
        publisher: string;
        level: string;
        grade: number;
        semester: number;
      } | {
        publisher: string;
        level: string;
        grade: number;
        semester: number;
      }[] | null;
    };

    const result: ExamScheduleItem[] = ((data ?? []) as unknown as RawRow[]).map((row) => {
      // schools 조인 결과 정규화
      const school = Array.isArray(row.schools) ? row.schools[0] : row.schools;
      // textbooks 조인 결과 정규화
      const tb = Array.isArray(row.textbooks) ? row.textbooks[0] : row.textbooks;

      const textbookLabel = tb
        ? buildTextbookLabel(tb.publisher, tb.level, tb.grade, tb.semester)
        : row.textbook_id;

      const examTypeLabel = row.exam_type === 'midterm' ? '중간고사' : '기말고사';

      return {
        id: row.id,
        school_id: row.school_id,
        school_name: school?.short_name ?? '',
        grade: row.grade,
        exam_type: row.exam_type,
        exam_type_label: examTypeLabel,
        start_date: row.start_date,
        end_date: row.end_date,
        scope_unit_ids: row.scope_unit_ids ?? [],
        scope_count: (row.scope_unit_ids ?? []).length,
        textbook_id: row.textbook_id,
        textbook_label: textbookLabel,
        d_day: calcDDay(row.start_date, todayStr),
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('exam-schedule GET 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 시험기간 등록
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { school_id, grade, exam_type, start_date, end_date, scope_unit_ids, textbook_id } = body;

    // 필수 필드 검증
    if (!school_id || !grade || !exam_type || !start_date || !end_date || !textbook_id) {
      return NextResponse.json(
        { success: false, error: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 날짜 순서 검증
    if (start_date > end_date) {
      return NextResponse.json(
        { success: false, error: '시작일은 종료일보다 이전이어야 합니다.' },
        { status: 400 }
      );
    }

    // 범위 단원 검증
    if (!Array.isArray(scope_unit_ids) || scope_unit_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '시험 범위 단원을 1개 이상 선택해야 합니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('exam_schedule')
      .insert({
        school_id,
        grade,
        exam_type,
        start_date,
        end_date,
        scope_unit_ids,
        textbook_id,
      })
      .select()
      .single();

    if (error) {
      // UNIQUE 제약 위반 처리
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: '해당 학교/학년/시험유형의 시험기간이 이미 존재합니다.' },
          { status: 409 }
        );
      }
      console.error('exam_schedule 등록 오류:', error);
      return NextResponse.json(
        { success: false, error: '시험기간 등록 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('exam-schedule POST 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
