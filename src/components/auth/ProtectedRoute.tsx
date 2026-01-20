'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasHydrated } = useAuthStore();

  useEffect(() => {
    // 하이드레이션 완료 전에는 인증 체크를 하지 않음
    if (!hasHydrated) return;

    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [hasHydrated, isAuthenticated, isLoading, router]);

  // 하이드레이션 대기 중이거나 로딩 중일 때
  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 리다이렉트 중
  }

  return <>{children}</>;
}




