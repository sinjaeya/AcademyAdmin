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

    // test_session에서 데이터 가져오기 (word_pang, passage_quiz만)
    const { data: learningData, error } = await supabase
      .from('test_session')
      .select(`
        student_id,
        test_type,
        started_at,
        accuracy_rate
      `)
      .in('test_type', ['word_pang', 'passage_quiz'])
      .gte('started_at', `${startDate}T00:00:00.000Z`)
      .lte('started_at', `${endDate}T23:59:59.999Z`)
      .order('started_at', { ascending: true });

    if (error) {
      console.error('Error fetching learning data:', error);
      return NextResponse.json({ error: '데이터를 가져오는데 실패했습니다.' }, { status: 500 });
    }

    // short_passage_learning_history에서 문장클리닉 데이터 가져오기
    const { data: sentenceClinicData, error: sentenceClinicError } = await supabase
      .from('short_passage_learning_history')
      .select(`
        student_id,
        started_at,
        cloze_is_correct,
        keyword_is_correct
      `)
      .gte('started_at', `${startDate}T00:00:00.000Z`)
      .lte('started_at', `${endDate}T23:59:59.999Z`)
      .order('started_at', { ascending: true });

    if (sentenceClinicError) {
      console.error('Error fetching sentence clinic data:', sentenceClinicError);
    }

    // 학생 ID 목록 가져오기 (test_session + short_passage_learning_history)
    const testSessionStudentIds = learningData?.map(r => r.student_id) || [];
    const sentenceClinicStudentIds = sentenceClinicData?.map(r => r.student_id) || [];
    const studentIds = [...new Set([...testSessionStudentIds, ...sentenceClinicStudentIds])];

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

    // 학생 정보 맵 생성 (숫자로 통일)
    const studentInfoMap = new Map();
    studentsData?.forEach((student: any) => {
      // student.id를 숫자로 변환하여 저장
      const studentIdNum = Number(student.id);
      studentInfoMap.set(studentIdNum, student.name);
    });

    if (learningData) {
      for (const record of learningData) {
        // student_id를 숫자로 통일
        const studentIdNum = Number(record.student_id);
        const studentId = String(studentIdNum);
        const studentName = studentInfoMap.get(studentIdNum) || `학생 ${studentId}`;

        if (!studentsMap.has(studentId)) {
          studentsMap.set(studentId, {
            id: studentId,
            name: studentName,
            dailyActivities: {}
          });
        }

        // 날짜 추출 (UTC 기준으로 안전하게 처리)
        const testDate = new Date(record.started_at);
        // UTC 기준으로 날짜 추출 (년, 월, 일)
        const utcYear = testDate.getUTCFullYear();
        const utcMonth = testDate.getUTCMonth() + 1;
        const utcDay = testDate.getUTCDate();
        
        // 선택된 월과 같은 월인지 확인
        if (utcYear === year && utcMonth === month) {
          const student = studentsMap.get(studentId);

          // 날짜별 활동 초기화
          if (!student.dailyActivities[utcDay]) {
            student.dailyActivities[utcDay] = {
              wordPang: { count: 0, accuracySum: 0 },
              passageQuiz: { count: 0, accuracySum: 0 },
              sentenceClinic: { count: 0, correctCount: 0, totalCount: 0 }
            };
          }

          // test_type에 따라 카운트 및 정답률 누적
          const accuracy = record.accuracy_rate || 0;
          if (record.test_type === 'word_pang') {
            student.dailyActivities[utcDay].wordPang.count += 1;
            student.dailyActivities[utcDay].wordPang.accuracySum += accuracy;
          } else if (record.test_type === 'passage_quiz') {
            student.dailyActivities[utcDay].passageQuiz.count += 1;
            student.dailyActivities[utcDay].passageQuiz.accuracySum += accuracy;
          }
        }
      }
    }

    // 문장클리닉 데이터 처리
    if (sentenceClinicData) {
      for (const record of sentenceClinicData) {
        const studentIdNum = Number(record.student_id);
        const studentId = String(studentIdNum);
        const studentName = studentInfoMap.get(studentIdNum) || `학생 ${studentId}`;

        if (!studentsMap.has(studentId)) {
          studentsMap.set(studentId, {
            id: studentId,
            name: studentName,
            dailyActivities: {}
          });
        }

        const testDate = new Date(record.started_at);
        const utcYear = testDate.getUTCFullYear();
        const utcMonth = testDate.getUTCMonth() + 1;
        const utcDay = testDate.getUTCDate();

        if (utcYear === year && utcMonth === month) {
          const student = studentsMap.get(studentId);

          if (!student.dailyActivities[utcDay]) {
            student.dailyActivities[utcDay] = {
              wordPang: { count: 0, accuracySum: 0 },
              passageQuiz: { count: 0, accuracySum: 0 },
              sentenceClinic: { count: 0, correctCount: 0, totalCount: 0 }
            };
          }

          // 문장클리닉: cloze_is_correct + keyword_is_correct 로 정답률 계산
          const clozeCorrect = record.cloze_is_correct ? 1 : 0;
          const keywordCorrect = record.keyword_is_correct ? 1 : 0;
          student.dailyActivities[utcDay].sentenceClinic.count += 1;
          student.dailyActivities[utcDay].sentenceClinic.correctCount += clozeCorrect + keywordCorrect;
          student.dailyActivities[utcDay].sentenceClinic.totalCount += 2; // 각 학습당 2문제
        }
      }
    }

    return NextResponse.json({ data: Array.from(studentsMap.values()) });
  } catch (error) {
    console.error('Error in learning API:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

