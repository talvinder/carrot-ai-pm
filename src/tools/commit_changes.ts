import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as simpleGit from 'simple-git';

const execAsync = promisify(exec);

/**
 * Configure commit_changes tool for staging and committing changes
 */
export function commitChangesTool(server: McpServer, repoRoot: string): void {
  server.tool(
    'commit_changes',
    {
      message: z.string().min(1)
    },
    async ({ message }) => {
      try {
        // Initialize git
        const git = simpleGit.simpleGit(repoRoot);
        
        // Get the current status to see what changes there are
        const status = await git.status();
        
        if (status.isClean()) {
          return {
            content: [{ 
              type: 'text', 
              text: 'No changes to commit. Working directory is clean.' 
            }]
          };
        }
        
        // Format status for output
        const changes = {
          modified: status.modified,
          added: status.created,
          deleted: status.deleted,
          untracked: status.not_added,
          renamed: status.renamed
        };
        
        // Create a change summary for the output
        const changeCount = 
          status.modified.length + 
          status.created.length + 
          status.deleted.length + 
          status.renamed.length;
        
        // Stage all changes
        await git.add('.');
        
        // Commit the changes
        const commitResult = await git.commit(message);
        
        // Prepare the result message
        let resultMessage = `Successfully committed ${changeCount} changes to git.\n`;
        resultMessage += `Commit hash: ${commitResult.commit}\n`;
        resultMessage += `Commit message: ${message}\n\n`;
        resultMessage += 'Changes:\n';
        
        if (changes.modified.length > 0) {
          resultMessage += `\nModified files:\n${changes.modified.map(file => `  - ${file}`).join('\n')}`;
        }
        
        if (changes.added.length > 0) {
          resultMessage += `\nAdded files:\n${changes.added.map(file => `  - ${file}`).join('\n')}`;
        }
        
        if (changes.deleted.length > 0) {
          resultMessage += `\nDeleted files:\n${changes.deleted.map(file => `  - ${file}`).join('\n')}`;
        }
        
        if (changes.renamed.length > 0) {
          resultMessage += `\nRenamed files:\n${changes.renamed.map(file => `  - ${file.from} → ${file.to}`).join('\n')}`;
        }
        
        // Include the diff in the result
        const diff = await git.diff(['HEAD~1', 'HEAD']);
        
        resultMessage += '\n\nDiff:\n```diff\n' + diff + '\n```';
        
        return {
          content: [{ 
            type: 'text', 
            text: resultMessage
          }]
        };
      } catch (error) {
        return {
          content: [{ 
            type: 'text', 
            text: `Error committing changes: ${error instanceof Error ? error.message : String(error)}` 
          }],
          isError: true
        };
      }
    }
  );
} 