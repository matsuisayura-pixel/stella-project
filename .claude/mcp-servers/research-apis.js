#!/usr/bin/env node

/**
 * Research APIs MCP Server
 *
 * 統合リサーチAPI（Tavily/SerpAPI/Brave/NewsAPI/Perplexity）へのアクセスを提供
 *
 * 環境変数:
 * - TAVILY_API_KEY
 * - SERPAPI_KEY
 * - BRAVE_API_KEY
 * - NEWSAPI_KEY
 * - PERPLEXITY_API_KEY
 */

const https = require('https');
const http = require('http');

// API Configurations
const API_CONFIG = {
  tavily: {
    name: 'Tavily',
    description: 'AI検索特化、高精度セマンティック検索',
    envKey: 'TAVILY_API_KEY',
    endpoint: 'api.tavily.com',
    path: '/search',
    method: 'POST'
  },
  serpapi: {
    name: 'SerpAPI',
    description: 'Google検索結果取得',
    envKey: 'SERPAPI_KEY',
    endpoint: 'serpapi.com',
    path: '/search.json',
    method: 'GET'
  },
  brave: {
    name: 'Brave Search',
    description: 'プライバシー重視、広範囲Web検索',
    envKey: 'BRAVE_API_KEY',
    endpoint: 'api.search.brave.com',
    path: '/res/v1/web/search',
    method: 'GET'
  },
  newsapi: {
    name: 'NewsAPI',
    description: 'ニュース集約',
    envKey: 'NEWSAPI_KEY',
    endpoint: 'newsapi.org',
    path: '/v2/everything',
    method: 'GET'
  },
  perplexity: {
    name: 'Perplexity',
    description: 'AI検索+要約',
    envKey: 'PERPLEXITY_API_KEY',
    endpoint: 'api.perplexity.ai',
    path: '/chat/completions',
    method: 'POST'
  }
};

// MCP Server Implementation
class ResearchAPIsServer {
  constructor() {
    this.tools = this.defineTools();
  }

  defineTools() {
    return [
      {
        name: 'tavily_search',
        description: 'Tavily AIで高精度セマンティック検索を実行',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '検索クエリ' },
            search_depth: { type: 'string', enum: ['basic', 'advanced'], default: 'advanced' },
            include_answer: { type: 'boolean', default: true },
            max_results: { type: 'number', default: 10 }
          },
          required: ['query']
        }
      },
      {
        name: 'serpapi_search',
        description: 'SerpAPIでGoogle検索結果を取得',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '検索クエリ' },
            engine: { type: 'string', default: 'google' },
            num: { type: 'number', default: 10 }
          },
          required: ['query']
        }
      },
      {
        name: 'brave_search',
        description: 'Brave Searchで広範囲Web検索',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '検索クエリ' },
            count: { type: 'number', default: 10 }
          },
          required: ['query']
        }
      },
      {
        name: 'newsapi_search',
        description: 'NewsAPIで最新ニュースを検索',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '検索クエリ' },
            sortBy: { type: 'string', enum: ['publishedAt', 'relevancy', 'popularity'], default: 'publishedAt' },
            pageSize: { type: 'number', default: 10 }
          },
          required: ['query']
        }
      },
      {
        name: 'perplexity_search',
        description: 'Perplexity AIで検索と要約を実行',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '検索クエリ' },
            model: { type: 'string', default: 'llama-3.1-sonar-large-128k-online' }
          },
          required: ['query']
        }
      },
      {
        name: 'unified_research',
        description: '複数のAPIを統合してリサーチを実行',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '検索クエリ' },
            apis: {
              type: 'array',
              items: { type: 'string', enum: ['tavily', 'serpapi', 'brave', 'newsapi', 'perplexity'] },
              default: ['tavily', 'brave']
            },
            max_results_per_api: { type: 'number', default: 5 }
          },
          required: ['query']
        }
      }
    ];
  }

  async handleTool(name, args) {
    switch (name) {
      case 'tavily_search':
        return this.tavilySearch(args);
      case 'serpapi_search':
        return this.serpapiSearch(args);
      case 'brave_search':
        return this.braveSearch(args);
      case 'newsapi_search':
        return this.newsapiSearch(args);
      case 'perplexity_search':
        return this.perplexitySearch(args);
      case 'unified_research':
        return this.unifiedResearch(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async tavilySearch({ query, search_depth = 'advanced', include_answer = true, max_results = 10 }) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return { error: 'TAVILY_API_KEY not set' };

    const body = JSON.stringify({
      api_key: apiKey,
      query,
      search_depth,
      include_answer,
      include_raw_content: true,
      max_results
    });

    return this.makeRequest('tavily', body);
  }

  async serpapiSearch({ query, engine = 'google', num = 10 }) {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) return { error: 'SERPAPI_KEY not set' };

    const params = new URLSearchParams({
      engine,
      q: query,
      api_key: apiKey,
      num: num.toString()
    });

    return this.makeRequest('serpapi', null, params);
  }

  async braveSearch({ query, count = 10 }) {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) return { error: 'BRAVE_API_KEY not set' };

    const params = new URLSearchParams({ q: query, count: count.toString() });
    return this.makeRequest('brave', null, params, {
      'Accept': 'application/json',
      'X-Subscription-Token': apiKey
    });
  }

  async newsapiSearch({ query, sortBy = 'publishedAt', pageSize = 10 }) {
    const apiKey = process.env.NEWSAPI_KEY;
    if (!apiKey) return { error: 'NEWSAPI_KEY not set' };

    const params = new URLSearchParams({
      q: query,
      apiKey,
      sortBy,
      pageSize: pageSize.toString()
    });

    return this.makeRequest('newsapi', null, params);
  }

  async perplexitySearch({ query, model = 'llama-3.1-sonar-large-128k-online' }) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) return { error: 'PERPLEXITY_API_KEY not set' };

    const body = JSON.stringify({
      model,
      messages: [{ role: 'user', content: `${query}についての最新情報を要約してください。出典URLも含めてください。` }]
    });

    return this.makeRequest('perplexity', body, null, {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    });
  }

  async unifiedResearch({ query, apis = ['tavily', 'brave'], max_results_per_api = 5 }) {
    const results = {};
    const errors = [];

    for (const api of apis) {
      try {
        switch (api) {
          case 'tavily':
            results.tavily = await this.tavilySearch({ query, max_results: max_results_per_api });
            break;
          case 'serpapi':
            results.serpapi = await this.serpapiSearch({ query, num: max_results_per_api });
            break;
          case 'brave':
            results.brave = await this.braveSearch({ query, count: max_results_per_api });
            break;
          case 'newsapi':
            results.newsapi = await this.newsapiSearch({ query, pageSize: max_results_per_api });
            break;
          case 'perplexity':
            results.perplexity = await this.perplexitySearch({ query });
            break;
        }
      } catch (error) {
        errors.push({ api, error: error.message });
      }
    }

    return { results, errors, query, apis_used: apis };
  }

  makeRequest(api, body, params, extraHeaders = {}) {
    return new Promise((resolve, reject) => {
      const config = API_CONFIG[api];
      let path = config.path;

      if (params) {
        path += '?' + params.toString();
      }

      const options = {
        hostname: config.endpoint,
        port: 443,
        path,
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...extraHeaders
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ raw: data });
          }
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }
}

// Export for MCP integration
module.exports = { ResearchAPIsServer, API_CONFIG };

// CLI mode
if (require.main === module) {
  const server = new ResearchAPIsServer();
  console.log('Research APIs MCP Server');
  console.log('Available tools:', server.tools.map(t => t.name).join(', '));
  console.log('\nAPI Keys status:');
  Object.entries(API_CONFIG).forEach(([key, config]) => {
    const hasKey = !!process.env[config.envKey];
    console.log(`  ${config.name}: ${hasKey ? '✓' : '✗'} (${config.envKey})`);
  });
}
