import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 레벨별 라벨 매핑
const GRADE_LEVEL_LABELS: Record<string, string> = {
  'Lv1_Elem5': 'Lv1 초5',
  'Lv2_Elem6': 'Lv2 초6',
  'Lv3_Mid1': 'Lv3 중1',
  'Lv4_Mid2': 'Lv4 중2',
  'Lv5_Mid3': 'Lv5 중3',
  'Lv6_High1': 'Lv6 고1',
  'Lv7_High2': 'Lv7 고2',
  'Lv8_High3': 'Lv8 고3',
  'Lv9_CSAT': 'Lv9 수능'
};

// 레벨 정렬 순서
const GRADE_LEVEL_ORDER = [
  'Lv1_Elem5', 'Lv2_Elem6', 'Lv3_Mid1', 'Lv4_Mid2', 'Lv5_Mid3',
  'Lv6_High1', 'Lv7_High2', 'Lv8_High3', 'Lv9_CSAT'
];

// 문장클리닉 레벨별 통계 조회
export async function GET(): Promise<NextResponse> {
  try {
    // 전체 개수 조회
    const { count: totalCount, error: countError } = await supabase
      .from('short_passage')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('전체 개수 조회 오류:', countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // 레벨별 개수 조회 - SQL 직접 실행으로 그룹화
    const { data: groupedData, error: statsError } = await supabase
      .rpc('get_short_passage_stats');

    // RPC 함수가 없으면 직접 쿼리로 대체
    let levelCounts: Record<string, number> = {};

    if (statsError) {
      // RPC 함수가 없는 경우 전체 데이터를 페이지네이션으로 가져오기
      const pageSize = 1000;
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: pageData, error: pageError } = await supabase
          .from('short_passage')
          .select('grade_level')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (pageError) {
          console.error('레벨별 통계 조회 오류:', pageError);
          return NextResponse.json({ error: pageError.message }, { status: 500 });
        }

        if (!pageData || pageData.length === 0) {
          hasMore = false;
        } else {
          pageData.forEach((item) => {
            const level = item.grade_level || 'unknown';
            levelCounts[level] = (levelCounts[level] || 0) + 1;
          });

          if (pageData.length < pageSize) {
            hasMore = false;
          }
          page++;
        }
      }
    } else if (groupedData) {
      // RPC 결과 사용
      groupedData.forEach((item: { grade_level: string; count: number }) => {
        levelCounts[item.grade_level || 'unknown'] = item.count;
      });
    }

    // 정렬된 배열로 변환
    const levelStats = GRADE_LEVEL_ORDER.map((level) => ({
      level,
      label: GRADE_LEVEL_LABELS[level] || level,
      count: levelCounts[level] || 0
    }));

    // 알 수 없는 레벨이 있으면 추가
    if (levelCounts['unknown'] && levelCounts['unknown'] > 0) {
      levelStats.push({
        level: 'unknown',
        label: '미분류',
        count: levelCounts['unknown']
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        total: totalCount || 0,
        byLevel: levelStats
      }
    });
  } catch (error) {
    console.error('문장클리닉 통계 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
