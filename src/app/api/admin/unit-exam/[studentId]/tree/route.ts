import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 세트 응시 상태 타입
interface SetStatus {
  set_id: string;
  set_number: number;       // 같은 unit_range 내 created_at ASC 순서 (1~5)
  score: number | null;     // accuracy_rate, null=미응시
  completed_at: string | null;
  duration_seconds: number | null;
}

// 단원 트리 노드 타입
interface UnitTreeNode {
  id: string;
  unit_code: string | null;
  title: string;
  depth: number;            // 0=대단원, 1=소단원
  children: UnitTreeNode[];
  sets?: SetStatus[];       // depth 1(소단원)에만 존재
}

// DB에서 조회한 textbook_units raw 타입
interface RawUnitNode {
  id: string;
  parent_id: string | null;
  sort_order: number;
  unit_code: string | null;
  title: string;
  depth: number;
}

// DB에서 조회한 exam_sets raw 타입
interface RawExamSet {
  id: string;
  textbook_id: string;
  unit_range: string;       // 예: "1-01"
  created_at: string;
}

// DB에서 조회한 test_session raw 타입
interface RawSessionRow {
  id: number;
  created_at: string;
  completed_at: string | null;
  accuracy_rate: number | null;
  duration_seconds: number | null;
  metadata: Record<string, unknown> | null;
}

// flat 배열 → 재귀 트리 빌드 (depth 0~1만 사용)
function buildTree(
  units: RawUnitNode[],
  setStatusMap: Map<string, SetStatus[]>  // unit_id → SetStatus[]
): UnitTreeNode[] {
  const nodeMap = new Map<string, UnitTreeNode>();

  // 모든 노드를 UnitTreeNode로 변환하여 Map에 등록
  for (const unit of units) {
    const node: UnitTreeNode = {
      id: unit.id,
      unit_code: unit.unit_code,
      title: unit.title,
      depth: unit.depth,
      children: [],
    };
    // 소단원(depth 1)에만 sets 필드 추가
    if (unit.depth === 1) {
      node.sets = setStatusMap.get(unit.id) ?? [];
    }
    nodeMap.set(unit.id, node);
  }

  const roots: UnitTreeNode[] = [];

  // parent_id 기준으로 children 배열에 삽입
  for (const unit of units) {
    const node = nodeMap.get(unit.id)!;
    if (unit.parent_id === null) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(unit.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  // sort_order 기준 정렬 (재귀)
  function sortChildren(nodes: UnitTreeNode[]): void {
    // sort_order가 없으므로 DB 조회 순서(sort_order ASC) 그대로 유지
    for (const n of nodes) {
      sortChildren(n.children);
    }
  }
  sortChildren(roots);

  return roots;
}

// 소단원별 세트 응시 현황 트리 조회
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

    if (!textbookId) {
      return NextResponse.json(
        { success: false, error: 'textbook_id는 필수입니다.' },
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

    // 쿼리1 + 쿼리2 + 쿼리3 병렬 실행
    const [unitsResult, setsResult, sessionsResult] = await Promise.all([
      // 쿼리1: textbook_units에서 depth 0(대단원), 1(소단원)만 조회
      supabase
        .from('textbook_units')
        .select('id, parent_id, sort_order, unit_code, title, depth')
        .eq('textbook_id', textbookId)
        .in('depth', [0, 1])
        .order('sort_order', { ascending: true }),

      // 쿼리2: 해당 교재의 승인된 exam_sets 조회 (세트번호 부여용)
      supabase
        .from('exam_sets')
        .select('id, textbook_id, unit_range, created_at')
        .eq('textbook_id', textbookId)
        .eq('status', 'approved')
        .order('unit_range', { ascending: true })
        .order('created_at', { ascending: true }),

      // 쿼리3: 해당 학생의 단원평가(unit_test) 세션 전체 조회
      // metadata 필터는 JS에서 처리 (Supabase JSON 필터 미사용)
      supabase
        .from('test_session')
        .select('id, created_at, completed_at, accuracy_rate, duration_seconds, metadata')
        .eq('student_id', studentIdNum)
        .eq('test_type', 'unit_test')
        .order('completed_at', { ascending: false }),
    ]);

    if (unitsResult.error) {
      console.error('textbook_units 조회 오류:', unitsResult.error);
      return NextResponse.json(
        { success: false, error: '단원 트리 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (setsResult.error) {
      console.error('exam_sets 조회 오류:', setsResult.error);
      return NextResponse.json(
        { success: false, error: '세트 목록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (sessionsResult.error) {
      console.error('test_session 조회 오류:', sessionsResult.error);
      return NextResponse.json(
        { success: false, error: '응시 세션 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const units = (unitsResult.data ?? []) as RawUnitNode[];
    const examSets = (setsResult.data ?? []) as RawExamSet[];
    const sessions = (sessionsResult.data ?? []) as RawSessionRow[];

    // --- 세트번호 부여 ---
    // 같은 unit_range 내에서 created_at ASC 순으로 1~5번 부여
    // set_id → set_number 맵
    const setNumberMap = new Map<string, number>();
    const unitRangeCountMap = new Map<string, number>();

    for (const examSet of examSets) {
      const currentCount = (unitRangeCountMap.get(examSet.unit_range) ?? 0) + 1;
      unitRangeCountMap.set(examSet.unit_range, currentCount);
      setNumberMap.set(examSet.id, currentCount);
    }

    // exam_sets: unit_range → RawExamSet[] 맵 (소단원 unit_code 기반 매핑용)
    const setsByUnitRange = new Map<string, RawExamSet[]>();
    for (const examSet of examSets) {
      const list = setsByUnitRange.get(examSet.unit_range) ?? [];
      list.push(examSet);
      setsByUnitRange.set(examSet.unit_range, list);
    }

    // --- 학생 세션 데이터 처리 ---
    // textbook_id 필터: metadata.textbook_id가 일치하는 세션만 사용
    const relevantSessions = sessions.filter((s) => {
      if (!s.metadata) return false;
      return (s.metadata as Record<string, unknown>)['textbook_id'] === textbookId;
    });

    // set_id → 가장 최근 완료 세션 맵 (최고 점수 대신 최근 응시 결과 표시)
    const sessionBySetId = new Map<string, RawSessionRow>();
    for (const session of relevantSessions) {
      if (!session.metadata) continue;
      const setId = (session.metadata as Record<string, unknown>)['set_id'] as string | undefined;
      if (!setId) continue;

      // 이미 등록된 세션이 있으면 완료된 세션을 우선, 완료 시간 최신 우선
      const existing = sessionBySetId.get(setId);
      if (!existing) {
        sessionBySetId.set(setId, session);
      } else {
        // 완료된 세션 우선 (completed_at not null)
        const existingCompleted = existing.completed_at !== null;
        const currentCompleted = session.completed_at !== null;
        if (!existingCompleted && currentCompleted) {
          sessionBySetId.set(setId, session);
        }
      }
    }

    // --- 소단원(depth 1) unit_id → SetStatus[] 맵 구성 ---
    // unit_code ↔ unit_range 매칭: textbook_units.unit_code === exam_sets.unit_range
    const setStatusMap = new Map<string, SetStatus[]>();

    for (const unit of units) {
      if (unit.depth !== 1) continue;
      if (!unit.unit_code) continue;

      // 해당 소단원의 exam_sets 조회 (unit_code === unit_range)
      const unitSets = setsByUnitRange.get(unit.unit_code) ?? [];
      const setStatuses: SetStatus[] = unitSets.map((examSet) => {
        const session = sessionBySetId.get(examSet.id);
        return {
          set_id: examSet.id,
          set_number: setNumberMap.get(examSet.id) ?? 1,
          score: session?.completed_at ? (session.accuracy_rate ?? null) : null,
          completed_at: session?.completed_at ?? null,
          duration_seconds: session?.duration_seconds ?? null,
        };
      });

      setStatusMap.set(unit.id, setStatuses);
    }

    // 트리 빌드
    const tree = buildTree(units, setStatusMap);

    // --- 요약 통계 계산 ---
    // 전체 세트 수
    const totalSets = examSets.length;

    // 응시한 세트 수 (완료된 세션이 있는 set_id 기준)
    const attemptedSetIds = new Set<string>();
    for (const session of relevantSessions) {
      if (!session.completed_at || !session.metadata) continue;
      const setId = (session.metadata as Record<string, unknown>)['set_id'] as string | undefined;
      if (setId) attemptedSetIds.add(setId);
    }
    const attemptedSets = attemptedSetIds.size;

    // 평균 점수 (완료된 세션의 accuracy_rate 평균)
    const completedSessions = relevantSessions.filter((s) => s.completed_at !== null && s.accuracy_rate !== null);
    const averageScore =
      completedSessions.length > 0
        ? Math.round(
            (completedSessions.reduce((sum, s) => sum + (s.accuracy_rate ?? 0), 0) /
              completedSessions.length) *
              10
          ) / 10
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        tree,
        summary: {
          totalSets,
          attemptedSets,
          averageScore,
        },
      },
    });
  } catch (error) {
    console.error('unit-exam tree GET 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
