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
  correctWords?: string[]; // 단어팡 맞은 단어들
  wrongWords?: string[]; // 단어팡 틀린 단어들
  // 문장클리닉 상세 정보
  sentenceClinicDetail?: {
    keyword: string;
    text: string; // 지문
    // 빈칸 문제
    clozeSummary: string;
    clozeOptions: string[];
    clozeAnswer: number;
    clozeSelectedAnswer: number | null;
    clozeIsCorrect: boolean | null;
    clozeExplanation: string;
    // 키워드 문제
    keywordQuestion: string;
    keywordOptions: string[];
    keywordAnswer: number;
    keywordSelectedAnswer: number | null;
    keywordIsCorrect: boolean | null;
    keywordExplanation: string;
  };
  // 보물찾기 상세 정보
  passageQuizDetails?: Array<{
    statement: string;
    oxType: string;
    isCorrect: boolean;
    answer: string;
  }>;
}

interface StudentWordCount {
  wordPangCount: number;
  wordPangCorrect: number;
  passageQuizCount: number;
  passageQuizCorrect: number;
}

// 학생별 누적 정답률 (오늘 이전)
interface StudentHistoricalAccuracy {
  wordPangTotal: number;
  wordPangCorrect: number;
  wordPangAccuracyRate: number | null; // 데이터 없으면 null
}

interface InitialData {
  records: LearningRecord[];
  wordCounts: Record<number, StudentWordCount>;
  historicalAccuracy: Record<number, StudentHistoricalAccuracy>;
}

async function getInitialData(): Promise<InitialData> {
  const { createServerClient } = await import('@/lib/supabase/server');
  const supabase = createServerClient();

  // 한국 시간(KST, UTC+9) 기준 오늘
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const now = new Date();

  // KST 기준 현재 날짜 계산
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  const kstYear = kstNow.getUTCFullYear();
  const kstMonth = kstNow.getUTCMonth();
  const kstDate = kstNow.getUTCDate();

  // KST 오늘 00:00:00을 UTC로 변환
  const startOfDay = new Date(Date.UTC(kstYear, kstMonth, kstDate, 0, 0, 0, 0) - KST_OFFSET_MS);
  // KST 오늘 23:59:59.999를 UTC로 변환
  const endOfDay = new Date(Date.UTC(kstYear, kstMonth, kstDate, 23, 59, 59, 999) - KST_OFFSET_MS);

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
    return { records: [], wordCounts: {}, historicalAccuracy: {} };
  }

  // test_result에서 오늘의 개별 문제 결과 가져오기
  const { data: testResultData, error: testResultError } = await supabase
    .from('test_result')
    .select(`
      id,
      student_id,
      test_type,
      is_correct,
      answered_at
    `)
    .in('test_type', ['word_pang', 'passage_quiz'])
    .gte('answered_at', startDate)
    .lte('answered_at', endDate);

  if (testResultError) {
    console.error('Error fetching test_result data:', testResultError);
  }

  // 학생별 개별 문제 수 계산
  const wordCounts: Record<number, StudentWordCount> = {};
  if (testResultData) {
    for (const result of testResultData) {
      const studentId = Number(result.student_id);
      if (!wordCounts[studentId]) {
        wordCounts[studentId] = {
          wordPangCount: 0,
          wordPangCorrect: 0,
          passageQuizCount: 0,
          passageQuizCorrect: 0
        };
      }

      if (result.test_type === 'word_pang') {
        wordCounts[studentId].wordPangCount += 1;
        if (result.is_correct) wordCounts[studentId].wordPangCorrect += 1;
      } else if (result.test_type === 'passage_quiz') {
        wordCounts[studentId].passageQuizCount += 1;
        if (result.is_correct) wordCounts[studentId].passageQuizCorrect += 1;
      }
    }
  }

  // short_passage_learning_history에서 오늘의 문장클리닉 데이터 가져오기 (short_passage 조인)
  const { data: sentenceClinicData, error: sentenceClinicError } = await supabase
    .from('short_passage_learning_history')
    .select(`
      id,
      student_id,
      started_at,
      completed_at,
      cloze_is_correct,
      keyword_is_correct,
      cloze_selected_answer,
      keyword_selected_answer,
      short_passage:short_passage_id (
        keyword,
        text,
        cloze_summary,
        cloze_option_1,
        cloze_option_2,
        cloze_option_3,
        cloze_option_4,
        cloze_answer,
        cloze_explanation,
        keyword_question,
        keyword_option_1,
        keyword_option_2,
        keyword_option_3,
        keyword_option_4,
        keyword_answer,
        keyword_explanation
      )
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

  // 단어팡 세션별 단어 정보 조회
  const sessionWordMap = new Map<number, { correctWords: string[]; wrongWords: string[] }>();
  if (testSessionData) {
    const wordPangSessionIds = testSessionData
      .filter(r => r.test_type === 'word_pang')
      .map(r => r.id);

    if (wordPangSessionIds.length > 0) {
      // 1. test_result에서 세션별 문제 결과 가져오기
      const { data: wordResultData } = await supabase
        .from('test_result')
        .select('session_id, item_id, is_correct')
        .eq('test_type', 'word_pang')
        .in('session_id', wordPangSessionIds);

      if (wordResultData && wordResultData.length > 0) {
        // 2. 단어 ID 목록 추출
        const itemIds = [...new Set(wordResultData.map(r => r.item_id))];

        // 3. 단어 정보 가져오기
        const { data: wordData } = await supabase
          .from('word_pang_valid_words')
          .select('voca_id, word')
          .in('voca_id', itemIds);

        // 4. 단어 ID -> 단어 맵 생성
        const wordMap = new Map<number, string>();
        wordData?.forEach(w => wordMap.set(Number(w.voca_id), w.word));

        // 5. 세션별 맞은/틀린 단어 분류
        for (const result of wordResultData) {
          const sessionId = Number(result.session_id);
          const word = wordMap.get(Number(result.item_id)) || '';

          if (!sessionWordMap.has(sessionId)) {
            sessionWordMap.set(sessionId, { correctWords: [], wrongWords: [] });
          }

          const sessionData = sessionWordMap.get(sessionId)!;
          if (result.is_correct) {
            sessionData.correctWords.push(word);
          } else {
            sessionData.wrongWords.push(word);
          }
        }
      }
    }
  }

  // 보물찾기 세션별 O/X 문제 상세 정보 조회
  const sessionPassageQuizMap = new Map<number, Array<{ statement: string; oxType: string; isCorrect: boolean; answer: string }>>();
  if (testSessionData) {
    const passageQuizSessionIds = testSessionData
      .filter(r => r.test_type === 'passage_quiz')
      .map(r => r.id);

    if (passageQuizSessionIds.length > 0) {
      // test_result에서 세션별 문제 결과 가져오기
      const { data: quizResultData } = await supabase
        .from('test_result')
        .select('session_id, item_uuid, is_correct')
        .eq('test_type', 'passage_quiz')
        .in('session_id', passageQuizSessionIds)
        .not('item_uuid', 'is', null);

      if (quizResultData && quizResultData.length > 0) {
        // UUID 목록 추출
        const itemUuids = [...new Set(quizResultData.map(r => r.item_uuid).filter(Boolean))];

        // passage_quiz_ox에서 문제 정보 가져오기
        const { data: oxData } = await supabase
          .from('passage_quiz_ox')
          .select('quiz_id, statement, ox_type, answer')
          .in('quiz_id', itemUuids);

        // quiz_id -> 문제 정보 맵 생성
        const oxMap = new Map<string, { statement: string; oxType: string; answer: string }>();
        oxData?.forEach(ox => oxMap.set(ox.quiz_id, {
          statement: ox.statement,
          oxType: ox.ox_type,
          answer: ox.answer
        }));

        // 세션별 문제 상세 정보 분류
        for (const result of quizResultData) {
          const sessionId = Number(result.session_id);
          const oxInfo = oxMap.get(result.item_uuid);

          if (!sessionPassageQuizMap.has(sessionId)) {
            sessionPassageQuizMap.set(sessionId, []);
          }

          if (oxInfo) {
            sessionPassageQuizMap.get(sessionId)!.push({
              statement: oxInfo.statement,
              oxType: oxInfo.oxType,
              isCorrect: result.is_correct,
              answer: oxInfo.answer
            });
          }
        }
      }
    }
  }

  // 결과 데이터 생성
  const records: LearningRecord[] = [];

  // test_session 데이터 변환
  if (testSessionData) {
    for (const record of testSessionData) {
      const studentId = Number(record.student_id);
      const studentName = studentInfoMap.get(studentId) || `학생 ${studentId}`;

      // 단어팡인 경우 단어 정보 추가
      const wordData = record.test_type === 'word_pang'
        ? sessionWordMap.get(Number(record.id))
        : undefined;

      // 보물찾기인 경우 O/X 문제 상세 정보 추가
      const passageQuizDetails = record.test_type === 'passage_quiz'
        ? sessionPassageQuizMap.get(Number(record.id))
        : undefined;

      records.push({
        id: `ts_${record.id}`,
        studentId,
        studentName,
        learningType: record.test_type as 'word_pang' | 'passage_quiz',
        startedAt: record.started_at,
        completedAt: record.completed_at,
        totalItems: record.total_items || 0,
        correctCount: record.correct_count || 0,
        accuracyRate: record.accuracy_rate || 0,
        correctWords: wordData?.correctWords,
        wrongWords: wordData?.wrongWords,
        passageQuizDetails
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

      // short_passage에서 상세 정보 추출
      const shortPassage = record.short_passage as unknown as {
        keyword: string;
        text: string;
        cloze_summary: string;
        cloze_option_1: string;
        cloze_option_2: string;
        cloze_option_3: string;
        cloze_option_4: string;
        cloze_answer: number;
        cloze_explanation: string;
        keyword_question: string;
        keyword_option_1: string;
        keyword_option_2: string;
        keyword_option_3: string;
        keyword_option_4: string;
        keyword_answer: number;
        keyword_explanation: string;
      } | null;

      records.push({
        id: `sc_${record.id}`,
        studentId,
        studentName,
        learningType: 'sentence_clinic',
        startedAt: record.started_at,
        completedAt: record.completed_at,
        totalItems: 2,
        correctCount,
        accuracyRate,
        sentenceClinicDetail: {
          keyword: shortPassage?.keyword || '',
          text: shortPassage?.text || '',
          clozeSummary: shortPassage?.cloze_summary || '',
          clozeOptions: [
            shortPassage?.cloze_option_1 || '',
            shortPassage?.cloze_option_2 || '',
            shortPassage?.cloze_option_3 || '',
            shortPassage?.cloze_option_4 || ''
          ],
          clozeAnswer: shortPassage?.cloze_answer ?? 0,
          clozeSelectedAnswer: record.cloze_selected_answer ?? null,
          clozeIsCorrect: record.cloze_is_correct,
          clozeExplanation: shortPassage?.cloze_explanation || '',
          keywordQuestion: shortPassage?.keyword_question || '',
          keywordOptions: [
            shortPassage?.keyword_option_1 || '',
            shortPassage?.keyword_option_2 || '',
            shortPassage?.keyword_option_3 || '',
            shortPassage?.keyword_option_4 || ''
          ],
          keywordAnswer: shortPassage?.keyword_answer ?? 0,
          keywordSelectedAnswer: record.keyword_selected_answer ?? null,
          keywordIsCorrect: record.keyword_is_correct,
          keywordExplanation: shortPassage?.keyword_explanation || ''
        }
      });
    }
  }

  // 시작 시간 기준 내림차순 정렬
  records.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  // 오늘 학습한 학생들의 오늘 이전 누적 정답률 조회
  const historicalAccuracy: Record<number, StudentHistoricalAccuracy> = {};

  if (studentIds.length > 0) {
    // 오늘 이전의 단어팡 결과 가져오기
    const { data: historicalData, error: historicalError } = await supabase
      .from('test_result')
      .select('student_id, is_correct')
      .eq('test_type', 'word_pang')
      .in('student_id', studentIds)
      .lt('answered_at', startDate); // 오늘 이전 데이터만

    if (historicalError) {
      console.error('Error fetching historical data:', historicalError);
    } else if (historicalData) {
      // 학생별로 집계
      for (const result of historicalData) {
        const studentId = Number(result.student_id);
        if (!historicalAccuracy[studentId]) {
          historicalAccuracy[studentId] = {
            wordPangTotal: 0,
            wordPangCorrect: 0,
            wordPangAccuracyRate: null
          };
        }
        historicalAccuracy[studentId].wordPangTotal += 1;
        if (result.is_correct) {
          historicalAccuracy[studentId].wordPangCorrect += 1;
        }
      }

      // 정답률 계산
      for (const studentId of Object.keys(historicalAccuracy)) {
        const data = historicalAccuracy[Number(studentId)];
        if (data.wordPangTotal > 0) {
          data.wordPangAccuracyRate = (data.wordPangCorrect / data.wordPangTotal) * 100;
        }
      }
    }
  }

  return { records, wordCounts, historicalAccuracy };
}

export default async function RealtimeKoreanLearning() {
  const { records, wordCounts, historicalAccuracy } = await getInitialData();

  return (
    <AdminLayout>
      <RealtimeLearningTable
        initialData={records}
        initialWordCounts={wordCounts}
        initialHistoricalAccuracy={historicalAccuracy}
      />
    </AdminLayout>
  );
}
