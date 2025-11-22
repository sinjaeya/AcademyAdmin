import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/teacher/passage-guide/[studentId]
 * 학생의 최근 학습한 지문 목록 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await context.params;
    const supabase = createServerClient();

    // dailykor_learning_detail에서 해당 학생의 최근 학습 데이터 가져오기
    const { data: learningDetails, error } = await supabase
      .from('dailykor_learning_detail')
      .select('*')
      .eq('student_id', studentId)
      .order('study_date', { ascending: false })
      .limit(100); // 최근 100개 레코드

    if (error) {
      console.error('Error fetching learning details:', error);
      return NextResponse.json(
        { error: '학습 데이터를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 지문 코드 추출 함수
    const extractPassageCode = (category: string | null): string | null => {
      if (!category) return null;
      // "비문학 > 과학            \tA000245" 형식에서 A000245 추출
      const match = category.match(/([A-Z]\d{6})$/);
      return match ? match[1] : null;
    };

    // 지문 코드 수집 (중복 제거)
    const passageCodes = new Set<string>();
    const passageList: Array<{
      code: string;
      category: string;
      studyDate: string;
      passageNumber: number;
    }> = [];

    if (learningDetails) {
      for (const detail of learningDetails) {
        // passage1
        if (detail.passage1_category) {
          const code = extractPassageCode(detail.passage1_category);
          if (code && !passageCodes.has(code)) {
            passageCodes.add(code);
            passageList.push({
              code,
              category: detail.passage1_category,
              studyDate: detail.study_date,
              passageNumber: 1
            });
          }
        }

        // passage2
        if (detail.passage2_category) {
          const code = extractPassageCode(detail.passage2_category);
          if (code && !passageCodes.has(code)) {
            passageCodes.add(code);
            passageList.push({
              code,
              category: detail.passage2_category,
              studyDate: detail.study_date,
              passageNumber: 2
            });
          }
        }

        // passage3
        if (detail.passage3_category) {
          const code = extractPassageCode(detail.passage3_category);
          if (code && !passageCodes.has(code)) {
            passageCodes.add(code);
            passageList.push({
              code,
              category: detail.passage3_category,
              studyDate: detail.study_date,
              passageNumber: 3
            });
          }
        }
      }
    }

    // 최근 학습일 기준으로 정렬
    passageList.sort((a, b) => {
      const dateA = new Date(a.studyDate);
      const dateB = new Date(b.studyDate);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ data: passageList });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

