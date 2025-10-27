import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const studentId = searchParams.get('studentId');
  const studyDate = searchParams.get('studyDate');

  if (!studentId || !studyDate) {
    return NextResponse.json({ error: 'studentId와 studyDate가 필요합니다.' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    // dailykor_learning_detail에서 데이터 가져오기
    const { data: detailData, error: detailError } = await supabase
      .from('dailykor_learning_detail')
      .select('*')
      .eq('student_id', studentId)
      .eq('study_date', studyDate)
      .single();

    if (detailError || !detailData) {
      return NextResponse.json({ data: null });
    }

    // passage 코드 추출 및 데이터 가져오기
    const passages = [];

    // passage 코드 추출 함수
    const extractPassageCode = (category: string): string | null => {
      if (!category) return null;
      // "비문학 > 과학            \tA000245" 형식에서 A000245 추출
      const match = category.match(/([A-Z]\d{6})$/);
      return match ? match[1] : null;
    };

    // passage1
    if (detailData.passage1_category) {
      const passageCode = extractPassageCode(detailData.passage1_category);
      
      if (passageCode) {
        const { data: passageData } = await supabase
          .from('dailykor_passages')
          .select('passage_code, title, original_content, ai_content')
          .eq('passage_code', passageCode)
          .single();

        if (passageData) {
          passages.push({
            code: passageData.passage_code,
            title: detailData.passage1_category.replace(/\s+/g, ' ').trim(),
            originalContent: passageData.original_content,
            aiContent: passageData.ai_content
          });
        }
      }
    }

    // passage2
    if (detailData.passage2_category) {
      const passageCode = extractPassageCode(detailData.passage2_category);
      
      if (passageCode) {
        const { data: passageData } = await supabase
          .from('dailykor_passages')
          .select('passage_code, title, original_content, ai_content')
          .eq('passage_code', passageCode)
          .single();

        if (passageData) {
          passages.push({
            code: passageData.passage_code,
            title: detailData.passage2_category.replace(/\s+/g, ' ').trim(),
            originalContent: passageData.original_content,
            aiContent: passageData.ai_content
          });
        }
      }
    }

    // passage3
    if (detailData.passage3_category) {
      const passageCode = extractPassageCode(detailData.passage3_category);
      
      if (passageCode) {
        const { data: passageData } = await supabase
          .from('dailykor_passages')
          .select('passage_code, title, original_content, ai_content')
          .eq('passage_code', passageCode)
          .single();

        if (passageData) {
          passages.push({
            code: passageData.passage_code,
            title: detailData.passage3_category.replace(/\s+/g, ' ').trim(),
            originalContent: passageData.original_content,
            aiContent: passageData.ai_content
          });
        }
      }
    }

    return NextResponse.json({ data: passages });
  } catch (error) {
    console.error('Error in learning detail API:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

