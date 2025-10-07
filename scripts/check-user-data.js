#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// .env.local 파일에서 환경변수 읽기
require('dotenv').config({ path: '.env.local' });

async function showCheckSQL() {
  console.log('🔍 user_role 테이블 데이터 확인 SQL을 실행합니다...\n');

  try {
    console.log('📋 다음 SQL 스크립트를 Supabase SQL Editor에서 실행해주세요:\n');
    console.log('=' * 80);
    
    const sqlContent = `-- user_role 테이블 데이터 확인

-- 1. user_role 테이블의 모든 데이터 조회
SELECT * FROM user_role;

-- 2. 특정 사용자 ID로 조회
SELECT * FROM user_role WHERE user_id = 'daacce13-eb9c-4822-87d2-088f2b8a529e';

-- 3. auth.users와 조인해서 이메일과 함께 조회
SELECT 
  ur.id,
  ur.user_id,
  au.email,
  ur.name,
  ur.role,
  ur.academy_name,
  ur.is_active,
  ur.created_at
FROM user_role ur
LEFT JOIN auth.users au ON ur.user_id = au.id;

-- 4. 테이블이 존재하는지 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_role';`;
    
    console.log(sqlContent);
    console.log('=' * 80);
    
    console.log('\n📝 실행 방법:');
    console.log('1. Supabase 대시보드 > SQL Editor 접속');
    console.log('2. 위의 SQL 스크립트를 복사해서 붙여넣기');
    console.log('3. "Run" 버튼 클릭하여 실행');
    console.log('4. 결과를 확인하고 데이터가 있는지 확인!');
    
    console.log('\n🔗 Supabase 대시보드: ' + process.env.NEXT_PUBLIC_SUPABASE_URL.replace('/rest/v1', ''));

  } catch (error) {
    console.error('\n❌ 오류가 발생했습니다:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  showCheckSQL();
}

module.exports = { showCheckSQL };
