/**
 * 서버 설정 정보를 초기화하는 함수
 * user_role 정보가 없을 때 Supabase 설정을 초기화
 */

export function resetServerConfig() {
  try {
    // localStorage에서 Supabase 설정 제거
    if (typeof window !== 'undefined') {
      // Supabase 관련 설정 키들
      const supabaseKeys = [
        'supabase-url',
        'supabase-anon-key',
        'supabase-service-role-key',
        'supabase-project-id',
        'supabase-database-url',
        'auth-storage', // 인증 정보
        'supabase-storage',
      ];

      supabaseKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // 쿠키에서도 제거
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });

      console.log('서버 설정이 초기화되었습니다.');
    }
  } catch (error) {
    console.error('서버 설정 초기화 중 오류 발생:', error);
  }
}

/**
 * Supabase 클라이언트 재초기화
 */
export function resetSupabaseClient() {
  try {
    if (typeof window !== 'undefined') {
      // 페이지 새로고침으로 클라이언트 재초기화
      window.location.reload();
    }
  } catch (error) {
    console.error('Supabase 클라이언트 재초기화 중 오류 발생:', error);
  }
}
