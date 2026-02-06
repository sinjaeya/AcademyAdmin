import { AdminLayout } from '@/components/layout/AdminLayout';
import { LearningTableKorean } from '@/components/admin/LearningTableKorean';
import { getServerAcademyId, isServerUserAdmin } from '@/lib/auth/server-context';

async function getLearningData(year: number, month: number) {
  const { createServerClient } = await import('@/lib/supabase/server');
  const supabase = createServerClient();

  // 학원 데이터 격리
  const academyId = await getServerAcademyId();
  const isAdmin = await isServerUserAdmin();

  // 해당 월의 시작일과 종료일
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  // admin이 아니면 해당 학원 학생 ID 목록 조회
  let academyStudentIds: number[] | null = null;
  if (!isAdmin && academyId) {
    const { data: academyStudents } = await supabase
      .from('student')
      .select('id')
      .eq('academy_id', academyId);
    academyStudentIds = academyStudents?.map(s => Number(s.id)) || [];
    if (academyStudentIds.length === 0) return [];
  }

  // dailykor_learning_overview에서 데이터 가져오기
  let query = supabase
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
    .lte('study_date', endDate);

  if (academyStudentIds) {
    query = query.in('student_id', academyStudentIds);
  }

  const { data: learningData, error } = await query.order('study_date', { ascending: true });

  if (error) {
    console.error('Error fetching learning data:', error);
    return [];
  }

  // 학생 ID 목록 가져오기
  const studentIds = [...new Set(learningData?.map(r => r.student_id) || [])];

  // 학생 정보 가져오기
  let studentQuery = supabase
    .from('student')
    .select('id, name')
    .in('id', studentIds);

  if (academyStudentIds) {
    studentQuery = studentQuery.in('id', academyStudentIds);
  }

  const { data: studentsData } = await studentQuery;

  // 학생별로 데이터 그룹화
  const studentsMap = new Map();
  
  // 학생 정보 맵 생성
  const studentInfoMap = new Map();
  studentsData?.forEach(student => {
    studentInfoMap.set(student.id, student.name);
  });
  
  if (learningData) {
    for (const record of learningData) {
      const studentId = record.student_id;
      const studentName = studentInfoMap.get(studentId) || `학생 ${studentId}`;
      
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
  
  return Array.from(studentsMap.values());
}

export default async function LearningManagement() {
  // 현재 날짜로 초기 월 설정
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const students = await getLearningData(currentYear, currentMonth);
  
  return (
    <AdminLayout>
      <LearningTableKorean initialStudents={students} initialYear={currentYear} initialMonth={currentMonth} />
    </AdminLayout>
  );
}
