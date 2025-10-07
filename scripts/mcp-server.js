#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// Supabase 클라이언트 설정
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('SUPABASE_URL과 SUPABASE_ANON_KEY를 설정해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// MCP 서버 생성
const server = new Server(
  {
    name: 'supabase-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 사용 가능한 도구 목록
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_user_role',
        description: 'user_role 테이블에서 사용자 정보를 조회합니다',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: '조회할 사용자의 ID'
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'insert_user_role',
        description: 'user_role 테이블에 새로운 사용자 정보를 삽입합니다',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: '사용자 ID'
            },
            role_id: {
              type: 'string',
              description: '역할 ID'
            },
            name: {
              type: 'string',
              description: '사용자 이름'
            },
            role: {
              type: 'string',
              enum: ['admin', 'owner', 'teacher', 'tutor'],
              description: '사용자 역할'
            },
            academy_name: {
              type: 'string',
              description: '학원 이름'
            },
            is_active: {
              type: 'boolean',
              description: '활성 상태'
            }
          },
          required: ['user_id', 'role_id', 'name', 'role', 'academy_name', 'is_active']
        }
      },
      {
        name: 'check_table_exists',
        description: '특정 테이블이 존재하는지 확인합니다',
        inputSchema: {
          type: 'object',
          properties: {
            table_name: {
              type: 'string',
              description: '확인할 테이블 이름'
            }
          },
          required: ['table_name']
        }
      }
    ]
  };
});

// 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'query_user_role':
        const { data, error } = await supabase
          .from('user_role')
          .select('*')
          .eq('user_id', args.user_id)
          .single();

        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ user_role 조회 실패: ${error.message}`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `✅ user_role 조회 성공:\n${JSON.stringify(data, null, 2)}`
            }
          ]
        };

      case 'insert_user_role':
        const { data: insertData, error: insertError } = await supabase
          .from('user_role')
          .insert([{
            user_id: args.user_id,
            role_id: args.role_id,
            name: args.name,
            role: args.role,
            academy_name: args.academy_name,
            is_active: args.is_active
          }])
          .select()
          .single();

        if (insertError) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ user_role 삽입 실패: ${insertError.message}`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `✅ user_role 삽입 성공:\n${JSON.stringify(insertData, null, 2)}`
            }
          ]
        };

      case 'check_table_exists':
        const { data: tableData, error: tableError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', args.table_name);

        if (tableError) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 테이블 확인 실패: ${tableError.message}`
              }
            ]
          };
        }

        const exists = tableData.length > 0;
        return {
          content: [
            {
              type: 'text',
              text: `📋 테이블 '${args.table_name}' 존재 여부: ${exists ? '✅ 존재함' : '❌ 존재하지 않음'}`
            }
          ]
        };

      default:
        return {
          content: [
            {
              type: 'text',
              text: `❌ 알 수 없는 도구: ${name}`
            }
          ]
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ 오류 발생: ${error.message}`
        }
      ]
    };
  }
});

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Supabase MCP 서버가 시작되었습니다.');
}

main().catch((error) => {
  console.error('❌ MCP 서버 시작 실패:', error);
  process.exit(1);
});
