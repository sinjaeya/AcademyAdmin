'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  // 개발 모드 체크 - 임시로 항상 true로 설정 (테스트용)
  const isDevelopment = true; // 개발 모드에서 항상 표시

  // 페이지 로딩 완료 후 DOM에 직접 기본값 설정
  useEffect(() => {
    const setDefaultValues = () => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      
      if (emailInput && !emailInput.value) {
        emailInput.value = 'admin@example.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        setEmail('admin@example.com');
      }
      
      if (passwordInput && !passwordInput.value) {
        passwordInput.value = 'password1234';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        setPassword('password1234');
      }
    };

    // 페이지 로딩 완료 후 기본값 설정
    const timer = setTimeout(setDefaultValues, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit 함수 호출됨!');
    e.preventDefault();
    
    // DOM에서 직접 값 가져오기
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    const emailValue = emailInput?.value || '';
    const passwordValue = passwordInput?.value || '';
    
    console.log('폼 제출됨:', emailValue, passwordValue);
    
    if (!emailValue || !passwordValue) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    
    setError(null);
    const result = await login(emailValue, passwordValue);
    
    console.log('로그인 결과:', result);
    
    if (result.success) {
      router.push('/admin');
    } else {
      if (result.error?.message?.includes('Supabase가 설정되지 않았습니다')) {
        setError('Supabase가 설정되지 않았습니다. 먼저 설정 페이지에서 Supabase 정보를 입력해주세요.');
      } else {
        setError(result.error?.message || '로그인에 실패했습니다.');
      }
    }
  };

  // 개발자 로그인 함수 추가
  const handleDevLogin = async () => {
    try {
      console.log('개발자 로그인 시작');
      setError(null);
      
      if (!login) {
        console.error('login 함수가 정의되지 않았습니다');
        setError('로그인 함수를 찾을 수 없습니다.');
        return;
      }
      
      const result = await login('admin@example.com', 'password1234');
      
      console.log('개발자 로그인 결과:', result);
      
      if (result && result.success) {
        router.push('/admin');
      } else {
        setError(result?.error?.message || '개발자 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('개발자 로그인 에러:', error);
      setError('로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>로그인</CardTitle>
        <CardDescription>
          이메일과 비밀번호를 입력해주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              defaultValue="admin@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                defaultValue="password1234"
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </Button>

          {/* 개발자 로그인 버튼 - 항상 표시 (테스트용) */}
          <Button
            type="button"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
            disabled={isLoading}
            onClick={handleDevLogin}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                개발자 로그인 중...
              </>
            ) : (
              '🔴 개발자 로그인 🔴'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            비밀번호를 잊으셨나요?{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 font-medium"
              onClick={() => {
                // 비밀번호 재설정 기능 구현 예정
                alert('비밀번호 재설정 기능은 준비 중입니다.');
              }}
            >
              비밀번호 재설정
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
