import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 응시 이력 응답 항목 타입
interface HistoryItem {
  id: number;
  created_at: string;
  completed_at: string | null;
  unit_range: string;         // 소단원 코드 (예: "1-01")
  unit_title: string;         // 소단원명 (textbook_units.title)
  set_number: number;         // 같은 unit_range 내 순번 (1~5)
  total_items: number;        // 총 문항 수 (10)
  correct_count: number;      // 정답 수
  score: number | null;       // accuracy_rate (0~100)
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

// DB에서 조회한 exam_sets raw 타입
interface RawExamSet {
  id: string;
  unit_range: string;
  created_at: string;
}

// DB에서 조회한 textbook_units raw 타입
interface RawUnitRow {
  id: string;
  unit_code: string | null;
  title: string;
  depth: number;
}

// 단원평가 응시 이력 조회 (최근 50건)
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

    // 쿼리1: 단원평가(unit_test) 세션 조회 (최근 200건, JS 필터 후 50건 제한)
    // metadata.textbook_id 필터는 JS에서 처리
    const { data: sessions, error: sessionsError } = await supabase
      .from('test_session')
      .select('id, created_at, completed_at, total_items, correct_count, accuracy_rate, duration_seconds, metadata')
      .eq('student_id', studentIdNum)
      .eq('test_type', 'unit_test')
      .order('created_at', { ascending: false })
      .limit(200);

    if (sessionsError) {
      console.error('단원평가 이력 조회 오류:', sessionsError);
      return NextResponse.json(
        { success: false, error: '응시 이력 조회 중 오류가 발생했습니다.' },
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

    if (limited.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 세션에서 사용된 set_id 목록 추출
    const setIds: string[] = [];
    for (const s of limited) {
      if (!s.metadata) continue;
      const setId = (s.metadata as Record<string, unknown>)['set_id'] as string | undefined;
      if (setId) setIds.push(setId);
    }

    // 교재 ID가 있으면 exam_sets + textbook_units 조회, 없으면 스킵
    let examSetMap = new Map<string, RawExamSet>();
    let unitTitleMap = new Map<string, string>(); // unit_code → title (소단원)

    if (setIds.length > 0 && textbookId) {
      // 쿼리2 + 쿼리3 병렬 실행
      const [setsResult, unitsResult] = await Promise.all([
        // 쿼리2: exam_sets 조회 (set_id → unit_range, created_at)
        supabase
          .from('exam_sets')
          .select('id, unit_range, created_at')
          .in('id', setIds),

        // 쿼리3: textbook_units에서 소단원(depth=1) unit_code → title 매핑
        supabase
          .from('textbook_units')
          .select('id, unit_code, title, depth')
          .eq('textbook_id', textbookId)
          .eq('depth', 1),
      ]);

      if (!setsResult.error && setsResult.data) {
        for (const row of (setsResult.data as RawExamSet[])) {
          examSetMap.set(row.id, row);
        }
      }

      if (!unitsResult.error && unitsResult.data) {
        for (const row of (unitsResult.data as RawUnitRow[])) {
          if (row.unit_code) {
            unitTitleMap.set(row.unit_code, row.title);
          }
        }
      }

      // 세트번호 부여: 같은 unit_range 내 created_at ASC 순으로 1~5번
      // 전체 exam_sets를 unit_range별로 그룹핑 후 번호 부여
      // (응시한 set_id 기준으로만 계산하면 번호가 달라질 수 있으므로 전체 조회)
      const allSetsResult = await supabase
        .from('exam_sets')
        .select('id, unit_range, created_at')
        .eq('textbook_id', textbookId)
        .order('unit_range', { ascending: true })
        .order('created_at', { ascending: true });

      if (!allSetsResult.error && allSetsResult.data) {
        const unitRangeCountMap = new Map<string, number>();
        for (const examSet of (allSetsResult.data as RawExamSet[])) {
          const currentCount = (unitRangeCountMap.get(examSet.unit_range) ?? 0) + 1;
          unitRangeCountMap.set(examSet.unit_range, currentCount);
          // examSetMap에 set_number 정보를 보강 (set_number를 별도 맵으로 관리)
          const existing = examSetMap.get(examSet.id);
          if (existing) {
            examSetMap.set(examSet.id, { ...existing, _setNumber: currentCount } as RawExamSet & { _setNumber: number });
          } else {
            // 응시한 set_id가 아닌 경우도 번호 계산에 포함
            const placeholder = { id: examSet.id, unit_range: examSet.unit_range, created_at: examSet.created_at };
            examSetMap.set(examSet.id, { ...placeholder, _setNumber: currentCount } as RawExamSet & { _setNumber: number });
          }
        }
      }
    }

    // 응답 데이터 구성
    const data: HistoryItem[] = limited.map((s) => {
      const setId = s.metadata
        ? ((s.metadata as Record<string, unknown>)['set_id'] as string | undefined)
        : undefined;

      const examSet = setId ? examSetMap.get(setId) : undefined;
      const unitRange = examSet?.unit_range ?? '';
      const unitTitle = unitRange ? (unitTitleMap.get(unitRange) ?? unitRange) : '';
      const setNumber = examSet ? ((examSet as RawExamSet & { _setNumber?: number })._setNumber ?? 1) : 1;

      return {
        id: s.id,
        created_at: s.created_at,
        completed_at: s.completed_at,
        unit_range: unitRange,
        unit_title: unitTitle,
        set_number: setNumber,
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
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('unit-exam history GET 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
