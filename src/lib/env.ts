// 환경변수 검증 및 설정
export const env = {
  // Supabase 설정
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // 환경 정보
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// 환경변수 검증 함수
export function validateEnvironment() {
  const errors: string[] = [];
  
  if (!env.supabase.url) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
  }
  
  if (!env.supabase.anonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.');
  }
  
  // Service Role Key는 선택적 (사용자 생성 기능이 필요한 경우에만)
  if (!env.supabase.serviceRoleKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. 사용자 생성 기능이 제한됩니다.');
  }
  
  if (errors.length > 0) {
    const errorMessage = [
      '❌ 환경변수 설정 오류:',
      ...errors.map(error => `  - ${error}`),
      '',
      '📋 해결 방법:',
      '1. .env.local 파일을 생성하세요',
      '2. .env.example 파일을 참고하여 필요한 환경변수를 설정하세요',
      '3. Supabase 프로젝트에서 URL과 키를 확인하세요',
      '',
      '🔗 Supabase 설정: https://supabase.com/dashboard'
    ].join('\n');
    
    throw new Error(errorMessage);
  }
  
  return true;
}

// 개발 환경에서만 환경변수 상태를 콘솔에 출력
export function logEnvironmentStatus() {
  if (env.isDevelopment) {
    console.log('🔧 환경변수 상태:', {
      supabaseUrl: env.supabase.url ? '✅ 설정됨' : '❌ 없음',
      supabaseAnonKey: env.supabase.anonKey ? '✅ 설정됨' : '❌ 없음',
      supabaseServiceKey: env.supabase.serviceRoleKey ? '✅ 설정됨' : '❌ 없음',
      nodeEnv: env.nodeEnv,
    });
  }
}
