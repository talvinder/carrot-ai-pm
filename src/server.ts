import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { configureResources } from './resources/index.js';
import { configureTools } from './tools/index.js';
import { configurePrompts } from './prompts/index.js';
import { getRepoRoot } from './utils/path.js';

// Initialize the MCP server
const server = new McpServer({
  name: 'Carrot-AI-PM',
  version: '1.0.0',
});

// Get repository root path with error handling
let repoRoot: string;
try {
  repoRoot = getRepoRoot();
} catch (error) {
  console.error("[CarrotMCP Fatal] Server startup failed: Could not determine a valid project root.");
  process.exit(1);
}

// Configure resources, tools, and prompts
configureResources(server, repoRoot);
configureTools(server, repoRoot);
configurePrompts(server);

// Check if PORT env var is set to determine transport
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 0;

if (PORT > 0) {
  // SSE transport
  const app = express();
  app.use(express.json());

  // Map to store transports by session ID
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  // Handle POST, GET, and DELETE requests
  app.all('/mcp/sse', async (req, res) => {
    try {
      // Check for existing session ID
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
      } else if (!sessionId && req.method === 'POST') {
        // New initialization request
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => {
            transports[sid] = transport;
            console.log(`Session initialized: ${sid}`);
          },
        });

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            delete transports[transport.sessionId];
            console.log(`Session closed: ${transport.sessionId}`);
          }
        };

        // Connect to the MCP server
        await server.connect(transport);
      } else {
        // Invalid request
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
        return;
      }

      // Handle the request
      await transport.handleRequest(req, res, req.method === 'POST' ? req.body : undefined);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`Carrot MCP server listening on port ${PORT}`);
  });
} else {
  // Stdio transport
  const transport = new StdioServerTransport();
  server.connect(transport).catch((error) => {
    console.error('Error connecting MCP server:', error);
    process.exit(1);
  });
} 