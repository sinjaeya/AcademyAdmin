import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const searchParams = request.nextUrl.searchParams;

        const pageParam = Number(searchParams.get('page') ?? '1');
        const limitParam = Number(searchParams.get('limit') ?? '20');

        const page = pageParam > 0 ? pageParam : 1;
        const limit = limitParam > 0 ? limitParam : 20;
        const offset = (page - 1) * limit;

        const { data, count, error } = await supabase
            .from('rag_sync_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Failed to fetch rag_sync_logs:', error);
            return NextResponse.json(
                { error: 'RAG 동기화 로그를 가져오는 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data: data ?? [],
            count: count ?? 0,
            page,
            limit,
            totalPages: Math.ceil((count ?? 0) / limit)
        });
    } catch (error) {
        console.error('Unexpected error while fetching rag_sync_logs:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
