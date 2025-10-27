import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = parseInt(searchParams.get('year') || '2025');
  const month = parseInt(searchParams.get('month') || '1');

  try {
    const supabase = createServerClient();

    // 해당 월의 시작일과 종료일
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // dailykor_learning_overview에서 데이터 가져오기
    const { data: learningData, error } = await supabase
      .from('dailykor_learning_overview')
      .select(`
        id,
        student_id,
        study_date,
        total_xp,
        max_xp,
        score_display
      `)
      .gte('study_date', startDate)
      .lte('study_date', endDate)
      .order('study_date', { ascending: true });

    if (error) {
      console.error('Error fetching learning data:', error);
      return NextResponse.json({ error: '데이터를 가져오는데 실패했습니다.' }, { status: 500 });
    }

    // 학생 ID 목록 가져오기
    const studentIds = [...new Set(learningData?.map(r => r.student_id) || [])];

    if (studentIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 학생 정보 가져오기
    const { data: studentsData } = await supabase
      .from('student')
      .select('id, name')
      .in('id', studentIds);

    // 학생별로 데이터 그룹화
    const studentsMap = new Map<string, any>();

    // 학생 정보 맵 생성
    const studentInfoMap = new Map();
    studentsData?.forEach((student: any) => {
      studentInfoMap.set(student.id, student.name);
    });

    if (learningData) {
      for (const record of learningData) {
        const studentId = String(record.student_id);
        const studentName = studentInfoMap.get(record.student_id) || `학생 ${studentId}`;

        if (!studentsMap.has(studentId)) {
          studentsMap.set(studentId, {
            id: studentId,
            name: studentName,
            dailyActivities: {}
          });
        }

        const studyDate = new Date(record.study_date).getDate();
        const student = studentsMap.get(studentId);

        student.dailyActivities[studyDate] = {
          totalXp: record.total_xp,
          maxXp: record.max_xp,
          scoreDisplay: record.score_display || '',
        };
      }
    }

    return NextResponse.json({ data: Array.from(studentsMap.values()) });
  } catch (error) {
    console.error('Error in learning API:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

