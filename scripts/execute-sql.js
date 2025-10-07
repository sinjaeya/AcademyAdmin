#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// .env.local 파일에서 환경변수 읽기
require('dotenv').config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function executeSQL() {
  console.log('🚀 SQL 스크립트를 실행합니다...\n');

  try {
    // 환경변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('.env.local 파일에 Supabase 설정이 없습니다. 먼저 setup-supabase.js를 실행해주세요.');
    }

    console.log('📋 다음 SQL 스크립트를 Supabase SQL Editor에서 실행해주세요:\n');
    console.log('=' * 80);
    
    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'create-user-role-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log(sqlContent);
    console.log('=' * 80);
    
    console.log('\n📝 실행 방법:');
    console.log('1. Supabase 대시보드에 접속하세요');
    console.log('2. 왼쪽 메뉴에서 "SQL Editor" 클릭');
    console.log('3. 위의 SQL 스크립트를 복사해서 붙여넣기');
    console.log('4. "Run" 버튼 클릭하여 실행');
    console.log('5. 성공 메시지가 표시되면 완료!');
    
    console.log('\n🔗 Supabase 대시보드: ' + process.env.NEXT_PUBLIC_SUPABASE_URL.replace('/rest/v1', ''));

  } catch (error) {
    console.error('\n❌ 오류가 발생했습니다:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  executeSQL();
}

module.exports = { executeSQL };
