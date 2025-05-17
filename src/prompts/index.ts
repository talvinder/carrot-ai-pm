import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { reviewDiffPrompt } from './review_diff.js';
import { draftPrPrompt } from './draft_pr.js';
import { explainFilePrompt } from './explain_file.js';

/**
 * Configure all prompts for the MCP server
 */
export function configurePrompts(server: McpServer): void {
  // Prompt for code reviews based on a git diff
  reviewDiffPrompt(server);
  
  // Prompt for generating PR descriptions
  draftPrPrompt(server);
  
  // Prompt for explaining files
  explainFilePrompt(server);
} 