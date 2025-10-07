const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경변수 로드
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSqlFile(filePath) {
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    console.log(`📄 ${path.basename(filePath)} 실행 중...`);
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error(`❌ ${path.basename(filePath)} 실행 실패:`, error);
      return false;
    }
    
    console.log(`✅ ${path.basename(filePath)} 실행 완료`);
    return true;
  } catch (err) {
    console.error(`❌ ${path.basename(filePath)} 파일 읽기 오류:`, err.message);
    return false;
  }
}

async function setupAcademySystem() {
  console.log('🚀 학원 시스템 설정을 시작합니다...\n');

  try {
    // 1. academy 테이블 생성
    console.log('1️⃣ Academy 테이블 생성...');
    const academyTableCreated = await executeSqlFile(path.join(__dirname, 'create-academy-table.sql'));
    if (!academyTableCreated) {
      console.error('❌ Academy 테이블 생성에 실패했습니다.');
      return;
    }

    // 2. user_role 테이블 업데이트
    console.log('\n2️⃣ User Role 테이블 업데이트...');
    const userRoleUpdated = await executeSqlFile(path.join(__dirname, 'update-user-role-table.sql'));
    if (!userRoleUpdated) {
      console.error('❌ User Role 테이블 업데이트에 실패했습니다.');
      return;
    }

    // 3. 설정 완료 확인
    console.log('\n3️⃣ 설정 완료 확인...');
    
    // Academy 테이블 확인
    const { data: academyData, error: academyError } = await supabase
      .from('academy')
      .select('*')
      .limit(1);
    
    if (academyError) {
      console.error('❌ Academy 테이블 확인 실패:', academyError);
      return;
    }
    
    console.log('✅ Academy 테이블 확인 완료');
    if (academyData && academyData.length > 0) {
      console.log(`   - 학원명: ${academyData[0].name}`);
      console.log(`   - 학원 ID: ${academyData[0].id}`);
    }

    // User Role 테이블 확인
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_role')
      .select(`
        *,
        academy:academy_id (
          name
        )
      `)
      .limit(1);
    
    if (userRoleError) {
      console.error('❌ User Role 테이블 확인 실패:', userRoleError);
      return;
    }
    
    console.log('✅ User Role 테이블 확인 완료');
    if (userRoleData && userRoleData.length > 0) {
      console.log(`   - 사용자 역할: ${userRoleData[0].role}`);
      console.log(`   - 학원명: ${userRoleData[0].academy?.name || '없음'}`);
    }

    console.log('\n🎉 학원 시스템 설정이 완료되었습니다!');
    console.log('\n📋 다음 단계:');
    console.log('1. 애플리케이션을 재시작하세요');
    console.log('2. 관리자로 로그인하여 학원 정보가 올바르게 표시되는지 확인하세요');
    console.log('3. 다른 테이블(students, payments 등)에도 academy_id 컬럼을 추가하세요');

  } catch (error) {
    console.error('❌ 학원 시스템 설정 중 오류 발생:', error);
  }
}

// 스크립트 실행
setupAcademySystem();
