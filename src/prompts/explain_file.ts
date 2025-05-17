import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Prompt for explaining a file's purpose and public surface
 */
export function explainFilePrompt(server: McpServer): void {
  server.prompt(
    'explain_file',
    "Explain a file's purpose and public API surface",
    () => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please provide a terse explanation of the provided file.
            
Focus on:
1. The file's primary purpose
2. Any public APIs, functions, or classes it exports
3. How it fits into the overall architecture
4. Any important dependencies or relationships with other files

Be concise and focus on what another developer would need to know to work with this code.

Format your response with these sections:
- Purpose
- Public Surface
- Dependencies
- Usage Examples (brief)
`
            }
          }
        ]
      };
    }
  );
} 