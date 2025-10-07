#!/usr/bin/env node

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { spawn } = require('child_process');
const path = require('path');

async function createMCPClient() {
  console.log('🚀 MCP 클라이언트를 생성합니다...\n');

  // MCP 서버 프로세스 시작
  const serverProcess = spawn('node', [path.join(__dirname, 'mcp-server.js')], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // MCP 클라이언트 생성
  const transport = new StdioClientTransport({
    stdin: serverProcess.stdin,
    stdout: serverProcess.stdout
  });

  const client = new Client({
    name: 'supabase-mcp-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    // 서버에 연결
    await client.connect(transport);
    console.log('✅ MCP 서버에 연결되었습니다.\n');

    // 사용 가능한 도구 목록 조회
    const tools = await client.listTools();
    console.log('📋 사용 가능한 도구:');
    tools.tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
    console.log('');

    return client;
  } catch (error) {
    console.error('❌ MCP 클라이언트 연결 실패:', error);
    throw error;
  }
}

async function testSupabaseConnection() {
  console.log('🔍 Supabase 연결을 테스트합니다...\n');

  try {
    const client = await createMCPClient();

    // 1. user_role 테이블 존재 확인
    console.log('1️⃣ user_role 테이블 존재 확인...');
    const tableCheck = await client.callTool({
      name: 'check_table_exists',
      arguments: { table_name: 'user_role' }
    });
    console.log(tableCheck.content[0].text);
    console.log('');

    // 2. admin@example.com 사용자 정보 조회
    console.log('2️⃣ admin@example.com 사용자 정보 조회...');
    const userQuery = await client.callTool({
      name: 'query_user_role',
      arguments: { user_id: 'daacce13-eb9c-4822-87d2-088f2b8a529e' }
    });
    console.log(userQuery.content[0].text);
    console.log('');

    console.log('✅ MCP 테스트가 완료되었습니다!');

  } catch (error) {
    console.error('❌ MCP 테스트 실패:', error);
  }
}

// 테스트 실행
if (require.main === module) {
  testSupabaseConnection();
}

module.exports = { createMCPClient };
