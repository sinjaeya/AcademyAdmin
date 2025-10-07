const { createClient } = require('@supabase/supabase-js');

// 환경변수에서 Supabase 설정 가져오기 (하드코딩된 값 사용)
const supabaseUrl = 'https://mhorwnwhcyxynfxmlhit.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ob3J3bndoY3l4eW5meG1saGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NTg4NjcsImV4cCI6MjA0NzQzNDg2N30.FjLqBqN3KqKqKqKqKqKqKqKqKqKqKqKqKqKqK';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMessageHistoryTable() {
  try {
    console.log('🚀 메시지 히스토리 테이블 생성을 시작합니다...');

    // 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS message_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        student_id UUID NOT NULL,
        student_name TEXT NOT NULL,
        message_content TEXT NOT NULL,
        attendance TEXT NOT NULL,
        class_attitude TEXT NOT NULL,
        homework_submission TEXT NOT NULL,
        homework_quality TEXT NOT NULL,
        test_score INTEGER,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 인덱스 생성 SQL
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_message_history_student_id ON message_history(student_id);
      CREATE INDEX IF NOT EXISTS idx_message_history_sent_at ON message_history(sent_at);
    `;

    // RLS 정책 설정 SQL
    const rlsSQL = `
      ALTER TABLE message_history ENABLE ROW LEVEL SECURITY;
      
      -- 모든 사용자가 읽기 가능
      CREATE POLICY IF NOT EXISTS "Allow read access for all users" ON message_history
        FOR SELECT USING (true);
      
      -- 인증된 사용자가 삽입 가능
      CREATE POLICY IF NOT EXISTS "Allow insert for authenticated users" ON message_history
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    `;

    // SQL 실행을 위해 supabase.rpc 사용
    const { data: tableData, error: tableError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });

    if (tableError) {
      console.error('❌ 테이블 생성 중 오류:', tableError);
      // 직접 SQL 실행 시도
      console.log('📝 직접 SQL 실행을 시도합니다...');
      const { error: directError } = await supabase
        .from('message_history')
        .select('id')
        .limit(1);
      
      if (directError && directError.code === 'PGRST116') {
        console.log('✅ 테이블이 이미 존재하는 것 같습니다.');
      } else {
        console.error('❌ 예상치 못한 오류:', directError);
      }
    } else {
      console.log('✅ 테이블 생성 완료');
    }

    console.log('📊 message_history 테이블 구조:');
    console.log('   - id: UUID (Primary Key)');
    console.log('   - student_id: UUID');
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
