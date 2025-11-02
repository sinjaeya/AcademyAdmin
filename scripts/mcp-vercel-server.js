#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// Vercel 환경 변수
const vercelToken = process.env.VERCEL_TOKEN;
const vercelTeamId = process.env.VERCEL_TEAM_ID;

// MCP 서버 생성
const server = new Server(
  {
    name: 'vercel-mcp-server',
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
        name: 'list_projects',
        description: 'Vercel 프로젝트 목록을 조회합니다',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_project',
        description: '특정 Vercel 프로젝트 정보를 조회합니다',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: {
              type: 'string',
              description: '프로젝트 ID 또는 이름',
            },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'list_deployments',
        description: '프로젝트의 배포 목록을 조회합니다',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: {
              type: 'string',
              description: '프로젝트 ID 또는 이름',
            },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'get_deployment',
        description: '특정 배포 정보를 조회합니다',
        inputSchema: {
          type: 'object',
          properties: {
            deployment_id: {
              type: 'string',
              description: '배포 ID',
            },
          },
          required: ['deployment_id'],
        },
      },
    ],
  };
});

// 도구 호출 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!vercelToken) {
    throw new Error('VERCEL_TOKEN 환경변수가 설정되지 않았습니다.');
  }

  const headers = {
    'Authorization': `Bearer ${vercelToken}`,
    'Content-Type': 'application/json',
  };

  const baseUrl = vercelTeamId
    ? `https://api.vercel.com/v9/teams/${vercelTeamId}`
    : 'https://api.vercel.com/v9';

  try {
    switch (name) {
      case 'list_projects': {
        const response = await fetch(`${baseUrl}/projects`, { headers });
        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_project': {
        const { project_id } = args;
        const response = await fetch(`${baseUrl}/projects/${project_id}`, { headers });
        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'list_deployments': {
        const { project_id } = args;
        const response = await fetch(`${baseUrl}/projects/${project_id}/deployments`, { headers });
        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_deployment': {
        const { deployment_id } = args;
        const response = await fetch(`${baseUrl}/deployments/${deployment_id}`, { headers });
        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`알 수 없는 도구: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `오류 발생: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Vercel MCP 서버가 시작되었습니다.');
}

main().catch((error) => {
  console.error('서버 시작 오류:', error);
  process.exit(1);
});

