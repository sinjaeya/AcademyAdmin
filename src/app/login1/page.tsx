'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login1() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex">
      {/* 좌측 영역 - 텍스트와 로그인 폼 */}
      <div className="w-[662px] bg-white flex flex-col justify-center px-[86px]">
        {/* 상단 로고 */}
        <div className="mb-8">
          <h1 className="text-[30px] font-bold text-[#3751FE] font-roboto leading-[1.17]">
            Digital
          </h1>
        </div>

        {/* 메인 제목 */}
        <div className="mb-8">
          <h2 className="text-[36px] font-bold text-[#3751FE] font-open-sans leading-[1.36] mb-4">
            Artificial Intelligence Driving
            <br />
            Results For The Travel Industry
          </h2>
        </div>

        {/* 부제목 */}
        <div className="mb-16">
          <p className="text-[18px] font-normal text-[rgba(0,0,0,0.6)] font-roboto leading-[1.17]">
            Welcome back! Please login to your account.
          </p>
        </div>

        {/* 로그인 폼 */}
        <div className="space-y-6">
          {/* 이메일 입력 */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-[74px] border-[#C1BBBB] border rounded-lg px-4 text-lg focus:border-[#3751FE] focus:ring-[#3751FE]"
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="h-[74px] border-[#C1BBBB] border rounded-lg px-4 text-lg focus:border-[#3751FE] focus:ring-[#3751FE]"
            />
          </div>

          {/* 로그인 버튼들 */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              className="h-[54px] w-[129px] bg-[#3751FE] hover:bg-[#2a3fd4] text-white font-medium rounded-lg shadow-[0px_4px_3px_0px_rgba(0,0,0,0.25)] transition-all duration-200"
            >
              Login
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-[54px] w-[129px] border-[#3751FE] text-[#3751FE] hover:bg-[#3751FE] hover:text-white font-medium rounded-lg transition-all duration-200"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>

      {/* 우측 영역 - 이미지 배경 */}
      <div className="flex-1 bg-[rgba(229,229,229,0.41)] relative overflow-hidden">
        {/* 이미지 배경 */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://s3-alpha.figma.com/thumbnails/3dce32f9-bc57-457d-b5c1-9a1086ec8ce3?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQ4GOSFWC6UK6QLJ2%2F20251002%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20251002T000000Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=87e772668d1c186fd9d43d81f1ff93f214d29bc690266fb65e73ecc339b98fc3')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* 오버레이 */}
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        
        {/* 우측 영역 콘텐츠 (필요시 추가) */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h3 className="text-2xl font-bold mb-4">Welcome to Digital</h3>
            <p className="text-lg opacity-90">Experience the future of travel technology</p>
          </div>
        </div>
      </div>
    </div>
  );
}