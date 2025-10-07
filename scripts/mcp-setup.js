require('dotenv').config();

console.log('🚀 Supabase MCP 설정을 시작합니다...\n');

// MCP 설정 정보
const mcpConfig = {
  name: 'supabase-mcp',
  version: '1.0.0',
  description: 'Supabase MCP 서버 설정',
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mhorwnwhcyxynfxmlhit.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ob3J3bndoY3l4eW5meG1saGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NTg4NjcsImV4cCI6MjA0NzQzNDg2N30.FjLqBqN3KqKqKqKqKqKqKqKqKqKqKqKqKqKqKqK'
  }
};

console.log('📋 MCP 설정 정보:');
console.log(`- 서버 이름: ${mcpConfig.name}`);
console.log(`- Supabase URL: ${mcpConfig.supabase.url}`);
console.log(`- 버전: ${mcpConfig.version}\n`);

// MCP 서버 설정 파일 생성
const fs = require('fs');
const path = require('path');

const mcpServerConfig = {
  mcpServers: {
    supabase: {
      command: "node",
      args: [path.join(__dirname, "mcp-server.js")],
      env: {
        SUPABASE_URL: mcpConfig.supabase.url,
        SUPABASE_ANON_KEY: mcpConfig.supabase.anonKey
      }
    }
  }
};

// MCP 서버 설정 파일 저장
fs.writeFileSync(
  path.join(__dirname, '..', 'mcp-config.json'),
  JSON.stringify(mcpServerConfig, null, 2)
);

console.log('✅ MCP 설정 파일이 생성되었습니다: mcp-config.json');
console.log('\n📝 다음 단계:');
console.log('1. MCP 서버 스크립트를 생성합니다');
console.log('2. MCP 클라이언트를 설정합니다');
console.log('3. Supabase 연결을 테스트합니다');
console.log('\n🔗 참고 링크:');
console.log('- MCP 공식 문서: https://modelcontextprotocol.io/');
console.log('- Supabase MCP: https://github.com/modelcontextprotocol/servers/tree/main/src/supabase');
