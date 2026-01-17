import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface LearningRecord {
  id: string;
  studentId: number;
  studentName: string;
  learningType: 'word_pang' | 'passage_quiz' | 'sentence_clinic' | 'handwriting';
  startedAt: string;
  completedAt: string | null;
  totalItems: number;
  correctCount: number;
  accuracyRate: number;
  correctWords?: string[];
  wrongWords?: string[];
  // 순서 유지된 단어 결과 (created_at 기준 정렬)
  wordResults?: Array<{ word: string; isCorrect: boolean }>;
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
  // 내손내줄 상세 정보
  handwritingDetail?: {
    passageCode: string;
    passageId?: string;
  };
}

export async function GET(request: Request) {
  try {
    const supabase = createServerClient();

    // academy_id 파라미터로 학원별 필터링
    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academy_id');

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

    // 해당 학원의 학생 ID 목록 조회 (academy_id가 있는 경우)
    let academyStudentIds: number[] | null = null;
    if (academyId) {
      const { data: academyStudents } = await supabase
        .from('student')
        .select('id')
        .eq('academy_id', academyId);

      if (academyStudents) {
        academyStudentIds = academyStudents.map(s => Number(s.id));
      }
    }

    // test_session에서 오늘의 단어팡, 보물찾기, 내손내줄 데이터 가져오기
    let testSessionQuery = supabase
      .from('test_session')
      .select(`
        id,
        student_id,
        test_type,
        started_at,
        completed_at,
        total_items,
        correct_count,
        accuracy_rate,
        metadata
      `)
      .in('test_type', ['word_pang', 'passage_quiz', 'handwriting'])
      .gte('started_at', startDate)
      .lte('started_at', endDate);

    // academy_id가 있으면 해당 학원 학생만 필터링
    if (academyStudentIds !== null) {
      if (academyStudentIds.length === 0) {
        // 해당 학원에 학생이 없으면 빈 결과 반환
        return NextResponse.json({ data: [], wordCounts: {}, historicalAccuracy: {}, reviewCounts: {} });
      }
      testSessionQuery = testSessionQuery.in('student_id', academyStudentIds);
    }

    const { data: testSessionData, error: testSessionError } = await testSessionQuery.order('started_at', { ascending: false }).range(0, 9999);

    if (testSessionError) {
      console.error('Error fetching test_session data:', testSessionError);
      return NextResponse.json({ error: '데이터를 가져오는데 실패했습니다.' }, { status: 500 });
    }

    // short_passage_learning_history에서 오늘의 문장클리닉 데이터 가져오기 (short_passage 조인)
    let sentenceClinicQuery = supabase
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
      .lte('started_at', endDate);

    // academy_id가 있으면 해당 학원 학생만 필터링
    if (academyStudentIds !== null && academyStudentIds.length > 0) {
      sentenceClinicQuery = sentenceClinicQuery.in('student_id', academyStudentIds);
    }

    const { data: sentenceClinicData, error: sentenceClinicError } = await sentenceClinicQuery.order('started_at', { ascending: false }).range(0, 9999);

    if (sentenceClinicError) {
      console.error('Error fetching sentence clinic data:', sentenceClinicError);
    }

    // 학생 ID 목록 수집 (오늘 학습한 학생들) - Number로 변환 필수
    const testSessionStudentIds = testSessionData?.map(r => Number(r.student_id)) || [];
    const sentenceClinicStudentIds = sentenceClinicData?.map(r => Number(r.student_id)) || [];
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

    // 학생별 개별 문제 수 계산 (단일 GROUP BY 쿼리로 N+1 문제 해결)
    const wordCounts: Record<number, { wordPangCount: number; wordPangCorrect: number; passageQuizCount: number; passageQuizCorrect: number; handwritingCount: number; handwritingCorrect: number }> = {};

    if (studentIds.length > 0) {
      // 단일 쿼리로 학생별, 테스트 타입별 총 개수와 정답 개수 조회
      const { data: countData } = await supabase
        .from('test_result')
        .select('student_id, test_type, is_correct')
        .in('student_id', studentIds)
        .in('test_type', ['word_pang', 'passage_quiz', 'handwriting'])
        .gte('answered_at', startDate)
        .lte('answered_at', endDate);

      // 결과를 집계
      if (countData) {
        for (const row of countData) {
          const studentId = Number(row.student_id);
          if (!wordCounts[studentId]) {
            wordCounts[studentId] = {
              wordPangCount: 0,
              wordPangCorrect: 0,
              passageQuizCount: 0,
              passageQuizCorrect: 0,
              handwritingCount: 0,
              handwritingCorrect: 0
            };
          }

          const counts = wordCounts[studentId];
          if (row.test_type === 'word_pang') {
            counts.wordPangCount += 1;
            if (row.is_correct) counts.wordPangCorrect += 1;
          } else if (row.test_type === 'passage_quiz') {
            counts.passageQuizCount += 1;
            if (row.is_correct) counts.passageQuizCorrect += 1;
          } else if (row.test_type === 'handwriting') {
            counts.handwritingCount += 1;
            if (row.is_correct) counts.handwritingCorrect += 1;
          }
        }
      }

      // 학습 기록이 없는 학생도 초기화
      for (const studentId of studentIds) {
        if (!wordCounts[studentId]) {
          wordCounts[studentId] = {
            wordPangCount: 0,
            wordPangCorrect: 0,
            passageQuizCount: 0,
            passageQuizCorrect: 0,
            handwritingCount: 0,
            handwritingCorrect: 0
          };
        }
      }
    }

    // 단어팡 세션별 단어 정보 조회 (순서 유지)
    const sessionWordMap = new Map<number, { correctWords: string[]; wrongWords: string[]; wordResults: Array<{ word: string; isCorrect: boolean }> }>();
    if (testSessionData) {
      const wordPangSessionIds = testSessionData
        .filter(r => r.test_type === 'word_pang')
        .map(r => r.id);

      if (wordPangSessionIds.length > 0) {
        // test_result에서 세션별 문제 결과 가져오기 (created_at 기준 정렬)
        const { data: wordResultData } = await supabase
          .from('test_result')
          .select('session_id, item_id, is_correct, created_at')
          .eq('test_type', 'word_pang')
          .in('session_id', wordPangSessionIds)
          .order('created_at', { ascending: true })
          .range(0, 9999);

        if (wordResultData && wordResultData.length > 0) {
          // 단어 ID 목록 추출
          const itemIds = [...new Set(wordResultData.map(r => r.item_id))];

          // 단어 정보 가져오기 (1000개 제한 우회)
          const { data: wordData } = await supabase
            .from('word_pang_valid_words')
            .select('voca_id, word')
            .in('voca_id', itemIds)
            .range(0, 9999);

          // 단어 ID -> 단어 맵 생성
          const wordMap = new Map<number, string>();
          wordData?.forEach(w => wordMap.set(Number(w.voca_id), w.word));

          // 세션별 단어 결과 (순서 유지)
          for (const result of wordResultData) {
            const sessionId = Number(result.session_id);
            const word = wordMap.get(Number(result.item_id)) || '';

            if (!sessionWordMap.has(sessionId)) {
              sessionWordMap.set(sessionId, { correctWords: [], wrongWords: [], wordResults: [] });
            }

            const sessionData = sessionWordMap.get(sessionId)!;
            // 순서 유지된 배열에 추가
            sessionData.wordResults.push({ word, isCorrect: result.is_correct });
            // 기존 호환성을 위해 분리 배열도 유지
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
        // test_result에서 세션별 문제 결과 가져오기 (1000개 제한 우회)
        const { data: quizResultData } = await supabase
          .from('test_result')
          .select('session_id, item_uuid, is_correct')
          .eq('test_type', 'passage_quiz')
          .in('session_id', passageQuizSessionIds)
          .not('item_uuid', 'is', null)
          .range(0, 9999);

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

    // 내손내줄 세션별 실제 정답 수 집계 (test_session.correct_count가 업데이트 안 되는 문제 해결)
    const handwritingResultMap = new Map<number, { totalItems: number; correctCount: number }>();
    if (testSessionData) {
      const handwritingSessionIds = testSessionData
        .filter(r => r.test_type === 'handwriting')
        .map(r => r.id);

      if (handwritingSessionIds.length > 0) {
        const { data: hwResultData } = await supabase
          .from('test_result')
          .select('session_id, is_correct')
          .eq('test_type', 'handwriting')
          .in('session_id', handwritingSessionIds);

        if (hwResultData) {
          for (const result of hwResultData) {
            const sessionId = Number(result.session_id);
            if (!handwritingResultMap.has(sessionId)) {
              handwritingResultMap.set(sessionId, { totalItems: 0, correctCount: 0 });
            }
            const data = handwritingResultMap.get(sessionId)!;
            data.totalItems += 1;
            if (result.is_correct) data.correctCount += 1;
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

        // 내손내줄인 경우 metadata에서 code_id 추출
        const metadata = record.metadata as { code_id?: string; passage_id?: string } | null;
        const handwritingDetail = record.test_type === 'handwriting'
          ? {
              passageCode: metadata?.code_id || '-',
              passageId: metadata?.passage_id
            }
          : undefined;

        // 내손내줄인 경우 test_result 집계 값 사용 (test_session.correct_count 업데이트 안 되는 문제 해결)
        const hwResult = record.test_type === 'handwriting'
          ? handwritingResultMap.get(Number(record.id))
          : undefined;
        const totalItems = hwResult ? hwResult.totalItems : (record.total_items || 0);
        const correctCount = hwResult ? hwResult.correctCount : (record.correct_count || 0);
        const accuracyRate = totalItems > 0 ? (correctCount / totalItems) * 100 : 0;

        records.push({
          id: `ts_${record.id}`,
          studentId,
          studentName,
          learningType: record.test_type as 'word_pang' | 'passage_quiz' | 'handwriting',
          startedAt: record.started_at,
          completedAt: record.completed_at,
          totalItems,
          correctCount,
          accuracyRate,
          correctWords: wordData?.correctWords,
          wrongWords: wordData?.wrongWords,
          wordResults: wordData?.wordResults,
          passageQuizDetails,
          handwritingDetail
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

        // short_passage에서 상세 정보 추출 (Supabase 조인 결과는 단일 객체)
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

    // 학생별 문장클리닉 복습 대상 카운트 조회
    const reviewCounts: Record<number, number> = {};

    if (studentIds.length > 0) {
      // 각 학생별로 복습 대상 지문 수 조회
      // 가장 최근 학습에서 틀린 문제가 있는 지문 = 복습 대상
      const { data: reviewData, error: reviewError } = await supabase.rpc('get_review_count_by_students', {
        p_student_ids: studentIds
      });

      if (reviewError) {
        console.error('Error fetching review counts:', reviewError);
        // RPC 실패 시 직접 쿼리로 대체
        for (const studentId of studentIds) {
          const { data: fallbackData } = await supabase
            .from('short_passage_learning_history')
            .select('short_passage_id, cloze_is_correct, keyword_is_correct, completed_at')
            .eq('student_id', studentId)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false });

          if (fallbackData) {
            // 지문별 최신 결과만 추출
            const latestByPassage = new Map<number, { cloze: boolean; keyword: boolean }>();
            for (const row of fallbackData) {
              if (!latestByPassage.has(row.short_passage_id)) {
                latestByPassage.set(row.short_passage_id, {
                  cloze: row.cloze_is_correct,
                  keyword: row.keyword_is_correct
                });
              }
            }

            // 복습 대상 카운트 (둘 중 하나라도 틀린 경우)
            let count = 0;
            latestByPassage.forEach(({ cloze, keyword }) => {
              if (!cloze || !keyword) count++;
            });
            reviewCounts[studentId] = count;
          }
        }
      } else if (reviewData) {
        for (const row of reviewData) {
          reviewCounts[row.student_id] = row.review_count;
        }
      }
    }

    // 오늘 학습한 학생들의 오늘 이전 누적 정답률 조회 (RPC 함수로 limit 1000 문제 해결)
    const historicalAccuracy: Record<number, { wordPangTotal: number; wordPangCorrect: number; wordPangAccuracyRate: number | null }> = {};

    if (studentIds.length > 0) {
      // RPC 함수로 서버사이드 집계 (Supabase JS 기본 limit 1000 문제 해결)
      const { data: historicalData } = await supabase
        .rpc('get_historical_word_pang_accuracy', {
          p_student_ids: studentIds,
          p_before_date: startDate
        });

      // 결과 변환
      if (historicalData) {
        for (const row of historicalData) {
          const total = Number(row.total_count);
          const correct = Number(row.correct_count);
          if (total > 0) {
            historicalAccuracy[row.student_id] = {
              wordPangTotal: total,
              wordPangCorrect: correct,
              wordPangAccuracyRate: (correct / total) * 100
            };
          }
        }
      }
    }

    // 오늘 체크인/체크아웃 정보 조회 (등원 후 경과 시간 및 정렬용)
    const checkInInfo: Record<number, { checkInTime: string; hasCheckOut: boolean }> = {};

    // 체크인 정보 조회 (check_in_time은 KST가 UTC+00으로 저장되어 날짜 문자열로 비교)
    const todayDateStr = `${kstYear}-${String(kstMonth + 1).padStart(2, '0')}-${String(kstDate).padStart(2, '0')}`;
    const { data: checkInData } = await supabase
      .from('check_in_board')
      .select('student_Id, check_in_time')
      .eq('check_in_status', 'CheckIn')
      .gte('check_in_time', todayDateStr)
      .lt('check_in_time', `${todayDateStr}T23:59:59`);

    if (checkInData) {
      for (const row of checkInData) {
        checkInInfo[row.student_Id] = {
          checkInTime: row.check_in_time,
          hasCheckOut: false
        };
      }
    }

    // 체크아웃 정보 조회 (하원 완료 여부)
    const { data: checkOutData } = await supabase
      .from('check_in_board')
      .select('student_Id')
      .eq('check_in_status', 'CheckOut')
      .gte('check_in_time', todayDateStr)
      .lt('check_in_time', `${todayDateStr}T23:59:59`);

    if (checkOutData) {
      for (const row of checkOutData) {
        if (checkInInfo[row.student_Id]) {
          checkInInfo[row.student_Id].hasCheckOut = true;
        }
      }
    }

    return NextResponse.json({ data: records, wordCounts, historicalAccuracy, reviewCounts, checkInInfo });
  } catch (error) {
    console.error('Error in realtime learning API:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
