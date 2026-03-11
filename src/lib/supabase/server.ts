import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// 서버 컴포넌트용 Supabase 클라이언트
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// 서버 사이드용 Supabase Admin 클라이언트 (Service Role Key 필수)
// auth.admin.createUser 등 관리자 전용 기능에만 사용
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null
