import { NextResponse } from 'next/server';

// 로그아웃 처리 - 세션 쿠키 삭제
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set('admin-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0 // 즉시 만료
  });

  return response;
}
