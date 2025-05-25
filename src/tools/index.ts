import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { addRouteTool } from './add_route.js';
import { growSpecTool } from './grow_spec.js';
import { growUISpecTool } from './grow_ui_spec.js';
import { growDBSpecTool } from './grow_db_spec.js';
import { runTestsTool } from './run_tests.js';
import { formatCodeTool } from './format_code.js';
import { searchCodeTool } from './search_code.js';
import { commitChangesTool } from './commit_changes.js';
import { setupCarrotTool } from './setup_carrot.js';
import { checkSpecComplianceTool } from './check_spec_compliance.js';

/**
 * Configure all tools for the MCP server
 */
export function configureTools(server: McpServer, repoRoot: string): void {
  // Tool to set up Carrot project structure
  setupCarrotTool(server, repoRoot);
  
  // Tool to create FastAPI route stubs
  addRouteTool(server, repoRoot);
  
  // Tool to append stubs to vibe.yaml
  growSpecTool(server, repoRoot);
  
  // Tool to create UI component specifications
  growUISpecTool(server, repoRoot);
  
  // Tool to create database specifications
  growDBSpecTool(server, repoRoot);
  
  // // Tool to run pytest
  runTestsTool(server, repoRoot);
  
  // // Tool to format code with ruff and black
  formatCodeTool(server, repoRoot);
  
  // // Tool to search code with ripgrep
  searchCodeTool(server, repoRoot);
  
  // // Tool to commit changes via git
  commitChangesTool(server, repoRoot);
  
  // Tool to check spec compliance
  checkSpecComplianceTool(server, repoRoot);
} 