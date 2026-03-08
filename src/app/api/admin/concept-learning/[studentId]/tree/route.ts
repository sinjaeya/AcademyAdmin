import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 트리 노드 타입 (재귀)
interface TreeNode {
  id: string;
  parent_id: string | null;
  sort_order: number;
  unit_code: string | null;
  title: string;
  depth: number;
  is_quizzable: boolean;
  leitner_box: number | null; // null=미학습, 1~4
  total_reviews: number;
  correct_reviews: number;
  children: TreeNode[];
}

// DB에서 조회한 단위 노드 raw 타입
interface RawUnitNode {
  id: string;
  parent_id: string | null;
  sort_order: number;
  unit_code: string | null;
  title: string;
  depth: number;
  is_quizzable: boolean;
  node_type: string | null;
}

// DB에서 조회한 Leitner 상태 raw 타입
interface RawLeitnerRow {
  unit_id: string;
  box_level: number;
  total_reviews: number;
  correct_reviews: number;
}

// flat 배열 → 재귀 트리 빌드
function buildTree(nodes: RawUnitNode[], leitnerMap: Map<string, RawLeitnerRow>): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();

  // 모든 노드를 TreeNode로 변환하여 Map에 등록
  for (const node of nodes) {
    const leitner = leitnerMap.get(node.id) ?? null;
    nodeMap.set(node.id, {
      id: node.id,
      parent_id: node.parent_id,
      sort_order: node.sort_order,
      unit_code: node.unit_code,
      title: node.title,
      depth: node.depth,
      is_quizzable: node.is_quizzable,
      leitner_box: leitner?.box_level ?? null,
      total_reviews: leitner?.total_reviews ?? 0,
      correct_reviews: leitner?.correct_reviews ?? 0,
      children: [],
    });
  }

  const roots: TreeNode[] = [];

  // parent_id 기준으로 children 배열에 삽입
  for (const node of nodeMap.values()) {
    if (node.parent_id === null) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  // sort_order 기준 정렬 (재귀)
  function sortChildren(treeNodes: TreeNode[]): void {
    treeNodes.sort((a, b) => a.sort_order - b.sort_order);
    for (const n of treeNodes) {
      sortChildren(n.children);
    }
  }
  sortChildren(roots);

  return roots;
}

// 개념트리 + Leitner 상태 조회
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

    // 쿼리1 + 쿼리2 병렬 실행
    const [unitsResult, leitnerResult] = await Promise.all([
      // 쿼리1: textbook_units 전체 노드 조회
      supabase
        .from('textbook_units')
        .select('id, parent_id, sort_order, unit_code, title, depth, is_quizzable, node_type')
        .eq('textbook_id', textbookId)
        .order('sort_order', { ascending: true }),

      // 쿼리2: student_concept_leitner 상태 조회 (서브쿼리 대신 textbook_id 필터 후 JS에서 교차)
      supabase
        .from('student_concept_leitner')
        .select('unit_id, box_level, total_reviews, correct_reviews')
        .eq('student_id', studentIdNum),
    ]);

    if (unitsResult.error) {
      console.error('textbook_units 조회 오류:', unitsResult.error);
      return NextResponse.json(
        { success: false, error: '개념트리 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (leitnerResult.error) {
      console.error('student_concept_leitner 조회 오류:', leitnerResult.error);
      return NextResponse.json(
        { success: false, error: 'Leitner 상태 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const units = (unitsResult.data ?? []) as RawUnitNode[];
    const leitnerRows = (leitnerResult.data ?? []) as RawLeitnerRow[];

    // 해당 textbook의 unit id 집합 생성
    const unitIdSet = new Set(units.map((u) => u.id));

    // Leitner 데이터를 unit_id → row 맵으로 변환 (이 교재 단원만 필터)
    const leitnerMap = new Map<string, RawLeitnerRow>();
    for (const row of leitnerRows) {
      if (unitIdSet.has(row.unit_id)) {
        leitnerMap.set(row.unit_id, row);
      }
    }

    // 트리 빌드
    const tree = buildTree(units, leitnerMap);

    // 통계 계산
    const quizzableUnits = units.filter((u) => u.is_quizzable);
    const totalConcepts = quizzableUnits.length;
    const learnedConcepts = quizzableUnits.filter((u) => leitnerMap.has(u.id)).length;

    const totalReviews = leitnerRows
      .filter((r) => unitIdSet.has(r.unit_id))
      .reduce((sum, r) => sum + (r.total_reviews ?? 0), 0);
    const totalCorrect = leitnerRows
      .filter((r) => unitIdSet.has(r.unit_id))
      .reduce((sum, r) => sum + (r.correct_reviews ?? 0), 0);

    const averageScore =
      totalReviews > 0
        ? Math.round((totalCorrect / totalReviews) * 1000) / 10
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        tree,
        stats: {
          totalConcepts,
          learnedConcepts,
          averageScore,
        },
      },
    });
  } catch (error) {
    console.error('concept-learning tree GET 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
