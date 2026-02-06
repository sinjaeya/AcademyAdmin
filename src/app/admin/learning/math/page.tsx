import { AdminLayout } from '@/components/layout/AdminLayout';
import { MathLearningTable } from '@/components/admin/MathLearningTable';
import { createServerClient } from '@/lib/supabase/server';
import { getServerAcademyId, isServerUserAdmin } from '@/lib/auth/server-context';

async function getMathLearningData(year: number, month: number) {
  const supabase = createServerClient();

  // 학원 데이터 격리
  const academyId = await getServerAcademyId();
  const isAdmin = await isServerUserAdmin();

  // 해당 월의 시작일과 종료일
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  // admin이 아니면 해당 학원 학생 이름 목록 조회
  let academyStudentNames: string[] | null = null;
  if (!isAdmin && academyId) {
    const { data: academyStudents } = await supabase
      .from('student')
      .select('name')
      .eq('academy_id', academyId);
    academyStudentNames = academyStudents?.map(s => s.name) || [];
    if (academyStudentNames.length === 0) return [];
  }

  // mathflat_worksheets에서 데이터 가져오기
  let query = supabase
    .from('mathflat_worksheets')
    .select('*')
    .gte('issued_date', startDate)
    .lte('issued_date', `${endDate}T23:59:59.999Z`);

  if (academyStudentNames) {
    query = query.in('student_name', academyStudentNames);
  }

  const { data: worksheetsData, error } = await query.order('issued_date', { ascending: true });

  if (error) {
    console.error('Error fetching math worksheets data:', error);
    return [];
  }

  // 학생 이름 목록 가져오기
  const studentNames = [...new Set(worksheetsData?.map(r => r.student_name) || [])];

  if (studentNames.length === 0) {
    return [];
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

  return Array.from(studentsMap.values());
}

export default async function MathLearningManagement() {
  // 현재 날짜로 초기 월 설정
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const students = await getMathLearningData(currentYear, currentMonth);
  
  return (
    <AdminLayout>
      <MathLearningTable initialStudents={students} initialYear={currentYear} initialMonth={currentMonth} />
    </AdminLayout>
  );
}

