import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const searchParams = request.nextUrl.searchParams;

        const pageParam = Number(searchParams.get('page') ?? '1');
        const limitParam = Number(searchParams.get('limit') ?? '20');
        // 필터 파라미터 추출
        const levelFilter = searchParams.get('level');
        const gradeFilter = searchParams.get('grade');

        const page = pageParam > 0 ? pageParam : 1;
        const limit = limitParam > 0 ? limitParam : 20;
        const offset = (page - 1) * limit;

        // 쿼리 빌더 시작
        let query = supabase
            .from('rag_files')
            .select('*', { count: 'exact' });

        // 레벨 필터 적용
        if (levelFilter) {
            query = query.eq('level', levelFilter);
        }

        // 학년 필터 적용
        if (gradeFilter) {
            query = query.eq('grade', Number(gradeFilter));
        }

        // 정렬 및 페이징 적용
        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Failed to fetch rag_files:', error);
            return NextResponse.json(
                { error: 'RAG 파일 목록을 가져오는 중 오류가 발생했습니다.' },
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
        console.error('Unexpected error while fetching rag_files:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
