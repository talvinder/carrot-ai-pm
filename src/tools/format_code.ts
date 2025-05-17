import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { isPathInRepo } from '../utils/path.js';

const execAsync = promisify(exec);

/**
 * Configure format_code tool for running ruff --fix and black
 */
export function formatCodeTool(server: McpServer, repoRoot: string): void {
  server.tool(
    'format_code',
    {
      paths: z.array(z.string()).optional()
    },
    async ({ paths }) => {
      try {
        // Determine which paths to format
        let targetPaths: string[];
        
        if (paths && paths.length > 0) {
          // Validate and normalize provided paths
          targetPaths = paths.map(p => {
            // Convert to absolute path if not already
            const absPath = path.isAbsolute(p) ? p : path.join(repoRoot, p);
            
            // Security check: ensure path is within repo
            if (!isPathInRepo(absPath, repoRoot)) {
              throw new Error(`Path ${p} is outside of repository`);
            }
            
            return absPath;
          });
        } else {
          // Default to formatting the whole carrot directory
          targetPaths = [path.join(repoRoot, 'carrot')];
        }
        
        // Format paths for command
        const pathsArgument = targetPaths.map(p => `"${p}"`).join(' ');
        
        // Format with ruff first (auto-fix linting issues)
        let ruffOutput = '';
        try {
          const { stdout, stderr } = await execAsync(`ruff check --fix ${pathsArgument}`, {
            cwd: repoRoot,
            timeout: 30000 // 30 second timeout
          });
          ruffOutput = stdout + (stderr ? '\n' + stderr : '');
        } catch (error) {
          const err = error as { stdout?: string; stderr?: string; message?: string };
          ruffOutput = `Ruff errors (some may have been fixed): ${err.message}\n${err.stdout || ''}\n${err.stderr || ''}`;
        }
        
        // Format with black (code style)
        let blackOutput = '';
        try {
          const { stdout, stderr } = await execAsync(`black ${pathsArgument}`, {
            cwd: repoRoot,
            timeout: 30000 // 30 second timeout
          });
          blackOutput = stdout + (stderr ? '\n' + stderr : '');
        } catch (error) {
          const err = error as { stdout?: string; stderr?: string; message?: string };
          blackOutput = `Black errors: ${err.message}\n${err.stdout || ''}\n${err.stderr || ''}`;
        }
        
        // Prepare summary
        const formattedPaths = targetPaths.map(p => path.relative(repoRoot, p));
        const summary = `Code formatting completed on:\n${formattedPaths.map(p => `- ${p}`).join('\n')}`;
        
        return {
          content: [{ 
            type: 'text', 
            text: `${summary}\n\nRuff output:\n${ruffOutput || 'No output'}\n\nBlack output:\n${blackOutput || 'No output'}` 
          }]
        };
      } catch (error) {
        return {
          content: [{ 
            type: 'text', 
            text: `Error formatting code: ${error instanceof Error ? error.message : String(error)}` 
          }],
          isError: true
        };
      }
    }
  );
} 