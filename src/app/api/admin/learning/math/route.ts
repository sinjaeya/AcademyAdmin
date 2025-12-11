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

    // mathflat_worksheets에서 데이터 가져오기
    const { data: worksheetsData, error } = await supabase
      .from('mathflat_worksheets')
      .select('*')
      .gte('issued_date', startDate)
      .lte('issued_date', `${endDate}T23:59:59.999Z`)
      .order('issued_date', { ascending: true });

    if (error) {
      console.error('Error fetching math worksheets data:', error);
      return NextResponse.json({ error: '데이터를 가져오는데 실패했습니다.' }, { status: 500 });
    }

    // 학생 이름 목록 가져오기
    const studentNames = [...new Set(worksheetsData?.map(r => r.student_name) || [])];

    if (studentNames.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 학생별로 데이터 그룹화
    const studentsMap = new Map<string, any>();

    if (worksheetsData) {
      for (const record of worksheetsData) {
        const studentName = record.student_name;

        if (!studentsMap.has(studentName)) {
          studentsMap.set(studentName, {
            id: studentName,
            name: studentName,
            dailyWorksheets: {}
          });
        }

        // 날짜 추출
        const issuedDate = new Date(record.issued_date);
        const day = issuedDate.getDate();
        
        // 선택된 월과 같은 월인지 확인
        const recordYear = issuedDate.getFullYear();
        const recordMonth = issuedDate.getMonth() + 1;
        
        if (recordYear === year && recordMonth === month) {
          const student = studentsMap.get(studentName);

          // 날짜별 학습지 초기화
          if (!student.dailyWorksheets[day]) {
            student.dailyWorksheets[day] = {
              count: 0,
              worksheets: []
            };
          }

          // 학습지 추가
          student.dailyWorksheets[day].count += 1;
          student.dailyWorksheets[day].worksheets.push({
            id: record.id,
            worksheet_name: record.worksheet_name,
            score: record.score,
            grade: record.grade,
            issued_date: record.issued_date
          });
        }
      }
    }

    return NextResponse.json({ data: Array.from(studentsMap.values()) });
  } catch (error) {
    console.error('Error in math learning API:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}







