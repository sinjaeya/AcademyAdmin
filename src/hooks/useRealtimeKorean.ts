'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type {
  LearningRecord,
  StudentWordCount,
  StudentHistoricalAccuracy,
  StudentCheckInInfo,
  SentenceClinicDetail,
  PassageQuizDetail,
  HandwritingDetail,
  RealtimeKoreanApiResponse
} from '@/types/realtime-korean';

// Supabase Realtime payload 타입
interface TestSessionPayload {
  id: number;
  student_id: number;
  test_type: 'word_pang' | 'passage_quiz' | 'handwriting';
  started_at: string;
  completed_at: string | null;
  total_items: number;
  correct_count: number;
  accuracy_rate: number;
  metadata?: {
    code_id?: string;
    passage_id?: string;
  };
}

interface TestResultPayload {
  id: number;
  session_id: number;
  student_id: number;
  test_type: 'word_pang' | 'passage_quiz' | 'handwriting' | 'sc_cloze' | 'sc_keyword';
  is_correct: boolean;
  answered_at: string;
  item_id: number | null;
  item_uuid: string | null;
  selected_answer: number | null;
}

interface SentenceClinicPayload {
  id: string;
  student_id: number;
  short_passage_id: number;
  started_at: string;
  completed_at: string | null;
  cloze_is_correct: boolean;
  keyword_is_correct: boolean;
  cloze_selected_answer: number | null;
  keyword_selected_answer: number | null;
}

// 연결 상태 타입
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// KST 기준 날짜 문자열 반환
const getKSTDateString = (date: Date): string => {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kstDate.toISOString().split('T')[0];
};

export function useRealtimeKorean(academyId: string | null) {
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [wordCounts, setWordCounts] = useState<Map<number, StudentWordCount>>(new Map());
  const [historicalAccuracy, setHistoricalAccuracy] = useState<Map<number, StudentHistoricalAccuracy>>(new Map());
  const [reviewCounts, setReviewCounts] = useState<Map<number, number>>(new Map());
  const [checkInInfo, setCheckInInfo] = useState<Map<number, StudentCheckInInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 채널 참조 (타입은 any로 처리 - Supabase 채널 타입)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelsRef = useRef<any[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // 학원 학생 ID 목록 (실시간 필터링용)
  const academyStudentIdsRef = useRef<Set<number>>(new Set());

  // 데이터 로드 함수
  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      // 학원 학생 ID 목록 조회 (실시간 필터링용)
      if (academyId && supabase) {
        const { data: students } = await supabase
          .from('student')
          .select('id')
          .eq('academy_id', academyId);

        if (students) {
          academyStudentIdsRef.current = new Set(students.map(s => Number(s.id)));
        }
      } else {
        academyStudentIdsRef.current = new Set();
      }

      // API 호출 (academy_id 쿼리 파라미터 추가)
      const url = academyId
        ? `/api/admin/learning/realtime?academy_id=${academyId}`
        : '/api/admin/learning/realtime';
      const response = await fetch(url);
      const result: RealtimeKoreanApiResponse = await response.json();

      if (result.data) {
        setRecords(result.data);
      }
      if (result.wordCounts) {
        const newWordCounts = new Map<number, StudentWordCount>();
        for (const [studentId, counts] of Object.entries(result.wordCounts)) {
          newWordCounts.set(Number(studentId), counts);
        }
        setWordCounts(newWordCounts);
      }
      if (result.historicalAccuracy) {
        const newHistorical = new Map<number, StudentHistoricalAccuracy>();
        for (const [studentId, data] of Object.entries(result.historicalAccuracy)) {
          newHistorical.set(Number(studentId), data);
        }
        setHistoricalAccuracy(newHistorical);
      }
      if (result.reviewCounts) {
        const newReviewCounts = new Map<number, number>();
        for (const [studentId, count] of Object.entries(result.reviewCounts)) {
          newReviewCounts.set(Number(studentId), count as number);
        }
        setReviewCounts(newReviewCounts);
      }
      if (result.checkInInfo) {
        const newCheckInInfo = new Map<number, StudentCheckInInfo>();
        for (const [studentId, info] of Object.entries(result.checkInInfo)) {
          newCheckInInfo.set(Number(studentId), info);
        }
        setCheckInInfo(newCheckInInfo);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [academyId]);

  // 학생 이름 조회
  const fetchStudentName = useCallback(async (studentId: number): Promise<string> => {
    if (!supabase) return `학생 ${studentId}`;
    const { data } = await supabase
      .from('student')
      .select('name')
      .eq('id', studentId)
      .single();
    return data?.name || `학생 ${studentId}`;
  }, []);

  // 단어팡 세션 단어 조회
  const fetchSessionWords = useCallback(async (sessionId: number): Promise<{ correctWords: string[]; wrongWords: string[]; wordResults: Array<{ word: string; isCorrect: boolean; vocaId: number }> } | null> => {
    if (!supabase) return null;

    const { data: wordResultData } = await supabase
      .from('test_result')
      .select('item_id, is_correct')
      .eq('test_type', 'word_pang')
      .eq('session_id', sessionId)
      .order('answered_at', { ascending: true }); // 순서 보장

    if (!wordResultData || wordResultData.length === 0) return null;

    const itemIds = [...new Set(wordResultData.map(r => r.item_id))];
    const { data: wordData } = await supabase
      .from('word_pang_valid_words')
      .select('voca_id, word')
      .in('voca_id', itemIds);

    const wordMap = new Map<number, string>();
    wordData?.forEach(w => wordMap.set(Number(w.voca_id), w.word));

    const correctWords: string[] = [];
    const wrongWords: string[] = [];
    const wordResults: Array<{ word: string; isCorrect: boolean; vocaId: number }> = [];

    for (const result of wordResultData) {
      const word = wordMap.get(Number(result.item_id)) || '';
      const vocaId = Number(result.item_id);
      if (result.is_correct) {
        correctWords.push(word);
      } else {
        wrongWords.push(word);
      }
      wordResults.push({ word, isCorrect: result.is_correct, vocaId });
    }

    return { correctWords, wrongWords, wordResults };
  }, []);

  // 보물찾기 세션의 기존 문제 결과 조회
  const fetchSessionPassageQuiz = useCallback(async (sessionId: number): Promise<PassageQuizDetail[] | null> => {
    if (!supabase) return null;

    const { data: quizResultData } = await supabase
      .from('test_result')
      .select('item_uuid, is_correct')
      .eq('test_type', 'passage_quiz')
      .eq('session_id', sessionId)
      .not('item_uuid', 'is', null);

    if (!quizResultData || quizResultData.length === 0) return null;

    const itemUuids = [...new Set(quizResultData.map(r => r.item_uuid).filter(Boolean))];
    const { data: oxData } = await supabase
      .from('passage_quiz_ox')
      .select('quiz_id, statement, ox_type, answer')
      .in('quiz_id', itemUuids);

    const oxMap = new Map<string, { statement: string; oxType: string; answer: string }>();
    oxData?.forEach(ox => oxMap.set(ox.quiz_id, {
      statement: ox.statement,
      oxType: ox.ox_type,
      answer: ox.answer
    }));

    const details: PassageQuizDetail[] = [];
    for (const result of quizResultData) {
      const oxInfo = oxMap.get(result.item_uuid);
      if (oxInfo) {
        details.push({
          statement: oxInfo.statement,
          oxType: oxInfo.oxType,
          isCorrect: result.is_correct,
          answer: oxInfo.answer
        });
      }
    }

    return details.length > 0 ? details : null;
  }, []);

  // 문장클리닉 지문 정보 조회
  const fetchShortPassage = useCallback(async (shortPassageId: string): Promise<SentenceClinicDetail | null> => {
    if (!supabase) return null;

    const { data } = await supabase
      .from('short_passage')
      .select('*')
      .eq('id', shortPassageId)
      .single();

    if (!data) return null;

    return {
      passageId: shortPassageId,
      keyword: data.keyword || '',
      text: data.text || '',
      clozeSummary: data.cloze_summary || '',
      clozeOptions: [
        data.cloze_option_1 || '',
        data.cloze_option_2 || '',
        data.cloze_option_3 || '',
        data.cloze_option_4 || ''
      ],
      clozeAnswer: data.cloze_answer ?? 0,
      clozeSelectedAnswer: null,
      clozeIsCorrect: null,
      clozeExplanation: data.cloze_explanation || '',
      keywordQuestion: data.keyword_question || '',
      keywordOptions: [
        data.keyword_option_1 || '',
        data.keyword_option_2 || '',
        data.keyword_option_3 || '',
        data.keyword_option_4 || ''
      ],
      keywordAnswer: data.keyword_answer ?? 0,
      keywordSelectedAnswer: null,
      keywordIsCorrect: null,
      keywordExplanation: data.keyword_explanation || ''
    };
  }, []);

  // 보물찾기 문제 정보 조회
  const fetchPassageQuizDetail = useCallback(async (quizId: string): Promise<PassageQuizDetail | null> => {
    if (!supabase) return null;

    const { data } = await supabase
      .from('passage_quiz_ox')
      .select('statement, ox_type, answer')
      .eq('quiz_id', quizId)
      .single();

    if (!data) return null;

    return {
      statement: data.statement,
      oxType: data.ox_type,
      answer: data.answer,
      isCorrect: false // 실시간에서 업데이트됨
    };
  }, []);

  // 학생별 복습 카운트 재조회
  const refreshReviewCount = useCallback(async (studentId: number): Promise<void> => {
    if (!supabase) return;

    // test_session에서 오늘 복습이 필요한 문장 수 조회 (예시 로직)
    const today = new Date().toISOString().split('T')[0];

    // 이 부분은 실제 복습 로직에 맞춰 구현해야 함. 
    // 현재는 test_session 기반으로 변경되었으므로, 관련 RPC나 쿼리를 사용해야 합니다.
    // 기존 로직이 short_passage_learning_history를 사용했으므로, 
    // 여기서는 우선 에러가 나지 않도록 빈 함수로 두거나, 필요한 경우 구현을 채워넣어야 합니다.
    // 일단은 에러 방지를 위해 로그만 남기고, 추후 필요 시 구현합니다.
    console.log('[refreshReviewCount] Review count logic needs to be updated for test_session.');

  }, []);

  // 모든 구독 해제
  const unsubscribeAll = useCallback(() => {
    channelsRef.current.forEach(channel => {
      supabase?.removeChannel(channel);
    });
    channelsRef.current = [];
  }, []);

  // 구독 설정
  const setupSubscriptions = useCallback(() => {
    if (!supabase) {
      setConnectionStatus('error');
      return;
    }

    unsubscribeAll();
    setConnectionStatus('connecting');

    // test_session 채널
    const testSessionChannel = supabase
      .channel('realtime_korean_test_session')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_session',
          filter: `test_type=in.(word_pang,passage_quiz,handwriting,sentence_clinic)`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const payloadRecord = payload.new as TestSessionPayload;
            const today = getKSTDateString(new Date());
            const recordDate = getKSTDateString(new Date(payloadRecord.started_at));
            if (recordDate !== today) return;

            // 학원 학생 필터링 (academyId가 있는 경우)
            if (academyStudentIdsRef.current.size > 0 && !academyStudentIdsRef.current.has(payloadRecord.student_id)) {
              return;
            }

            // UPDATE 이벤트의 경우 DB에서 최신 데이터 직접 조회 (Realtime payload가 불완전할 수 있음)
            let newRecord = payloadRecord;
            if (payload.eventType === 'UPDATE' && supabase) {
              const { data: freshData } = await supabase
                .from('test_session')
                .select('id, student_id, test_type, started_at, completed_at, total_items, correct_count, accuracy_rate, metadata')
                .eq('id', payloadRecord.id)
                .single();
              if (freshData) {
                newRecord = freshData as TestSessionPayload;
              }
            }

            const studentName = await fetchStudentName(newRecord.student_id);
            let wordData: { correctWords: string[]; wrongWords: string[]; wordResults: Array<{ word: string; isCorrect: boolean; vocaId: number }> } | null = null;
            let passageQuizData: PassageQuizDetail[] | null = null;
            let handwritingData: HandwritingDetail | null = null;
            let sentenceClinicDetail: SentenceClinicDetail | null = null;

            if (newRecord.test_type === 'word_pang') {
              wordData = await fetchSessionWords(newRecord.id);
            } else if (newRecord.test_type === 'passage_quiz') {
              passageQuizData = await fetchSessionPassageQuiz(newRecord.id);
            } else if (newRecord.test_type === 'handwriting') {
              // metadata에서 code_id 추출
              handwritingData = {
                passageCode: newRecord.metadata?.code_id || '-',
                passageId: newRecord.metadata?.passage_id
              };
            } else if (newRecord.test_type === 'sentence_clinic') {
              const passageId = newRecord.metadata?.passage_id;
              if (passageId) {
                const shortPassage = await fetchShortPassage(passageId);

                if (!shortPassage) {
                  console.warn(`[test_session] fetchShortPassage 실패: passage_id=${passageId}`);
                }

                // 상세 결과 조회 (test_result)
                if (supabase && shortPassage) {
                  const { data: results } = await supabase
                    .from('test_result')
                    .select('test_type, selected_answer, is_correct')
                    .eq('session_id', newRecord.id);

                  const clozeResult = results?.find(r => r.test_type === 'sc_cloze');
                  const keywordResult = results?.find(r => r.test_type === 'sc_keyword');

                  // sentenceClinicDetail 생성
                  sentenceClinicDetail = {
                    ...shortPassage,
                    clozeSelectedAnswer: clozeResult?.selected_answer ?? null,
                    clozeIsCorrect: clozeResult?.is_correct ?? null,
                    keywordSelectedAnswer: keywordResult?.selected_answer ?? null,
                    keywordIsCorrect: keywordResult?.is_correct ?? null,
                  };
                }
              } else {
                console.warn(`[test_session] metadata.passage_id 누락: session_id=${newRecord.id}`);
              }
            }

            const record: LearningRecord = {
              id: `ts_${newRecord.id}`,
              studentId: newRecord.student_id,
              studentName,
              learningType: newRecord.test_type,
              startedAt: newRecord.started_at,
              completedAt: newRecord.completed_at,
              totalItems: newRecord.total_items || 0,
              correctCount: newRecord.correct_count || 0,
              accuracyRate: newRecord.accuracy_rate || 0,
              correctWords: wordData?.correctWords,
              wrongWords: wordData?.wrongWords,
              wordResults: wordData?.wordResults,
              passageQuizDetails: passageQuizData || undefined,
              handwritingDetail: handwritingData || undefined,
              sentenceClinicDetail: sentenceClinicDetail || undefined
            };

            setRecords(prev => {
              const existingIndex = prev.findIndex(r => r.id === record.id);
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = record;
                return updated;
              }
              return [record, ...prev];
            });
            setLastUpdate(new Date());
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
        }
      });

    // test_result 채널 (개별 문제) - sentence_clinic 포함
    const testResultChannel = supabase
      .channel('realtime_korean_test_result')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'test_result',
          filter: `test_type=in.(word_pang,passage_quiz,handwriting,sc_cloze,sc_keyword)`
        },
        async (payload) => {
          const newResult = payload.new as TestResultPayload;
          const today = getKSTDateString(new Date());
          const resultDate = getKSTDateString(new Date(newResult.answered_at));
          if (resultDate !== today) return;

          // 학원 학생 필터링 (academyId가 있는 경우)
          if (academyStudentIdsRef.current.size > 0 && !academyStudentIdsRef.current.has(newResult.student_id)) {
            return;
          }

          const studentId = newResult.student_id;
          const testType = newResult.test_type;
          const isCorrect = newResult.is_correct;
          const sessionId = newResult.session_id;

          // 보물찾기 상세 정보
          let passageQuizDetail: PassageQuizDetail | null = null;
          if (testType === 'passage_quiz' && newResult.item_uuid) {
            passageQuizDetail = await fetchPassageQuizDetail(newResult.item_uuid);
            if (passageQuizDetail) {
              passageQuizDetail.isCorrect = isCorrect;
            }
          }

          // 단어팡 단어 정보 조회
          let wordText: string | null = null;
          if (testType === 'word_pang' && newResult.item_id) {
            const { data: wordData } = await supabase!
              .from('word_pang_valid_words')
              .select('word')
              .eq('voca_id', newResult.item_id)
              .single();
            wordText = wordData?.word || null;
          }

          // 레코드 업데이트
          setRecords(prev => {
            const updated = [...prev];
            const recordIndex = updated.findIndex(r => r.id === `ts_${sessionId}`);

            if (recordIndex >= 0) {
              const record = { ...updated[recordIndex] };
              record.totalItems += 1;
              if (isCorrect) record.correctCount += 1;
              record.accuracyRate = (record.correctCount / record.totalItems) * 100;

              // 보물찾기 상세 추가
              if (testType === 'passage_quiz' && passageQuizDetail) {
                record.passageQuizDetails = record.passageQuizDetails
                  ? [...record.passageQuizDetails, passageQuizDetail]
                  : [passageQuizDetail];
              }

              // 단어팡 단어 추가 (wordResults 포함)
              if (testType === 'word_pang' && wordText) {
                const vocaId = newResult.item_id || 0;
                // wordResults 배열에 순서대로 추가
                record.wordResults = record.wordResults
                  ? [...record.wordResults, { word: wordText, isCorrect, vocaId }]
                  : [{ word: wordText, isCorrect, vocaId }];

                // 기존 호환성을 위해 분리 배열도 유지
                if (isCorrect) {
                  record.correctWords = record.correctWords
                    ? [...record.correctWords, wordText]
                    : [wordText];
                } else {
                  record.wrongWords = record.wrongWords
                    ? [...record.wrongWords, wordText]
                    : [wordText];
                }
              }

              // 문장클리닉 결과 업데이트
              if (testType === 'sc_cloze' || testType === 'sc_keyword') {
                // sentenceClinicDetail이 없으면 기본값으로 생성 (타이밍 이슈 대응)
                if (!record.sentenceClinicDetail) {
                  console.warn(`[test_result] sentenceClinicDetail 없음 (타이밍 이슈): session_id=${sessionId}, student_id=${studentId}`);
                  record.sentenceClinicDetail = {
                    passageId: '',
                    keyword: '',
                    text: '',
                    clozeSummary: '',
                    clozeOptions: ['', '', '', ''],
                    clozeAnswer: 0,
                    clozeSelectedAnswer: null,
                    clozeIsCorrect: null,
                    clozeExplanation: '',
                    keywordQuestion: '',
                    keywordOptions: ['', '', '', ''],
                    keywordAnswer: 0,
                    keywordSelectedAnswer: null,
                    keywordIsCorrect: null,
                    keywordExplanation: ''
                  };
                }

                record.sentenceClinicDetail = {
                  ...record.sentenceClinicDetail,
                  ...(testType === 'sc_cloze' ? {
                    clozeSelectedAnswer: newResult.selected_answer ?? null,
                    clozeIsCorrect: isCorrect,
                  } : {}),
                  ...(testType === 'sc_keyword' ? {
                    keywordSelectedAnswer: newResult.selected_answer ?? null,
                    keywordIsCorrect: isCorrect,
                  } : {})
                };
              }

              updated[recordIndex] = record;
            }
            return updated;
          });

          // 학생별 문제 수 업데이트
          setWordCounts(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(studentId) || {
              wordPangCount: 0,
              wordPangCorrect: 0,
              passageQuizCount: 0,
              passageQuizCorrect: 0,
              handwritingCount: 0,
              handwritingCorrect: 0
            };

            if (testType === 'word_pang') {
              current.wordPangCount += 1;
              if (isCorrect) current.wordPangCorrect += 1;
            } else if (testType === 'passage_quiz') {
              current.passageQuizCount += 1;
              if (isCorrect) current.passageQuizCorrect += 1;
            } else if (testType === 'handwriting') {
              current.handwritingCount += 1;
              if (isCorrect) current.handwritingCorrect += 1;
            }

            newMap.set(studentId, { ...current });
            return newMap;
          });

          setLastUpdate(new Date());
        }
      )
      .subscribe();

    // check_in_board 채널 (등원/하원 실시간 반영)
    const checkInChannel = supabase
      .channel('realtime_korean_check_in')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_in_board',
          ...(academyId ? { filter: `academy_id=eq.${academyId}` } : {})
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const record = payload.new as { student_Id: number; check_in_time: string; check_in_status: string };
            const today = getKSTDateString(new Date());
            const recordDate = getKSTDateString(new Date(record.check_in_time));
            if (recordDate !== today) return;

            if (record.check_in_status === 'CheckIn') {
              setCheckInInfo(prev => {
                const newMap = new Map(prev);
                newMap.set(record.student_Id, {
                  checkInTime: record.check_in_time,
                  hasCheckOut: false
                });
                return newMap;
              });
            } else if (record.check_in_status === 'CheckOut') {
              setCheckInInfo(prev => {
                const newMap = new Map(prev);
                const existing = newMap.get(record.student_Id);
                if (existing) {
                  newMap.set(record.student_Id, { ...existing, hasCheckOut: true });
                }
                return newMap;
              });
            }
          }
        }
      )
      .subscribe();

    channelsRef.current = [testSessionChannel, testResultChannel, checkInChannel];
  }, [academyId, fetchStudentName, fetchSessionWords, fetchSessionPassageQuiz, fetchShortPassage, fetchPassageQuizDetail, refreshReviewCount, unsubscribeAll]);

  // 세션 삭제 (고아 세션 정리용)
  const deleteSession = useCallback(async (recordId: string, learningType: string): Promise<boolean> => {
    if (!supabase) return false;

    try {
      // 레코드 ID에서 실제 DB ID 추출 (ts_123 -> 123, sc_abc -> abc)
      const dbId = recordId.replace(/^(ts_|sc_)/, '');


      // 모든 타입을 test_session 삭제 로직으로 통일
      const sessionId = Number(dbId);

      // 1. 내손내줄인 경우 handwriting_canvas 먼저 삭제 (FK 제약조건)
      if (learningType === 'handwriting') {
        const { error: canvasError } = await supabase
          .from('handwriting_canvas')
          .delete()
          .eq('session_id', sessionId);

        if (canvasError) {
          console.error('[deleteSession] handwriting_canvas 삭제 실패:', canvasError);
        }
      }

      // 2. test_result 삭제 (FK 제약조건 - 문장클리닉 포함)
      const { error: resultError } = await supabase
        .from('test_result')
        .delete()
        .eq('session_id', sessionId);

      if (resultError) {
        console.error('[deleteSession] test_result 삭제 실패:', resultError);
      }

      // 3. test_session 삭제
      const { error } = await supabase
        .from('test_session')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('[deleteSession] test_session 삭제 실패:', error);
        return false;
      }

      // 로컬 상태에서 제거
      setRecords(prev => prev.filter(r => r.id !== recordId));
      console.log('[deleteSession] 삭제 완료:', recordId);
      return true;
    } catch (error) {
      console.error('[deleteSession] 삭제 오류:', error);
      return false;
    }
  }, []);

  // 재연결 시도
  const reconnect = useCallback(() => {
    if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('Realtime: 최대 재연결 횟수 초과');
      setConnectionStatus('error');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectCountRef.current += 1;
    const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current - 1), 30000);

    console.log(`Realtime: 재연결 시도 (${reconnectCountRef.current}/${MAX_RECONNECT_ATTEMPTS}), 대기 시간: ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      setupSubscriptions();
    }, delay);
  }, [setupSubscriptions]);

  // 초기 로드 및 구독 설정 (순서 보장: 데이터 로드 완료 후 구독 설정)
  useEffect(() => {
    const initialize = async (): Promise<void> => {
      await loadData();  // 데이터 로드 완료 후
      setupSubscriptions();  // 구독 설정 (중복 카운트 방지)
    };

    initialize();

    return () => {
      unsubscribeAll();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [loadData, setupSubscriptions, unsubscribeAll]);

  // 연결 끊김 시 재연결
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      reconnect();
    }
  }, [connectionStatus, reconnect]);

  // 연결 성공 시 재연결 카운터 리셋
  useEffect(() => {
    if (connectionStatus === 'connected') {
      reconnectCountRef.current = 0;
      console.log('Realtime: 연결 성공, 재연결 카운터 리셋');
    }
  }, [connectionStatus]);

  return {
    records,
    wordCounts,
    historicalAccuracy,
    reviewCounts,
    checkInInfo,
    loading,
    connectionStatus,
    lastUpdate,
    refresh: loadData,
    deleteSession
  };
}
