'use client';

import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

// 단원 트리 노드 타입
interface UnitTreeNode {
  id: string;
  title: string;
  unit_code: string | null;
  depth: number;
  children: UnitTreeNode[];
}

interface UnitTreeCheckboxProps {
  textbookId: string;
  selectedIds: string[];       // 소단원(depth 1) ID 배열
  onChange: (ids: string[]) => void;
}

// 대단원의 체크 상태 계산 (checked / unchecked / indeterminate)
function getParentCheckState(
  children: UnitTreeNode[],
  selectedIds: Set<string>
): boolean | 'indeterminate' {
  if (children.length === 0) return false;
  const checkedCount = children.filter((c) => selectedIds.has(c.id)).length;
  if (checkedCount === 0) return false;
  if (checkedCount === children.length) return true;
  return 'indeterminate';
}

export function UnitTreeCheckbox({ textbookId, selectedIds, onChange }: UnitTreeCheckboxProps) {
  const [tree, setTree] = useState<UnitTreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  // textbookId 변경 시 단원 트리 재조회
  useEffect(() => {
    if (!textbookId) {
      setTree([]);
      return;
    }

    const fetchTree = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/exam-schedule/units?textbook_id=${textbookId}`);
        const result = await res.json();
        if (result.success) {
          setTree(result.data ?? []);
        } else {
          setTree([]);
        }
      } catch {
        setTree([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, [textbookId]);

  const selectedSet = new Set(selectedIds);

  // 소단원 개별 토글
  const handleChildToggle = (childId: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(childId);
    } else {
      next.delete(childId);
    }
    onChange([...next]);
  };

  // 대단원 클릭 시 하위 전체 토글
  const handleParentToggle = (parent: UnitTreeNode, checked: boolean) => {
    const next = new Set(selectedIds);
    for (const child of parent.children) {
      if (checked) {
        next.add(child.id);
      } else {
        next.delete(child.id);
      }
    }
    onChange([...next]);
  };

  // 전체 소단원 ID 목록 수집
  const getAllLeafIds = (): string[] => {
    const ids: string[] = [];
    for (const parent of tree) {
      for (const child of parent.children) {
        ids.push(child.id);
      }
    }
    return ids;
  };

  // 전체 선택
  const handleSelectAll = () => {
    onChange(getAllLeafIds());
  };

  // 전체 해제
  const handleDeselectAll = () => {
    onChange([]);
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-sm text-gray-400">단원 목록 불러오는 중...</div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-gray-400">
        교재를 선택하면 단원 목록이 표시됩니다.
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 bg-gray-50 space-y-1">
      {/* 전체 선택/해제 버튼 */}
      <div className="flex gap-2 mb-2 pb-2 border-b border-gray-200">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7 cursor-pointer"
          onClick={handleSelectAll}
        >
          전체 선택
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7 cursor-pointer"
          onClick={handleDeselectAll}
        >
          전체 해제
        </Button>
        <span className="text-xs text-gray-500 flex items-center ml-auto">
          {selectedIds.length}개 선택됨
        </span>
      </div>

      {/* 대단원 → 소단원 트리 렌더링 */}
      {tree.map((parent) => {
        const parentState = getParentCheckState(parent.children, selectedSet);

        return (
          <div key={parent.id}>
            {/* 대단원 (depth 0) — 3-state 체크박스 */}
            <div className="flex items-center gap-2 py-1" style={{ paddingLeft: '0px' }}>
              <Checkbox
                checked={parentState}
                onCheckedChange={(checked) =>
                  handleParentToggle(parent, checked === true)
                }
              />
              <span className="font-semibold text-sm text-gray-900">{parent.title}</span>
            </div>

            {/* 소단원 (depth 1) — 2-state 체크박스 */}
            {parent.children.map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-2 py-0.5"
                style={{ paddingLeft: '24px' }}
              >
                <Checkbox
                  checked={selectedSet.has(child.id)}
                  onCheckedChange={(checked) =>
                    handleChildToggle(child.id, checked === true)
                  }
                />
                <span className="text-sm text-gray-700">
                  {child.unit_code && (
                    <span className="text-xs text-gray-400 mr-1">{child.unit_code}</span>
                  )}
                  {child.title}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
