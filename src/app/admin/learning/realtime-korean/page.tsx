import { AdminLayout } from '@/components/layout/AdminLayout';
import { RealtimeLearningTable } from '@/components/admin/RealtimeLearningTable';

interface LearningRecord {
  id: string;
  studentId: number;
  studentName: string;
  learningType: 'word_pang' | 'passage_quiz' | 'sentence_clinic';
  startedAt: string;
  completedAt: string | null;
  totalItems: number;
  correctCount: number;
  accuracyRate: number;
}

async function getInitialData(): Promise<LearningRecord[]> {
  const { createServerClient } = await import('@/lib/supabase/server');
  const supabase = createServerClient();

  // 오늘 날짜 (UTC 기준)
  const today = new Date();
  const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));

  const startDate = startOfDay.toISOString();
  const endDate = endOfDay.toISOString();

  // test_session에서 오늘의 단어팡, 보물찾기 데이터 가져오기
  const { data: testSessionData, error: testSessionError } = await supabase
    .from('test_session')
    .select(`
      id,
      student_id,
      test_type,
      started_at,
      completed_at,
      total_items,
      correct_count,
      accuracy_rate
    `)
    .in('test_type', ['word_pang', 'passage_quiz'])
    .gte('started_at', startDate)
    .lte('started_at', endDate)
    .order('started_at', { ascending: false });

  if (testSessionError) {
    console.error('Error fetching test_session data:', testSessionError);
    return [];
  }

  // short_passage_learning_history에서 오늘의 문장클리닉 데이터 가져오기
  const { data: sentenceClinicData, error: sentenceClinicError } = await supabase
    .from('short_passage_learning_history')
    .select(`
      id,
      student_id,
      started_at,
      completed_at,
      cloze_is_correct,
      keyword_is_correct
    `)
    .gte('started_at', startDate)
    .lte('started_at', endDate)
    .order('started_at', { ascending: false });

  if (sentenceClinicError) {
    console.error('Error fetching sentence clinic data:', sentenceClinicError);
  }

  // 학생 ID 목록 수집
  const testSessionStudentIds = testSessionData?.map(r => r.student_id) || [];
  const sentenceClinicStudentIds = sentenceClinicData?.map(r => r.student_id) || [];
  const studentIds = [...new Set([...testSessionStudentIds, ...sentenceClinicStudentIds])];

  // 학생 정보 가져오기
  const studentInfoMap = new Map<number, string>();
  if (studentIds.length > 0) {
    const { data: studentsData } = await supabase
      .from('student')
      .select('id, name')
      .in('id', studentIds);

    studentsData?.forEach((student: { id: number; name: string }) => {
      studentInfoMap.set(Number(student.id), student.name);
    });
  }

  // 결과 데이터 생성
  const records: LearningRecord[] = [];

  // test_session 데이터 변환
  if (testSessionData) {
    for (const record of testSessionData) {
      const studentId = Number(record.student_id);
      const studentName = studentInfoMap.get(studentId) || `학생 ${studentId}`;

      records.push({
        id: `ts_${record.id}`,
        studentId,
        studentName,
        learningType: record.test_type as 'word_pang' | 'passage_quiz',
        startedAt: record.started_at,
        completedAt: record.completed_at,
        totalItems: record.total_items || 0,
        correctCount: record.correct_count || 0,
        accuracyRate: record.accuracy_rate || 0
      });
    }
  }

  // sentence_clinic 데이터 변환
  if (sentenceClinicData) {
    for (const record of sentenceClinicData) {
      const studentId = Number(record.student_id);
      const studentName = studentInfoMap.get(studentId) || `학생 ${studentId}`;

      const clozeCorrect = record.cloze_is_correct ? 1 : 0;
      const keywordCorrect = record.keyword_is_correct ? 1 : 0;
      const correctCount = clozeCorrect + keywordCorrect;
      const accuracyRate = (correctCount / 2) * 100;

      records.push({
        id: `sc_${record.id}`,
        studentId,
        studentName,
        learningType: 'sentence_clinic',
        startedAt: record.started_at,
        completedAt: record.completed_at,
        totalItems: 2,
        correctCount,
        accuracyRate
      });
    }
  }

  // 시작 시간 기준 내림차순 정렬
  records.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return records;
}

export default async function RealtimeKoreanLearning() {
  const initialData = await getInitialData();

  return (
    <AdminLayout>
      <RealtimeLearningTable initialData={initialData} />
    </AdminLayout>
  );
}
