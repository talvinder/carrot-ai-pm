import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fileResource } from './file.js';
import { specResource } from './spec.js';
import { docsResource } from './docs.js';
import { todoResource } from './todo.js';

/**
 * Configure all resources for the MCP server
 */
export function configureResources(server: McpServer, repoRoot: string): void {
  // File resources - any source file under <repo-root>/carrot
  fileResource(server, repoRoot);
  
  // Spec resource - the OpenAPI/vibe spec
  specResource(server, repoRoot);
  
  // Docs resource - repository README
  docsResource(server, repoRoot);
  
  // TODO/Issues resource - GitHub issues with 'carrot' label
  todoResource(server, repoRoot);
} 