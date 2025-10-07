#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupSupabase() {
  console.log('🚀 Supabase 설정을 시작합니다...\n');

  try {
    // Supabase URL 입력
    const supabaseUrl = await question('Supabase URL을 입력하세요 (https://your-project.supabase.co): ');
    if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
      throw new Error('올바른 Supabase URL을 입력해주세요.');
    }

    // Supabase Anon Key 입력
    const supabaseAnonKey = await question('Supabase Anon Key를 입력하세요: ');
    if (!supabaseAnonKey || !supabaseAnonKey.startsWith('eyJ')) {
      throw new Error('올바른 Supabase Anon Key를 입력해주세요.');
    }

    // Service Role Key 입력
    const serviceRoleKey = await question('Supabase Service Role Key를 입력하세요: ');
    if (!serviceRoleKey || !serviceRoleKey.startsWith('eyJ')) {
      throw new Error('올바른 Supabase Service Role Key를 입력해주세요.');
    }

    // NextAuth Secret 생성
    const nextAuthSecret = generateRandomSecret();
    console.log(`\n📝 NextAuth Secret이 자동 생성되었습니다: ${nextAuthSecret}`);

    // 환경변수 파일 내용 생성
    const envContent = `# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}

# Next.js 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${nextAuthSecret}
`;

    // .env.local 파일 생성
    const envPath = path.join(process.cwd(), '.env.local');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ .env.local 파일이 성공적으로 생성되었습니다!');
    console.log('📁 파일 위치:', envPath);
    console.log('\n🔄 이제 서버를 재시작해주세요:');
    console.log('   npm run dev');
    console.log('\n🌐 브라우저에서 http://localhost:3000 에 접속하세요.');

  } catch (error) {
    console.error('\n❌ 오류가 발생했습니다:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function generateRandomSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 스크립트 실행
if (require.main === module) {
  setupSupabase();
}

module.exports = { setupSupabase };




