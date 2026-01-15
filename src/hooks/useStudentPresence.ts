'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// 학생 Presence 상태 타입 (Student App과 동일)
export interface StudentPresenceState {
  student_id: number;
  name: string;
  academy_id: number | null;
  current_page: string;
  current_page_name: string;
  online_at: string;
}

// 훅 반환 타입
interface UseStudentPresenceReturn {
  onlineStudents: Map<number, StudentPresenceState>;
  isOnline: (studentId: number) => boolean;
  getPresence: (studentId: number) => StudentPresenceState | undefined;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

/**
 * Admin App에서 학생들의 Presence 상태를 추적하는 훅
 * Student App의 student-presence 채널을 구독
 */
export function useStudentPresence(academyId?: string | number | null): UseStudentPresenceReturn {
  const [onlineStudents, setOnlineStudents] = useState<Map<number, StudentPresenceState>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    if (!supabase) {
      setConnectionStatus('disconnected');
      return;
    }

    let channel: RealtimeChannel | null = null;

    const setupPresence = (): void => {
      if (!supabase) return;
      // student-presence 채널 구독 (Student App과 동일한 채널)
      channel = supabase.channel('student-presence');

      channel
        .on('presence', { event: 'sync' }, () => {
          if (!channel) return;
          // 전체 상태 동기화
          const state = channel.presenceState();
          const students = new Map<number, StudentPresenceState>();

          // state 구조: { 'student-16': [{ student_id, name, ... }], ... }
          Object.values(state).forEach((presences) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const presenceArray = presences as any[];
            presenceArray.forEach((p) => {
              // 학원 ID 필터링 (설정된 경우)
              if (!academyId || p.academy_id === academyId) {
                students.set(p.student_id, p as StudentPresenceState);
              }
            });
          });

          setOnlineStudents(students);
          console.log('[Admin Presence] 동기화:', students.size, '명 접속 중');
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          // 학생 입장
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const presences = newPresences as any[];
          presences.forEach((p) => {
            if (!academyId || p.academy_id === academyId) {
              console.log('[Admin Presence] 입장:', p.name, '-', p.current_page_name);
              setOnlineStudents((prev) => {
                const next = new Map(prev);
                next.set(p.student_id, p as StudentPresenceState);
                return next;
              });
            }
          });
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          // 학생 퇴장
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const presences = leftPresences as any[];
          presences.forEach((p) => {
            console.log('[Admin Presence] 퇴장:', p.name);
            setOnlineStudents((prev) => {
              const next = new Map(prev);
              next.delete(p.student_id);
              return next;
            });
          });
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
            console.log('[Admin Presence] 구독 완료');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setConnectionStatus('disconnected');
            console.log('[Admin Presence] 연결 끊김:', status);
          }
        });
    };

    setupPresence();

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
        console.log('[Admin Presence] 채널 해제');
      }
    };
  }, [academyId]);

  // 특정 학생이 온라인인지 확인
  const isOnline = useCallback(
    (studentId: number): boolean => {
      return onlineStudents.has(studentId);
    },
    [onlineStudents]
  );

  // 특정 학생의 Presence 정보 가져오기
  const getPresence = useCallback(
    (studentId: number): StudentPresenceState | undefined => {
      return onlineStudents.get(studentId);
    },
    [onlineStudents]
  );

  return {
    onlineStudents,
    isOnline,
    getPresence,
    connectionStatus,
  };
}
