#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 샘플 환경변수 파일 생성
function createSampleEnv() {
  const envContent = `# Supabase 설정
# 아래 값들을 실제 Supabase 프로젝트 정보로 변경해주세요
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Next.js 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
`;

  const envPath = path.join(process.cwd(), '.env.local.example');
  fs.writeFileSync(envPath, envContent);
  
  console.log('📝 .env.local.example 파일이 생성되었습니다.');
  console.log('📁 파일 위치:', envPath);
  console.log('\n🔧 다음 단계:');
  console.log('1. .env.local.example 파일을 .env.local로 복사');
  console.log('2. Supabase 프로젝트 정보로 값들을 수정');
  console.log('3. npm run dev 실행');
  
  return envPath;
}

// .env.local 파일이 있는지 확인
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  return fs.existsSync(envPath);
}

// 메인 실행
function main() {
  console.log('🚀 Next.js Admin Panel - Supabase 설정 도우미\n');
  
  if (checkEnvFile()) {
    console.log('✅ .env.local 파일이 이미 존재합니다.');
    console.log('📁 파일 위치:', path.join(process.cwd(), '.env.local'));
    console.log('\n🔄 서버를 실행하려면: npm run dev');
    return;
  }
  
  console.log('📋 Supabase 설정이 필요합니다.');
  console.log('1. Supabase 프로젝트 생성: https://supabase.com');
  console.log('2. API 키 확인: Settings → API');
  console.log('3. 아래 명령어로 설정 파일 생성\n');
  
  createSampleEnv();
  
  console.log('\n💡 자동 설정을 원하시면: npm run setup');
}

if (require.main === module) {
  main();
}

module.exports = { createSampleEnv, checkEnvFile };




