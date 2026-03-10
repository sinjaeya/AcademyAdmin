import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 단원 트리 노드 타입
export interface UnitTreeNode {
  id: string;
  title: string;
  unit_code: string | null;
  depth: number;
  children: UnitTreeNode[];
}

// DB에서 조회한 raw 노드 타입
interface RawUnitNode {
  id: string;
  parent_id: string | null;
  sort_order: number;
  unit_code: string | null;
  title: string;
  depth: number;
}

// 내부 트리 빌드용 노드 (sort_order 포함)
interface InternalNode extends UnitTreeNode {
  sort_order: number;
  parent_id: string | null;
}

// flat 배열 → 재귀 트리 빌드 (depth 0, 1만)
function buildTree(nodes: RawUnitNode[]): UnitTreeNode[] {
  const nodeMap = new Map<string, InternalNode>();

  // 모든 노드를 Map에 등록
  for (const node of nodes) {
    nodeMap.set(node.id, {
      id: node.id,
      title: node.title,
      unit_code: node.unit_code,
      depth: node.depth,
      sort_order: node.sort_order,
      parent_id: node.parent_id,
      children: [],
    });
  }

  const roots: InternalNode[] = [];

  // parent_id 기준으로 children 배열에 삽입
  for (const node of nodeMap.values()) {
    if (node.parent_id === null || node.depth === 0) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // 부모가 없으면 루트로 처리
        roots.push(node);
      }
    }
  }

  // sort_order 기준 정렬 (재귀)
  function sortChildren(treeNodes: InternalNode[]): void {
    treeNodes.sort((a, b) => a.sort_order - b.sort_order);
    for (const n of treeNodes) {
      sortChildren(n.children as InternalNode[]);
    }
  }
  sortChildren(roots);

  return roots;
}

// 교재별 단원 트리 조회 (depth 0, 1만)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServerClient();
    const textbookId = request.nextUrl.searchParams.get('textbook_id');

    if (!textbookId) {
      return NextResponse.json(
        { success: false, error: 'textbook_id는 필수입니다.' },
        { status: 400 }
      );
    }

    // depth 0(대단원), 1(소단원)만 조회
    const { data, error } = await supabase
      .from('textbook_units')
      .select('id, parent_id, sort_order, unit_code, title, depth')
      .eq('textbook_id', textbookId)
      .in('depth', [0, 1])
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('textbook_units 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '단원 목록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const units = (data ?? []) as RawUnitNode[];
    const tree = buildTree(units);

    return NextResponse.json({ success: true, data: tree });
  } catch (error) {
    console.error('exam-schedule/units GET 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
