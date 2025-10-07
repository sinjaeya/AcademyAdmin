import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  try {
    // 현재는 간단한 미들웨어로 구현
    // 실제 인증은 클라이언트 사이드에서 처리하고
    // 서버 컴포넌트에서는 별도의 함수를 통해 사용자 정보를 가져옴
    
    // 관리자 페이지 접근 시 기본적인 리다이렉트만 처리
    if (req.nextUrl.pathname.startsWith('/admin')) {
      // 여기서는 단순히 요청을 통과시키고
      // 실제 인증은 각 페이지에서 처리
      return res
    }

    return res
  } catch (error) {
    console.error('미들웨어 오류:', error)
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
