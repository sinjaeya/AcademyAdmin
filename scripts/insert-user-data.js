#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// .env.local 파일에서 환경변수 읽기
require('dotenv').config({ path: '.env.local' });

async function showInsertSQL() {
  console.log('🚀 admin@example.com 사용자 데이터 삽입 SQL을 실행합니다...\n');

  try {
    // 환경변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('.env.local 파일에 Supabase 설정이 없습니다.');
    }

    console.log('📋 다음 SQL 스크립트를 Supabase SQL Editor에서 실행해주세요:\n');
    console.log('=' * 80);
    
    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'insert-admin-user.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log(sqlContent);
    console.log('=' * 80);
    
    console.log('\n📝 실행 방법:');
    console.log('1. Supabase 대시보드 > SQL Editor 접속');
    console.log('2. 위의 SQL 스크립트를 복사해서 붙여넣기');
    console.log('3. "Run" 버튼 클릭하여 실행');
    console.log('4. 결과를 확인하고 성공 메시지가 나오면 완료!');
    
    console.log('\n🔗 Supabase 대시보드: ' + process.env.NEXT_PUBLIC_SUPABASE_URL.replace('/rest/v1', ''));
    console.log('\n✅ 실행 완료 후 브라우저를 새로고침하면 대시보드에 접근할 수 있습니다!');

  } catch (error) {
    console.error('\n❌ 오류가 발생했습니다:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  showInsertSQL();
}

module.exports = { showInsertSQL };
