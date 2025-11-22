'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  MessageCircle,
  X,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

// 학생 데이터 타입 정의 (student 테이블 사용)
interface Student {
  id: string;
  name: string;
  phone_number: string;
  phone_middle_4: string;
  school: string;
  grade: string;
  parent_phone: string;
  currentAcademy: string;
  status: string;
  study_time?: string;
  created_at: string;
  updated_at: string;
  messageCount?: number; // 최근 30일 메시지 수
}

// 메시지 히스토리 타입 정의
interface MessageHistory {
  id: string;
  student_id: number;
  student_name: string;
  message_content: string;
  attendance: string;
  class_attitude: string;
  homework_submission: string;
  homework_quality: string;
  test_score: number | null;
  created_at: string;
}

// 학습지 데이터 타입 정의
interface Worksheet {
  id: number;
  student_name: string;
  grade: string;
  worksheet_name: string;
  score: string;
  issued_date: string;
  crawled_at: string;
  created_at: string;
  updated_at: string;
}


// 데이터 포맷팅 함수 (현재 사용되지 않지만 향후 사용을 위해 유지)
// const formatDateTime = (dateString: string) => {
//   if (!dateString) return 'N/A';
//   const date = new Date(dateString);
//   return new Intl.DateTimeFormat('ko-KR', {
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit',
//     second: '2-digit',
//     hour12: false
//   }).format(date);
// };


export default function StudyReportsPage() {
  const { academyName } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedAcademy, setSelectedAcademy] = useState<string>(academyName || '전체');
  
      // 학습정보 상태
      const [learningInfo, setLearningInfo] = useState({
        attendance: 'attendance', // 출결사항 - 출석
        classAttitude: 'average', // 수업태도 - 보통
        homeworkSubmission: 'submitted', // 과제제출 - 제출
        homeworkQuality: 'average', // 과제성실도 - 보통
        testScore: '' // 테스트점수
      });
  
  // 학습지 모달 상태
  const [showWorksheetModal, setShowWorksheetModal] = useState(false);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loadingWorksheets, setLoadingWorksheets] = useState(false);
  
  // AI 리포트 상태
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiElapsedTime, setAiElapsedTime] = useState(0);
  
  const [messageText, setMessageText] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [studentMessageCounts, setStudentMessageCounts] = useState<Record<string, number>>({});

  // 학습정보 변경 핸들러
  const handleLearningInfoChange = (field: string, value: string) => {
    setLearningInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 학습지 데이터 가져오기
  const fetchWorksheets = async () => {
    if (!selectedStudent) {
      setAlertMessage('학생을 먼저 선택해 주세요');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 1000);
      return;
    }

    try {
      setLoadingWorksheets(true);
      const student = students.find(s => s.id === selectedStudent);
      const studentName = student?.name;
      
      if (!studentName) {
        throw new Error('학생 정보를 찾을 수 없습니다');
      }

      const response = await fetch(`/api/admin/learning/worksheets?student_name=${encodeURIComponent(studentName)}`);
      
      if (!response.ok) {
        throw new Error('학습지 데이터를 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      setWorksheets(data || []);
      setShowWorksheetModal(true);
    } catch (err) {
      console.error('학습지 조회 오류:', err);
      setAlertMessage('학습지 데이터를 가져오는데 실패했습니다');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 1000);
    } finally {
      setLoadingWorksheets(false);
    }
  };

  // 학습지를 메시지에 넣기
  const handleAddWorksheetToMessage = () => {
    if (worksheets.length === 0) return;
    
    // 최근 5개의 학습지 정보 생성
    const recentWorksheets = worksheets.slice(0, 5);
    
    // 통계 수집
    let notDoneCount = 0;
    let doneCount = 0;
    const scores: string[] = [];
    
    recentWorksheets.forEach((ws) => {
      if (ws.score === '채점' || ws.score === '이어 채점' || ws.score.includes('채점')) {
        notDoneCount++;
      } else {
        doneCount++;
        scores.push(ws.score);
      }
    });
    
    // 메시지 생성
    let worksheetText = '\n\n[숙제 현황(최근 5개)]\n';
    worksheetText += `- 숙제안함 : ${notDoneCount}개\n`;
    worksheetText += `- 숙제함 : ${doneCount}개`;
    if (scores.length > 0) {
      worksheetText += ` (${scores.join('/')})`;
    }
    worksheetText += '\n\n';
    
    // 상세 리스트
    recentWorksheets.forEach((ws, index) => {
      let scoreDisplay = ws.score;
      if (ws.score === '채점' || ws.score === '이어 채점' || ws.score.includes('채점')) {
        scoreDisplay = '숙제 안함';
      }
      
      // 출제일 포맷팅 (YYYY-MM-DD -> MM월 DD일)
      let issuedDateDisplay = '';
      if (ws.issued_date) {
        const date = new Date(ws.issued_date);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        issuedDateDisplay = `${month}월 ${day}일 `;
      }
      
      worksheetText += `${issuedDateDisplay}(${scoreDisplay}) ${index + 1}. ${ws.worksheet_name}\n`;
    });

    // 메시지 텍스트에 추가
    setMessageText(prev => prev + worksheetText);
    setShowWorksheetModal(false);
  };

  // 웹훅 로그 저장 헬퍼 함수
  const saveWebhookLog = async (logData: {
    studentId: number;
    studentName: string;
    webhookUrl: string;
    requestPayload: Record<string, unknown>;
    responseStatus?: number;
    responseBody?: string;
    errorMessage?: string;
  }) => {
    try {
      if (!supabase) {
        console.error('Supabase client is not available');
        return;
      }
      await supabase.from('webhook_log').insert({
        student_id: logData.studentId,
        student_name: logData.studentName,
        webhook_url: logData.webhookUrl,
        request_payload: logData.requestPayload,
        response_status: logData.responseStatus,
        response_body: logData.responseBody,
        error_message: logData.errorMessage
      });
    } catch (error) {
      console.error('웹훅 로그 저장 실패:', error);
    }
  };

  // 미리보기 작성 핸들러
  const handlePreviewCreate = () => {
    if (!selectedStudent) {
      setAlertMessage('학생을 먼저 선택해 주세요');
      setShowAlert(true);
          // 1초 후 자동으로 알림 숨기기
          setTimeout(() => {
            setShowAlert(false);
          }, 1000);
      return;
    }
    
    // 선택된 학생 정보 가져오기
    const student = students.find(s => s.id === selectedStudent);
    const studentName = student?.name || '알 수 없음';
    
    // 라벨 매핑 객체
    const labelMappings: {
      attendance: { [key: string]: string };
      classAttitude: { [key: string]: string };
      homeworkSubmission: { [key: string]: string };
      homeworkQuality: { [key: string]: string };
    } = {
      attendance: {
        'attendance': '출석',
        'late': '지각',
        'absent': '결석'
      },
      classAttitude: {
        'excellent': '우수',
        'average': '보통',
        'poor': '미흡'
      },
      homeworkSubmission: {
        'submitted': '제출',
        'not_submitted': '미제출'
      },
      homeworkQuality: {
        'excellent': '우수',
        'average': '보통',
        'poor': '미흡'
      }
    };
    
    // 미리보기 텍스트 생성
    const previewText = `학생명 : ${studentName}

출결사항 : ${labelMappings.attendance[learningInfo.attendance] || learningInfo.attendance}

수업태도 : ${labelMappings.classAttitude[learningInfo.classAttitude] || learningInfo.classAttitude}

과제제출 : ${labelMappings.homeworkSubmission[learningInfo.homeworkSubmission] || learningInfo.homeworkSubmission}

과제성실도 : ${labelMappings.homeworkQuality[learningInfo.homeworkQuality] || learningInfo.homeworkQuality}

테스트 점수 : ${learningInfo.testScore ? learningInfo.testScore + '점' : ''}`;
    // 메시지 텍스트 영역에 설정
    setMessageText(previewText);
    
        console.log('미리보기 작성 완료:', previewText);
      };

  // 미리보기 + 매쓰플랫 통합 핸들러
  const handlePreviewWithMathflat = async () => {
    if (!selectedStudent) {
      setAlertMessage('학생을 먼저 선택해 주세요');
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 1000);
      return;
    }
    
    // 1. 먼저 미리보기 생성
    const student = students.find(s => s.id === selectedStudent);
    const studentName = student?.name || '알 수 없음';
    
    const labelMappings: {
      attendance: { [key: string]: string };
      classAttitude: { [key: string]: string };
      homeworkSubmission: { [key: string]: string };
      homeworkQuality: { [key: string]: string };
    } = {
      attendance: {
        'attendance': '출석',
        'late': '지각',
        'absent': '결석'
      },
      classAttitude: {
        'excellent': '우수',
        'average': '보통',
        'poor': '미흡'
      },
      homeworkSubmission: {
        'submitted': '제출',
        'not_submitted': '미제출'
      },
      homeworkQuality: {
        'excellent': '우수',
        'average': '보통',
        'poor': '미흡'
      }
    };
    
    const previewText = `학생명 : ${studentName}

출결사항 : ${labelMappings.attendance[learningInfo.attendance] || learningInfo.attendance}

수업태도 : ${labelMappings.classAttitude[learningInfo.classAttitude] || learningInfo.classAttitude}

과제제출 : ${labelMappings.homeworkSubmission[learningInfo.homeworkSubmission] || learningInfo.homeworkSubmission}

과제성실도 : ${labelMappings.homeworkQuality[learningInfo.homeworkQuality] || learningInfo.homeworkQuality}

테스트 점수 : ${learningInfo.testScore ? learningInfo.testScore + '점' : ''}`;
    
    // 2. 매쓰플랫 학습지 데이터 가져오기
    try {
      setLoadingWorksheets(true);
      const response = await fetch(`/api/admin/learning/worksheets?student_name=${encodeURIComponent(studentName)}`);
      
      if (!response.ok) {
        throw new Error('학습지 데이터를 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      
      // 3. 학습지 정보 생성
      let worksheetText = '';
      if (data && data.length > 0) {
        const recentWorksheets = data.slice(0, 5);
        
        // 통계 수집
        let notDoneCount = 0;
        let doneCount = 0;
        const scores: string[] = [];
        
        recentWorksheets.forEach((ws: Worksheet) => {
          if (ws.score === '채점' || ws.score === '이어 채점' || ws.score.includes('채점')) {
            notDoneCount++;
          } else {
            doneCount++;
            scores.push(ws.score);
          }
        });
        
        // 메시지 생성
        worksheetText = '\n\n[숙제 현황(최근 5개)]\n';
        worksheetText += `- 숙제안함 : ${notDoneCount}개\n`;
        worksheetText += `- 숙제함 : ${doneCount}개`;
        if (scores.length > 0) {
          worksheetText += ` (${scores.join('/')})`;
        }
        worksheetText += '\n\n';
        
        // 상세 리스트
        recentWorksheets.forEach((ws: Worksheet, index: number) => {
          let scoreDisplay = ws.score;
          if (ws.score === '채점' || ws.score === '이어 채점' || ws.score.includes('채점')) {
            scoreDisplay = '숙제 안함';
          }
          
          // 출제일 포맷팅 (YYYY-MM-DD -> MM월 DD일)
          let issuedDateDisplay = '';
          if (ws.issued_date) {
            const date = new Date(ws.issued_date);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            issuedDateDisplay = `${month}월 ${day}일 `;
          }
          
          worksheetText += `${issuedDateDisplay}(${scoreDisplay}) ${index + 1}. ${ws.worksheet_name}\n`;
        });
      }
      
      // 4. 미리보기 + 학습지 정보를 메시지 텍스트에 설정
      setMessageText(previewText + worksheetText);
      
      console.log('미리보기+매쓰플랫 작성 완료');
      
    } catch (err) {
      console.error('학습지 조회 오류:', err);
      // 오류 발생 시에도 미리보기는 표시
      setMessageText(previewText);
      setAlertMessage('학습지 데이터를 가져오는데 실패했습니다');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 1000);
    } finally {
      setLoadingWorksheets(false);
    }
      };

      // 카카오톡 전송 핸들러
      const handleKakaoSend = async () => {
        if (!selectedStudent) {
          setAlertMessage('학생을 먼저 선택해 주세요');
          setShowAlert(true);
          setTimeout(() => {
            setShowAlert(false);
          }, 1000);
          return;
        }

        if (!messageText.trim()) {
          setAlertMessage('메시지 내용이 비어있습니다');
          setShowAlert(true);
          setTimeout(() => {
            setShowAlert(false);
          }, 1000);
          return;
        }

        try {
          setIsSending(true);

          // 선택된 학생 정보 가져오기
          const student = students.find(s => s.id === selectedStudent);
          if (!student) {
            throw new Error('선택된 학생을 찾을 수 없습니다');
          }

          // === Make.com 웹훅 전송 ===
          const webhookUrl = 'https://hook.us2.make.com/q46vjxgc89g8ne27f6kpht08pzb6n6a5';
          
          const webhookPayload = {
            academy: student.currentAcademy,
            student_name: student.name,
            parent_phone: student.parent_phone,
            message: messageText
          };

          // 타임아웃을 포함한 fetch 요청 (10초)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          try {
            const webhookResponse = await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(webhookPayload),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            const responseBody = await webhookResponse.text();

            if (!webhookResponse.ok) {
              // 웹훅 실패 로그 저장
              await saveWebhookLog({
                studentId: parseInt(selectedStudent),
                studentName: student.name,
                webhookUrl,
                requestPayload: webhookPayload,
                responseStatus: webhookResponse.status,
                responseBody,
                errorMessage: `HTTP ${webhookResponse.status}: ${webhookResponse.statusText}`
              });

              throw new Error(`웹훅 요청 실패: ${webhookResponse.status} ${webhookResponse.statusText}`);
            }

            // 웹훅 성공 로그 저장
            await saveWebhookLog({
              studentId: parseInt(selectedStudent),
              studentName: student.name,
              webhookUrl,
              requestPayload: webhookPayload,
              responseStatus: webhookResponse.status,
              responseBody
            });

            console.log('웹훅 전송 성공:', webhookPayload);

          } catch (webhookError: unknown) {
            clearTimeout(timeoutId);
            
            // 에러 타입별 메시지
            let errorMessage = '카카오톡 전송 중 오류가 발생했습니다.';
            
            if (webhookError instanceof Error) {
              if (webhookError.name === 'AbortError') {
                errorMessage = '카카오톡 전송 시간이 초과되었습니다. 다시 시도해주세요.';
              } else if (webhookError.message.includes('Failed to fetch') || webhookError.message.includes('fetch')) {
                errorMessage = '네트워크 연결을 확인해주세요.';
              } else if (webhookError.message.includes('웹훅 요청 실패')) {
                errorMessage = webhookError.message.replace('웹훅 요청 실패:', '카카오톡 전송 실패:');
              }
              
              // 웹훅 실패 로그 저장 (네트워크 오류나 타임아웃의 경우)
              if (webhookError.name === 'AbortError' || webhookError.message.includes('fetch')) {
                await saveWebhookLog({
                  studentId: parseInt(selectedStudent),
                  studentName: student.name,
                  webhookUrl,
                  requestPayload: webhookPayload,
                  errorMessage: webhookError.message
                });
              }
            }
            
            console.error('웹훅 전송 오류:', webhookError);
            
            setAlertMessage(errorMessage);
            setShowAlert(true);
            setTimeout(() => {
              setShowAlert(false);
            }, 1000);
            
            // 웹훅 실패 시 DB 저장 안 하고 중단
            return;
          }
          // === 웹훅 전송 끝 ===

          // 메시지 히스토리에 저장 (웹훅 성공 후에만 실행)
          if (!supabase) {
            throw new Error('Supabase client is not available');
          }

          const { error } = await supabase
            .from('message_history')
            .insert({
              student_id: parseInt(selectedStudent),
              student_name: student.name,
              message_content: messageText,
              attendance: learningInfo.attendance,
              class_attitude: learningInfo.classAttitude,
              homework_submission: learningInfo.homeworkSubmission,
              homework_quality: learningInfo.homeworkQuality,
              test_score: learningInfo.testScore && learningInfo.testScore.trim() !== '' ? parseInt(learningInfo.testScore) : null
            });

          if (error) {
            throw error;
          }

          // 성공 메시지 표시
          setAlertMessage(`${student.name} 학생에게 메시지가 전송되었습니다!`);
          setShowAlert(true);
          setTimeout(() => {
            setShowAlert(false);
          }, 1000);

          // 메시지 내용 초기화
          setMessageText('');

          console.log('메시지 전송 완료:', {
            student: student.name,
            message: messageText,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('메시지 전송 중 오류:', error);
          setAlertMessage('메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요.');
          setShowAlert(true);
          setTimeout(() => {
            setShowAlert(false);
          }, 1000);
        } finally {
          setIsSending(false);
        }
      };

      // 초기화 핸들러
      const handleReset = () => {
        setSelectedStudent(null);
        setLearningInfo({
          attendance: 'attendance',
          classAttitude: 'average',
          homeworkSubmission: 'submitted',
          homeworkQuality: 'average',
          testScore: ''
        });
        setMessageText('');
      };

  // AI 리포트 생성 핸들러
  const handleAIReport = async () => {
    // 메시지가 비어있는지 확인
    if (!messageText || messageText.trim() === '') {
      setAlertMessage('메시지 내용을 먼저 입력해주세요');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
      return;
    }

    let timerInterval: NodeJS.Timeout | null = null;

    try {
      setIsGeneratingAI(true);
      setAiElapsedTime(0);
      
      // 타이머 시작
      const startTime = Date.now();
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setAiElapsedTime(elapsed);
      }, 1000);
      
      console.log('AI 리포트 요청 데이터:', { learningData: messageText });
      
      // Next.js API 라우트를 통해 프록시 호출 (CORS 문제 해결)
      const response = await fetch('/api/admin/ai-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          learningData: messageText
        })
      });

      const result = await response.json();
      console.log('AI 리포트 응답:', result);

      if (!response.ok) {
        console.error('AI 리포트 에러 상세:', result.error);
        throw new Error(result.error?.message || 'AI 리포트 생성에 실패했습니다');
      }
      
      if (result.success && result.data?.report) {
        // AI가 생성한 리포트로 메시지 덮어쓰기
        setMessageText(result.data.report);
        
        setAlertMessage('AI 리포트가 생성되었습니다');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 1000);
      } else {
        throw new Error('AI 리포트 응답 형식이 올바르지 않습니다');
      }

    } catch (error) {
      console.error('AI 리포트 생성 오류:', error);
      setAlertMessage(error instanceof Error ? error.message : 'AI 리포트 생성 중 오류가 발생했습니다');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
    } finally {
      // 타이머 정지
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      setIsGeneratingAI(false);
      setAiElapsedTime(0);
    }
  };

  // 데이터 가져오기
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }

      const { data, error: fetchError } = await supabase
        .from('student')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      console.log('학생 데이터:', data);
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // academyName이 변경되면 selectedAcademy도 업데이트
  useEffect(() => {
    if (academyName) {
      setSelectedAcademy(academyName);
    }
  }, [academyName]);

  // 학생별 메시지 수 가져오기
  const fetchMessageCounts = useCallback(async () => {
    if (!supabase || students.length === 0) {
      return;
    }

    try {
      // 30일 전 날짜 계산
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateString = thirtyDaysAgo.toISOString().split('T')[0];

      // 모든 학생의 최근 30일 메시지 수 조회
      const studentIds = students.map(s => parseInt(s.id));
      
      const { data, error } = await supabase
        .from('message_history')
        .select('student_id, created_at')
        .in('student_id', studentIds)
        .gte('created_at', dateString);

      if (error) {
        console.error('메시지 수 조회 오류:', error);
        return;
      }

      // 학생별 메시지 수 카운트
      const counts: Record<string, number> = {};
      studentIds.forEach(id => {
        counts[id.toString()] = 0;
      });

      data?.forEach((msg: any) => {
        const studentId = msg.student_id.toString();
        if (counts.hasOwnProperty(studentId)) {
          counts[studentId]++;
        }
      });

      setStudentMessageCounts(counts);
    } catch (err) {
      console.error('메시지 수 조회 중 오류:', err);
    }
  }, [supabase, students]);

  useEffect(() => {
    if (students.length > 0) {
      fetchMessageCounts();
    }
  }, [students, fetchMessageCounts]);

  // 학생 메시지 히스토리 가져오기
  const fetchMessageHistory = useCallback(async (studentId: string) => {
    if (!supabase) {
      return;
    }

    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('message_history')
        .select('*')
        .eq('student_id', parseInt(studentId))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('메시지 히스토리 조회 오류:', error);
        return;
      }

      setMessageHistory(data || []);
    } catch (err) {
      console.error('메시지 히스토리 조회 중 오류:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [supabase]);

  // 학생 클릭 핸들러
  const handleStudentClick = useCallback((studentId: string) => {
    const newSelected = selectedStudent === studentId ? null : studentId;
    setSelectedStudent(newSelected);
    
    if (newSelected) {
      fetchMessageHistory(newSelected);
    } else {
      setMessageHistory([]);
      setSelectedMessage(null);
    }
  }, [selectedStudent, fetchMessageHistory]);

  // 학원별 필터링된 학생 목록 (가나다 순 정렬)
  const filteredStudents = students
    .filter(student => {
      if (selectedAcademy === '전체') return true;
      return student.currentAcademy === selectedAcademy;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));



  return (
        <AdminLayout>
          <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">학습리포트</h1>
                <p className="text-gray-600 mt-2">학생을 선택하고 학습정보를 입력하여 학부모 문자 메시지를 작성합니다</p>
                
                {/* 뱃지 표시 기준 */}
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="text-gray-700 font-medium">학생별 메시지 발송 횟수 (최근 30일):</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500 text-white h-5 px-2 text-xs font-bold">20회 이상</Badge>
                    <Badge className="bg-yellow-500 text-white h-5 px-2 text-xs font-bold">10~19회</Badge>
                    <Badge className="bg-red-500 text-white h-5 px-2 text-xs font-bold">10회 미만</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* 얼럿 메시지 */}
            {showAlert && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className={`rounded-lg p-4 shadow-lg max-w-sm w-full mx-4 ${
                  alertMessage.includes('전송되었습니다') 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {alertMessage.includes('전송되었습니다') ? (
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        alertMessage.includes('전송되었습니다') 
                          ? 'text-green-800' 
                          : 'text-red-800'
                      }`}>
                        {alertMessage}
                      </p>
                    </div>
                    <div className="ml-auto pl-3">
                      <button
                        onClick={() => setShowAlert(false)}
                        className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          alertMessage.includes('전송되었습니다')
                            ? 'bg-green-50 text-green-400 hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50'
                            : 'bg-red-50 text-red-400 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50'
                        }`}
                      >
                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3단 레이아웃 */}
            <div className="grid grid-cols-12 gap-6">
              {/* 좌측: 학생 목록 */}
              <div className="col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      학생 목록
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        <Label>학원:</Label>
                        <select
                          value={selectedAcademy}
                          onChange={(e) => setSelectedAcademy(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="전체">전체</option>
                          <option value="이지국어교습소">이지국어교습소</option>
                          <option value="이지수학교습소">이지수학교습소</option>
                        </select>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="text-center py-8">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button 
                          onClick={fetchStudents}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          다시 시도
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto h-[400px] overflow-y-auto">
                        <Table className="w-auto border border-gray-200">
                          <TableHeader className="sticky top-0 bg-white z-10">
                            <TableRow>
                              <TableHead className="w-auto">학생명</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStudents.map((student) => {
                              const messageCount = studentMessageCounts[student.id] || 0;
                              const getBadgeColor = (count: number) => {
                                if (count >= 20) return 'bg-blue-500 text-white';
                                if (count >= 10) return 'bg-yellow-500 text-white';
                                return 'bg-red-500 text-white';
                              };
                              
                              return (
                                <TableRow key={student.id}>
                                  <TableCell className="w-auto py-1">
                                    <div 
                                      className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-50 transition-colors duration-200 p-1 rounded ${
                                        selectedStudent === student.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                                      }`}
                                      onClick={() => handleStudentClick(student.id)}
                                    >
                                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-medium text-blue-600">
                                          {student.name?.charAt(0) || '?'}
                                        </span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className={`font-medium text-xs truncate ${
                                          selectedStudent === student.id ? 'text-blue-700' : 'text-gray-900'
                                        }`}>
                                          {student.name || 'N/A'}
                                        </div>
                                      </div>
                                      {messageCount > 0 && (
                                        <Badge className={`h-5 min-w-[20px] px-1.5 text-[10px] font-bold rounded-full ${getBadgeColor(messageCount)}`}>
                                          {messageCount}
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 중앙: 학습정보 입력 */}
              <div className="col-span-4">
                <Card>
                  <CardContent className="space-y-6 pt-0">
                    {/* 출결사항 */}
                    <div className="space-y-3">
                      <Label>출결사항</Label>
                      <RadioGroup value={learningInfo.attendance} onValueChange={(value) => handleLearningInfoChange('attendance', value)} className="flex flex-row gap-2">
                        <div className="flex-1">
                          <RadioGroupItem value="attendance" id="attendance-attendance" className="sr-only" />
                          <Label 
                            htmlFor="attendance-attendance" 
                            className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md border cursor-pointer transition-all duration-200 ${
                              learningInfo.attendance === 'attendance' 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            출석
                          </Label>
                        </div>
                        <div className="flex-1">
                          <RadioGroupItem value="late" id="attendance-late" className="sr-only" />
                          <Label 
                            htmlFor="attendance-late" 
                            className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md border cursor-pointer transition-all duration-200 ${
                              learningInfo.attendance === 'late' 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            지각
                          </Label>
                        </div>
                        <div className="flex-1">
                          <RadioGroupItem value="absent" id="attendance-absent" className="sr-only" />
                          <Label 
                            htmlFor="attendance-absent" 
                            className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md border cursor-pointer transition-all duration-200 ${
                              learningInfo.attendance === 'absent' 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            결석
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 수업태도 */}
                    <div className="space-y-3">
                      <Label>수업태도</Label>
                      <RadioGroup value={learningInfo.classAttitude} onValueChange={(value) => handleLearningInfoChange('classAttitude', value)} className="flex flex-row gap-2">
                        <div className="flex-1">
                          <RadioGroupItem value="excellent" id="classAttitude-excellent" className="sr-only" />
                          <Label 
                            htmlFor="classAttitude-excellent" 
                            className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md border cursor-pointer transition-all duration-200 ${
                              learningInfo.classAttitude === 'excellent' 
                                ? 'bg-green-600 text-white border-green-600 shadow-md' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            우수
                          </Label>
                        </div>
                        <div className="flex-1">
                          <RadioGroupItem value="average" id="classAttitude-average" className="sr-only" />
                          <Label 
                            htmlFor="classAttitude-average" 
                            className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md border cursor-pointer transition-all duration-200 ${
                              learningInfo.classAttitude === 'average' 
                                ? 'bg-green-600 text-white border-green-600 shadow-md' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            보통
                          </Label>
                        </div>
                        <div className="flex-1">
                          <RadioGroupItem value="poor" id="classAttitude-poor" className="sr-only" />
                          <Label 
                            htmlFor="classAttitude-poor" 
                            className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md border cursor-pointer transition-all duration-200 ${
                              learningInfo.classAttitude === 'poor' 
                                ? 'bg-green-600 text-white border-green-600 shadow-md' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            미흡
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 과제제출 */}
                    <div className="space-y-3">
                      <Label>과제제출</Label>
                      <RadioGroup value={learningInfo.homeworkSubmission} onValueChange={(value) => handleLearningInfoChange('homeworkSubmission', value)} className="flex flex-row gap-2">
                        <div className="flex-1">
                          <RadioGroupItem value="submitted" id="homeworkSubmission-submitted" className="sr-only" />
                          <Label 
                            htmlFor="homeworkSubmission-submitted" 
                            className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md border cursor-pointer transition-all duration-200 ${
                              learningInfo.homeworkSubmission === 'submitted' 
                                ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            제출
                          </Label>
                        </div>
                        <div className="flex-1">
                          <RadioGroupItem value="not_submitted" id="homeworkSubmission-not_submitted" className="sr-only" />
                          <Label 
                            htmlFor="homeworkSubmission-not_submitted" 
                            className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md border cursor-pointer transition-all duration-200 ${
                              learningInfo.homeworkSubmission === 'not_submitted' 
                                ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            미제출
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 과제성실도 */}
                    <div className="space-y-3">
                      <Label>과제성실도</Label>
                      <RadioGroup value={learningInfo.homeworkQuality} onValueChange={(value) => handleLearningInfoChange('homeworkQuality', value)} className="flex flex-row gap-2">
                        <div className="flex-1">
                          <RadioGroupItem value="excellent" id="homeworkQuality-excellent" className="sr-only" />
                          <Label 
                            htmlFor="homeworkQuality-excellent" 
                            className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md border cursor-pointer transition-all duration-200 ${
                              learningInfo.homeworkQuality === 'excellent' 
                                ? 'bg-orange-600 text-white border-orange-600 shadow-md' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            우수
                          </Label>
                        </div>
                        <div className="flex-1">
                          <RadioGroupItem value="average" id="homeworkQuality-average" className="sr-only" />
                          <Label 
                            htmlFor="homeworkQuality-average" 
                            className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md border cursor-pointer transition-all duration-200 ${
                              learningInfo.homeworkQuality === 'average' 
                                ? 'bg-orange-600 text-white border-orange-600 shadow-md' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            보통
                          </Label>
                        </div>
                        <div className="flex-1">
                          <RadioGroupItem value="poor" id="homeworkQuality-poor" className="sr-only" />
                          <Label 
                            htmlFor="homeworkQuality-poor" 
                            className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md border cursor-pointer transition-all duration-200 ${
                              learningInfo.homeworkQuality === 'poor' 
                                ? 'bg-orange-600 text-white border-orange-600 shadow-md' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            미흡
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 테스트점수 */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="testScore">테스트 점수 :</Label>
                        <Input
                          id="testScore"
                          type="number"
                          placeholder="점수 입력"
                          value={learningInfo.testScore}
                          onChange={(e) => handleLearningInfoChange('testScore', e.target.value)}
                          className="w-24"
                        />
                        <span className="text-sm text-gray-500">점</span>
                        <button
                          onClick={fetchWorksheets}
                          disabled={loadingWorksheets || !selectedStudent}
                          className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                        >
                          {loadingWorksheets ? '로딩 중...' : '매쓰플랫'}
                        </button>
                      </div>
                    </div>

                    {/* 미리보기 작성 버튼 */}
                    <div className="pt-2 flex gap-2">
                      <button 
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 cursor-pointer"
                        onClick={handlePreviewCreate}
                      >
                        미리보기 작성
                      </button>
                      <button 
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handlePreviewWithMathflat}
                        disabled={loadingWorksheets || !selectedStudent}
                      >
                        {loadingWorksheets ? '로딩 중...' : '미리보기+매쓰플랫'}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 우측: 문자 메시지 작성 */}
              <div className="col-span-5">
                <Card>
                  <CardHeader>
                    <CardTitle>학부모 문자 메시지</CardTitle>
                    <CardDescription>
                      선택된 학생의 학습정보를 바탕으로 문자 메시지를 작성합니다
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="message">메시지 내용</Label>
                        <Textarea
                          id="message"
                          placeholder="1) 학생 목록에서 학생 선택
                          2) 학습 정보 선택"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          className="min-h-[300px] resize-none"
                        />
                      </div>
                      <div className="flex justify-between">
                        <div className="flex gap-2">
                        <button 
                          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer transition-colors duration-200"
                          onClick={handleReset}
                        >
                          초기화
                        </button>
                          <button 
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 cursor-pointer transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleAIReport}
                            disabled={isGeneratingAI}
                          >
                            <Sparkles className="h-4 w-4" />
                            {isGeneratingAI ? `AI 생성 중... ${aiElapsedTime}초` : 'AI 리포트'}
                          </button>
                        </div>
                        <button 
                          className="px-4 py-2 bg-[#FEE500] text-[#3C1E1E] rounded hover:bg-[#FFEB3B] cursor-pointer transition-colors duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleKakaoSend}
                          disabled={isSending}
                        >
                          <MessageCircle className="h-4 w-4" />
                          {isSending ? '전송 중...' : '카카오톡 전송'}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 발송된 메시지 영역 - 학생 선택 시 전체 너비로 표시 */}
            {selectedStudent && (
              <div className="mt-6">
                <div className="grid grid-cols-12 gap-6">
                  {/* 좌측: 메시지 목록 */}
                  <div className="col-span-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" />
                          발송된 메시지
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingHistory ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        ) : messageHistory.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            발송된 메시지가 없습니다
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {messageHistory.map((msg) => (
                              <div
                                key={msg.id}
                                onClick={() => setSelectedMessage(selectedMessage === msg.id ? null : msg.id)}
                                className={`p-3 rounded border cursor-pointer transition-colors ${
                                  selectedMessage === msg.id 
                                    ? 'bg-blue-50 border-blue-300' 
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <div className="text-sm font-medium text-gray-700">
                                  {new Date(msg.created_at).toLocaleDateString('ko-KR')} {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* 우측: 메시지 내용 */}
                  {selectedMessage && (
                    <div className="col-span-8">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <MessageCircle className="h-4 w-4" />
                              메시지 내용
                            </CardTitle>
                            <button
                              onClick={() => setSelectedMessage(null)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {messageHistory.find(msg => msg.id === selectedMessage) && (
                            <div className="text-sm text-gray-700 whitespace-pre-line p-4 bg-gray-50 rounded border border-gray-200 min-h-[400px]">
                              {messageHistory.find(msg => msg.id === selectedMessage)?.message_content}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 학습지 모달 */}
            {showWorksheetModal && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                onClick={() => setShowWorksheetModal(false)}
              >
                <div 
                  className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] mx-4 flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 모달 헤더 */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">매쓰플랫 학습지 현황</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddWorksheetToMessage}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                      >
                        메시지 넣기
                      </button>
                      <button
                        onClick={() => setShowWorksheetModal(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* 모달 내용 */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {worksheets.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        학습지 데이터가 없습니다
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">번호</TableHead>
                            <TableHead>출제일</TableHead>
                            <TableHead>학년</TableHead>
                            <TableHead>학습지명</TableHead>
                            <TableHead className="w-24">점수</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {worksheets.map((ws, index) => (
                            <TableRow key={ws.id}>
                              <TableCell className="text-center">{index + 1}</TableCell>
                              <TableCell>
                                {ws.issued_date 
                                  ? new Date(ws.issued_date).toLocaleDateString('ko-KR')
                                  : new Date(ws.crawled_at).toLocaleDateString('ko-KR')}
                              </TableCell>
                              <TableCell>{ws.grade}</TableCell>
                              <TableCell className="max-w-md truncate">{ws.worksheet_name}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={
                                  (() => {
                                    if (ws.score === '채점' || ws.score === '이어 채점' || ws.score.includes('채점')) {
                                      return 'bg-gray-500 text-white';
                                    }
                                    const scoreNum = parseInt(ws.score);
                                    if (isNaN(scoreNum)) return 'bg-gray-400 text-white';
                                    if (scoreNum >= 90) return 'bg-green-500 text-white';
                                    if (scoreNum >= 70) return 'bg-yellow-500 text-white';
                                    return 'bg-red-500 text-white';
                                  })()
                                }>
                                  {ws.score}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </AdminLayout>
  );
}
