import { createClient } from '@supabase/supabase-js'
import { env, validateEnvironment, logEnvironmentStatus } from '@/lib/env'

// 환경변수 검증 (클라이언트 사이드에서는 일부만 검증)
if (typeof window === 'undefined') {
  // 서버 사이드에서만 전체 검증
  try {
    validateEnvironment()
  } catch (error) {
    console.error(error instanceof Error ? error.message : '환경변수 검증 실패')
  }
} else {
  // 클라이언트 사이드에서는 상태만 로그
  logEnvironmentStatus()
}

// 클라이언트 사이드용 Supabase 클라이언트
export const supabase = env.supabase.url && env.supabase.anonKey 
  ? createClient(env.supabase.url, env.supabase.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null

// 서버 사이드용 Supabase 클라이언트 (Service Role Key 사용)
export const supabaseAdmin = env.supabase.url && env.supabase.serviceRoleKey
  ? createClient(
      env.supabase.url,
      env.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null
