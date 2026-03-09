import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 학년 텍스트 → textbooks.grade(숫자) 매핑 테이블
const GRADE_MAP: Record<string, number> = {
  초1: 1, 초2: 2, 초3: 3, 초4: 4, 초5: 5, 초6: 6,
  중1: 7, 중2: 8, 중3: 9,
  고1: 10, 고2: 11, 고3: 12,
};

// textbooks.level + grade + semester로 라벨 생성
function buildTextbookLabel(publisher: string, level: string, grade: number, semester: number): string {
  // level(중등/고등) + grade(학년 내 순번)로 라벨 조합
  const levelPrefix: Record<string, string> = { '초등': '초', '중등': '중', '고등': '고' };
  const prefix = levelPrefix[level] ?? level;
  return `${publisher} ${prefix}${grade}-${semester}`;
}

// 학생별 교재 매핑 타입
interface TextbookEntry {
  textbook_id: string;
  label: string;
}

// 학생 응답 타입
interface StudentExamData {
  id: number;
  name: string;
  grade: string;
  textbooks: TextbookEntry[];
  sessionCount: number;   // 완료된 단원평가 세션 수
  averageScore: number;   // 완료 세션 평균 accuracy_rate
}

// 단원평가 학생 목록 + 교재 + 응시 통계 조회
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;

    const academyId = searchParams.get('academy_id');

    if (!academyId) {
      return NextResponse.json(
        { success: false, error: 'academy_id는 필수입니다.' },
        { status: 400 }
      );
    }

    // 쿼리1: 재원 학생 목록 조회
    const { data: students, error: studentsError } = await supabase
      .from('student')
      .select('id, name, school_id, school, grade')
      .eq('academy_id', academyId)
      .eq('status', '재원');

    if (studentsError) {
      console.error('학생 목록 조회 오류:', studentsError);
      return NextResponse.json(
        { success: false, error: '학생 목록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // school_id + grade 조합 수집 (교재 조회용)
    const schoolGradePairs = students
      .filter((s) => s.school_id !== null && s.grade !== null)
      .map((s) => ({ school_id: s.school_id as number, grade: s.grade as string }));

    // 중복 제거된 school_id 목록
    const uniqueSchoolIds = [...new Set(schoolGradePairs.map((p) => p.school_id))];

    const studentIds = students.map((s) => s.id);

    // 쿼리2 + 쿼리3 병렬 실행
    const [textbookResult, sessionResult] = await Promise.all([
      // 쿼리2: school_grade_textbook + textbooks JOIN으로 교재 목록 조회
      uniqueSchoolIds.length > 0
        ? supabase
            .from('school_grade_textbook')
            .select(`
              school_id,
              grade,
              textbook_id,
              textbooks:textbook_id (
                id,
                publisher,
                level,
                grade,
                semester
              )
            `)
            .in('school_id', uniqueSchoolIds)
        : Promise.resolve({ data: [], error: null }),

      // 쿼리3: 완료된 단원평가(unit_test) 세션 통계 집계
      // completed_at IS NOT NULL: 미완료 세션(점수 0)은 제외
      supabase
        .from('test_session')
        .select('student_id, accuracy_rate')
        .eq('test_type', 'unit_test')
        .not('completed_at', 'is', null)
        .in('student_id', studentIds),
    ]);

    if (textbookResult.error) {
      console.error('교재 목록 조회 오류:', textbookResult.error);
    }

    if (sessionResult.error) {
      console.error('단원평가 세션 통계 조회 오류:', sessionResult.error);
    }

    // 교재 데이터를 (school_id, grade) → TextbookEntry[] 맵으로 변환
    type TextbookRowTextbook = {
      id: string;
      publisher: string;
      level: string;
      grade: number;
      semester: number;
    };
    type TextbookRow = {
      school_id: number;
      grade: string;
      textbook_id: string;
      textbooks: TextbookRowTextbook | TextbookRowTextbook[] | null;
    };

    const textbookMap = new Map<string, TextbookEntry[]>();
    for (const row of ((textbookResult.data ?? []) as unknown as TextbookRow[])) {
      const key = `${row.school_id}__${row.grade}`;
      if (!textbookMap.has(key)) {
        textbookMap.set(key, []);
      }
      if (row.textbooks) {
        // Supabase 조인 결과가 단일 객체 또는 배열로 올 수 있음
        const tbList = Array.isArray(row.textbooks) ? row.textbooks : [row.textbooks];
        for (const tb of tbList) {
          textbookMap.get(key)!.push({
            textbook_id: row.textbook_id,
            label: buildTextbookLabel(tb.publisher, tb.level, tb.grade, tb.semester),
          });
        }
      }
    }

    // 단원평가 세션 통계를 student_id별로 집계
    // accuracy_rate를 직접 사용 (StudentApp이 이미 계산하여 저장)
    type SessionRow = {
      student_id: number;
      accuracy_rate: number | null;
    };

    const sessionStatsMap = new Map<
      number,
      { sessionCount: number; totalScore: number }
    >();

    for (const row of ((sessionResult.data ?? []) as SessionRow[])) {
      const existing = sessionStatsMap.get(row.student_id) ?? {
        sessionCount: 0,
        totalScore: 0,
      };
      sessionStatsMap.set(row.student_id, {
        sessionCount: existing.sessionCount + 1,
        totalScore: existing.totalScore + (row.accuracy_rate ?? 0),
      });
    }

    // 최종 응답 데이터 구성
    const data: StudentExamData[] = students.map((student) => {
      // 학생의 school_id + grade로 교재 조회
      let textbooks: TextbookEntry[] = [];
      if (student.school_id !== null && student.grade) {
        const key = `${student.school_id}__${student.grade}`;
        textbooks = textbookMap.get(key) ?? [];
      }

      const stats = sessionStatsMap.get(student.id) ?? {
        sessionCount: 0,
        totalScore: 0,
      };

      // 평균 점수 계산 (소수점 1자리)
      const averageScore =
        stats.sessionCount > 0
          ? Math.round((stats.totalScore / stats.sessionCount) * 10) / 10
          : 0;

      return {
        id: student.id,
        name: student.name ?? '',
        grade: student.grade ?? '',
        textbooks,
        sessionCount: stats.sessionCount,
        averageScore,
      };
    });

    // 이름 기준 정렬
    data.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('unit-exam GET 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
