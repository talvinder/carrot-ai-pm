import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { RateLimiter } from '../utils/rate_limiter.js';

const execAsync = promisify(exec);

// Rate limiter: 4 calls per minute
const searchRateLimiter = new RateLimiter(4, 60 * 1000);

/**
 * Configure search_code tool for running ripgrep searches
 */
export function searchCodeTool(server: McpServer, repoRoot: string): void {
  server.tool(
    'search_code',
    {
      query: z.string().min(1)
    },
    async ({ query }) => {
      // Check rate limiting
      if (!searchRateLimiter.tryAcquire()) {
        return {
          content: [{ 
            type: 'text', 
            text: 'Rate limit exceeded: You can only search 4 times per minute.' 
          }],
          isError: true
        };
      }
      
      try {
        // Sanitize the query for shell use
        const sanitizedQuery = sanitizeRipgrepQuery(query);
        
        // Run ripgrep with nice formatting options
        const cmd = `cd "${repoRoot}" && rg --heading --line-number --context 2 --max-count 50 --color never "${sanitizedQuery}" .`;
        
        const { stdout, stderr } = await execAsync(cmd, {
          timeout: 30000, // 30 second timeout
          maxBuffer: 2 * 1024 * 1024 // 2MB buffer
        });
        
        if (stdout.trim() === '') {
          return {
            content: [{ 
              type: 'text', 
              text: `No matches found for: ${query}` 
            }]
          };
        }
        
        // Format the results
        const formattedResults = formatSearchResults(stdout, repoRoot);
        
        return {
          content: [{ 
            type: 'text', 
            text: formattedResults
          }]
        };
      } catch (error) {
        const err = error as { stdout?: string; stderr?: string; message?: string };
        
        // Check if it's just a "no matches" error
        if (err.stderr && err.stderr.includes('No files were searched')) {
          return {
            content: [{ 
              type: 'text', 
              text: `No files were searched. ${err.stderr}` 
            }]
          };
        }
        
        return {
          content: [{ 
            type: 'text', 
            text: `Error searching code: ${err.message || 'Unknown error'}\n${err.stderr || ''}` 
          }],
          isError: true
        };
      }
    }
  );
}

/**
 * Sanitize a query for use with ripgrep
 */
function sanitizeRipgrepQuery(query: string): string {
  // Escape double quotes and backslashes
  return query.replace(/["\\]/g, '\\$&');
}

/**
 * Format search results for better readability
 */
function formatSearchResults(stdout: string, repoRoot: string): string {
  // Split output by file sections
  const sections = stdout.split(/\n(?=\S+:$)/);
  
  // Process each section
  const formattedSections = sections.map(section => {
    const lines = section.split('\n');
    
    // Extract file path
    const filePathLine = lines[0].endsWith(':') ? lines[0].slice(0, -1) : lines[0];
    const relativePath = path.relative(repoRoot, filePathLine);
    
    // Format header
    const header = `File: ${relativePath}`;
    
    // Process result lines to add clear match indicators
    const resultLines = lines.slice(1).map(line => {
      // Look for line numbers (digits followed by colon)
      const lineNumberMatch = line.match(/^(\d+)(-\d+)?:/);
      
      if (lineNumberMatch) {
        // This is a match line, make it stand out
        const lineNumber = lineNumberMatch[0];
        const content = line.slice(lineNumber.length);
        return `  ${lineNumber} ${content}`;
      } else if (line.startsWith('-')) {
        // This is a separator, skip it
        return '';
      } else {
        // This is a context line, indent it
        return `     ${line}`;
      }
    }).filter(Boolean); // Remove empty lines
    
    return [header, ...resultLines].join('\n');
  });
  
  return formattedSections.join('\n\n');
} 