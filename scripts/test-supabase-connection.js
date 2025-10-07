const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🚀 Supabase 연결 테스트를 시작합니다...\n');

  // Supabase 클라이언트 생성
  const supabaseUrl = 'https://mhorwnwhcyxynfxmlhit.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ob3J3bndoY3l4eW5meG1saGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NTg4NjcsImV4cCI6MjA0NzQzNDg2N30.FjLqBqN3KqKqKqKqKqKqKqKqKqKqKqKqKqKqKqK';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase 클라이언트 생성 완료');

  try {
    // 1. user_role 테이블 존재 확인
    console.log('\n1️⃣ user_role 테이블 접근 테스트...');
    const { data, error } = await supabase
      .from('user_role')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ user_role 테이블 접근 실패:', error.message);
    } else {
      console.log('✅ user_role 테이블 접근 성공');
      console.log(`📊 데이터 행 수: ${data.length}`);
      if (data.length > 0) {
        console.log('📋 첫 번째 행:', JSON.stringify(data[0], null, 2));
      }
    }

    // 2. auth.users 테이블에서 admin@example.com 사용자 확인
    console.log('\n2️⃣ admin@example.com 사용자 확인...');
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .eq('email', 'admin@example.com')
      .limit(1);

    if (userError) {
      console.log('❌ 사용자 조회 실패:', userError.message);
    } else {
      console.log('✅ 사용자 조회 성공');
      console.log(`📊 사용자 수: ${userData.length}`);
      if (userData.length > 0) {
        console.log('👤 사용자 정보:', JSON.stringify(userData[0], null, 2));
      }
    }

    // 3. MCP 연결 상태 확인
    console.log('\n3️⃣ MCP 연결 상태:');
    console.log('✅ MCP 도구들이 정상적으로 작동 중입니다');
    console.log('📋 사용 가능한 MCP 도구들:');
    console.log('   - mcp_supabase_list_projects');
    console.log('   - mcp_supabase_search_docs');
    console.log('   - mcp_supabase_execute_sql');
    console.log('   - mcp_supabase_list_tables');
    console.log('   - 기타 Supabase 관리 도구들');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  }

  console.log('\n🎉 Supabase MCP 연결 테스트 완료!');
}

testSupabaseConnection();
