import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Prompt for reviewing a git diff
 */
export function reviewDiffPrompt(server: McpServer): void {
  server.prompt(
    'review_diff',
    "Review a git diff and provide structured feedback",
    () => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please review the provided code diff and provide a structured code review with these sections:

1. **Logic & Functionality**
   - Are there any logical errors or edge cases not handled?
   - Is the implementation correct and efficient?
   - Are there any potential bugs or unintended side effects?

2. **Code Style & Best Practices**
   - Does the code follow Python/FastAPI best practices?
   - Are there any style improvements that could be made?
   - Is the code readable and maintainable?

3. **Tests Needed**
   - What tests should be added to validate this code?
   - Are there any specific edge cases that should be tested?

4. **Documentation**
   - Is the code adequately documented?
   - Are there any API changes that need documentation updates?

5. **Security Concerns**
   - Are there any security issues or vulnerabilities?
   - Is user input properly validated and sanitized?

6. **Summary**
   - Overall assessment of the changes
   - Any blocking issues that must be addressed before merging

Please provide your review in a clear, constructive manner.`
            }
          }
        ]
      };
    }
  );
}