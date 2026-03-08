import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 학습이력 응답 항목 타입
interface SessionHistoryItem {
  id: number;
  created_at: string;
  completed_at: string | null;
  total_items: number;
  correct_count: number;
  score: number | null;
  duration_seconds: number | null;
}

// DB에서 조회한 test_session raw 타입
interface RawSessionRow {
  id: number;
  created_at: string;
  completed_at: string | null;
  total_items: number;
  correct_count: number | null;
  accuracy_rate: number | null;
  duration_seconds: number | null;
  metadata: Record<string, unknown> | null;
}

// 날짜별 학습이력 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
): Promise<NextResponse> {
  try {
    const supabase = createServerClient();
    const { studentId } = await params;
    const textbookId = request.nextUrl.searchParams.get('textbook_id');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'studentId는 필수입니다.' },
        { status: 400 }
      );
    }

    const studentIdNum = Number(studentId);
    if (isNaN(studentIdNum)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 studentId입니다.' },
        { status: 400 }
      );
    }

    // test_session 조회 (concept_check 타입, 최근 50건)
    // textbook_id 필터는 metadata JSON 내부에 있으므로 전체 조회 후 JS에서 필터링
    const { data: sessions, error: sessionsError } = await supabase
      .from('test_session')
      .select('id, created_at, completed_at, total_items, correct_count, accuracy_rate, duration_seconds, metadata')
      .eq('student_id', studentIdNum)
      .eq('test_type', 'concept_check')
      .order('created_at', { ascending: false })
      .limit(200); // JS 필터링 후 50건 확보 위해 여유있게 조회

    if (sessionsError) {
      console.error('학습이력 조회 오류:', sessionsError);
      return NextResponse.json(
        { success: false, error: '학습이력 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const rawSessions = (sessions ?? []) as RawSessionRow[];

    // textbook_id 파라미터가 있으면 metadata에서 필터링
    const filtered = textbookId
      ? rawSessions.filter((s) => {
          if (!s.metadata) return false;
          return (s.metadata as Record<string, unknown>)['textbook_id'] === textbookId;
        })
      : rawSessions;

    // 최대 50건으로 제한
    const limited = filtered.slice(0, 50);

    // 응답 데이터 구성
    const data: SessionHistoryItem[] = limited.map((s) => ({
      id: s.id,
      created_at: s.created_at,
      completed_at: s.completed_at,
      total_items: s.total_items ?? 0,
      correct_count: s.correct_count ?? 0,
      // accuracy_rate를 score로 사용 (0~100 범위), 없으면 직접 계산
      score:
        s.accuracy_rate !== null
          ? s.accuracy_rate
          : s.total_items
          ? Math.round(((s.correct_count ?? 0) / s.total_items) * 100)
          : null,
      duration_seconds: s.duration_seconds,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('concept-learning history GET 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
