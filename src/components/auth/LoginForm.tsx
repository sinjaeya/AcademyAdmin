'use client';

import { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit 함수 호출됨!');
    e.preventDefault();
    console.log('폼 제출됨:', email, password);
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    
    setError(null);
    const result = await login(email, password);
    
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
              value={email}
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
                value={password}
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
