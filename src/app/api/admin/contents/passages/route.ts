'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const DEFAULT_LIMIT = 20;
const STATUS_FILTERS = ['pending', 'reviewed', 'approved', 'rejected', 'length_overflow'] as const;

type StatusKey = (typeof STATUS_FILTERS)[number];

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;

    const limitParam = Number.parseInt(searchParams.get('limit') ?? '', 10);
    const offsetParam = Number.parseInt(searchParams.get('offset') ?? '', 10);
    const statusParam = (searchParams.get('status') ?? 'all') as 'all' | StatusKey;

    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : DEFAULT_LIMIT;
    const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

    let dataQuery = supabase
      .from('passage')
      .select(
        `
          code_id,
          rubric_grade_level,
          rubric_difficulty_level,
          keyword_list,
          content,
          qa_status,
          char_count,
          paragraph_count
        `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusParam !== 'all') {
      dataQuery = dataQuery.eq('qa_status', statusParam);
    }

    const [dataResult, countPairs] = await Promise.all([
      dataQuery,
      Promise.all(
        STATUS_FILTERS.map(async (status) => {
          const { count, error } = await supabase
            .from('passage')
            .select('qa_status', { head: true, count: 'exact' })
            .eq('qa_status', status);

          if (error) {
            console.error(`Failed to count passages for status ${status}:`, error);
            return [status, 0] as const;
          }

          return [status, count ?? 0] as const;
        })
      )
    ]);

    if (dataResult.error) {
      console.error('Failed to fetch passages:', dataResult.error);
      return NextResponse.json(
        { error: dataResult.error.message || '지문 목록을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const statusCounts = countPairs.reduce((acc, [status, count]) => {
      acc[status] = count;
      return acc;
    }, {} as Record<StatusKey, number>);

    return NextResponse.json({
      data: dataResult.data ?? [],
      count: dataResult.count ?? 0,
      limit,
      offset,
      status: statusParam,
      statusCounts
    });
  } catch (error) {
    console.error('Unexpected error while fetching passages:', error);
    return NextResponse.json(
      { error: '지문 목록을 가져오는 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

