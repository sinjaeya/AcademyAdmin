'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { LoginFormData } from '@/types';

export default function Home() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Supabase 클라이언트 가져오기
      const { supabase } = await import('@/lib/supabase/client');
      
      if (!supabase) {
        throw new Error('Supabase 설정이 필요합니다. 환경변수를 확인해주세요.');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // 로그인 성공 - 어드민 페이지로 이동
        router.push('/admin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            학원 관리 시스템 관리자 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            학원 등록 문의는 원장쌤에게 해주세요.
          </p>
        </div>

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
                  placeholder="guest@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pr-10"
                    required
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

              {/* 개발자 로그인 버튼 - 개발 환경에서만 표시 */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={async () => {
                    // 폼 데이터 설정
                    setFormData({
                      email: 'admin@example.com',
                      password: 'password1234'
                    });
                    
                    // 잠시 대기 후 자동 로그인 실행
                    setTimeout(async () => {
                      setError(null);
                      setIsLoading(true);

                      try {
                        // Supabase 클라이언트 가져오기
                        const { supabase } = await import('@/lib/supabase/client');
                        
                        if (!supabase) {
                          throw new Error('Supabase 설정이 필요합니다. 환경변수를 확인해주세요.');
                        }
                        
                        const { data, error } = await supabase.auth.signInWithPassword({
                          email: 'admin@example.com',
                          password: 'password1234',
                        });

                        if (error) {
                          setError(error.message);
                          setIsLoading(false);
                          return;
                        }

                        if (data.user) {
                          // 로그인 성공 - 어드민 페이지로 이동
                          router.push('/admin');
                        }
                      } catch (err) {
                        setError(err instanceof Error ? err.message : '개발자 로그인 중 오류가 발생했습니다.');
                        setIsLoading(false);
                      }
                    }, 100); // 100ms 후 실행
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      개발자 로그인 중...
                    </>
                  ) : (
                    '개발자 로그인'
                  )}
                </Button>
              )}
            </form>

            <div className="mt-6 text-center">
              {/* <p className="text-sm text-gray-600">
                Supabase에서 생성한 계정으로 로그인하세요
              </p>
              <p className="text-xs text-gray-500 mt-1">
                설정이 필요하면: npm run setup
              </p> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
