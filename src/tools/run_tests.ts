import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import { RateLimiter } from '../utils/rate_limiter.js';

const execAsync = promisify(exec);

// Rate limiter: 4 calls per minute
const testRateLimiter = new RateLimiter(4, 60 * 1000);

/**
 * Configure run_tests tool for running pytest
 */
export function runTestsTool(server: McpServer, repoRoot: string): void {
  server.tool(
    'run_tests',
    {},
    async () => {
      // Check rate limiting
      if (!testRateLimiter.tryAcquire()) {
        return {
          content: [{ 
            type: 'text', 
            text: 'Rate limit exceeded: You can only run tests 4 times per minute.' 
          }],
          isError: true
        };
      }
      
      try {
        // Run pytest in quiet mode
        const { stdout, stderr } = await execAsync('cd "' + repoRoot + '" && python -m pytest -q', {
          timeout: 60000, // 60 second timeout
          maxBuffer: 1024 * 1024 // 1MB buffer
        });
        
        // Parse the test results
        const { passed, failed, summary } = parseTestResults(stdout, stderr);
        
        const resultJson = {
          passed,
          failed,
          summary,
          full_output: stdout + (stderr ? '\n\n' + stderr : '')
        };
        
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify(resultJson, null, 2)
          }]
        };
      } catch (error) {
        // Handle test failures or execution errors
        const err = error as { stdout?: string; stderr?: string; message?: string };
        
        // Try to parse test results even if tests failed (pytest returns non-zero exit code)
        if (err.stdout) {
          const { passed, failed, summary } = parseTestResults(err.stdout, err.stderr || '');
          
          const resultJson = {
            passed,
            failed,
            summary,
            error: err.message || 'Tests failed',
            full_output: err.stdout + (err.stderr ? '\n\n' + err.stderr : '')
          };
          
          return {
            content: [{ 
              type: 'text', 
              text: JSON.stringify(resultJson, null, 2)
            }]
          };
        }
        
        return {
          content: [{ 
            type: 'text', 
            text: `Error running tests: ${err.message || 'Unknown error'}\n${err.stderr || ''}` 
          }],
          isError: true
        };
      }
    }
  );
}

/**
 * Parse pytest output to extract test results
 */
function parseTestResults(stdout: string, stderr: string): { passed: number; failed: number; summary: string } {
  // Attempt to parse pytest output for passed and failed tests
  const summaryMatch = stdout.match(/(\d+) passed(, (\d+) failed)?(, (\d+) skipped)?(, (\d+) warnings)? in [\d\.]+s/);
  
  if (summaryMatch) {
    const passed = parseInt(summaryMatch[1], 10) || 0;
    const failed = parseInt(summaryMatch[3], 10) || 0;
    
    return {
      passed,
      failed,
      summary: summaryMatch[0]
    };
  }
  
  // If no match, try to count from the output
  const passedCount = (stdout.match(/PASSED/g) || []).length;
  const failedCount = (stdout.match(/FAILED/g) || []).length;
  
  let summary = `${passedCount} passed`;
  if (failedCount > 0) {
    summary += `, ${failedCount} failed`;
  }
  
  return {
    passed: passedCount,
    failed: failedCount,
    summary
  };
} 