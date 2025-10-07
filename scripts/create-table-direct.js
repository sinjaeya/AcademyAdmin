const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 환경변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMessageHistoryTable() {
  try {
    console.log('🚀 메시지 히스토리 테이블 생성을 시작합니다...');

    // SQL 스크립트 읽기
    const fs = require('fs');
    const sqlContent = fs.readFileSync('scripts/create-message-history-table.sql', 'utf8');

    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('❌ 테이블 생성 중 오류 발생:', error);
      return;
    }

    console.log('✅ 메시지 히스토리 테이블이 성공적으로 생성되었습니다!');
    console.log('📊 테이블 구조:');
    console.log('   - id: UUID (Primary Key)');
    console.log('   - student_id: UUID (Foreign Key to student table)');
    console.log('   - student_name: TEXT');
    console.log('   - message_content: TEXT');
    console.log('   - attendance: TEXT');
    console.log('   - class_attitude: TEXT');
    console.log('   - homework_submission: TEXT');
    console.log('   - homework_quality: TEXT');
    console.log('   - test_score: INTEGER');
    console.log('   - sent_at: TIMESTAMP');
    console.log('   - created_at: TIMESTAMP');
    console.log('   - updated_at: TIMESTAMP');

  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err);
  }
}

createMessageHistoryTable();
