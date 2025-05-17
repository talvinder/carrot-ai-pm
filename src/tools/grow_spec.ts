import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { fileExists } from '../utils/path.js';

/**
 * Configure grow_spec tool for adding entries to vibe.yaml
 */
export function growSpecTool(server: McpServer, repoRoot: string): void {
  server.tool(
    'grow_spec',
    {
      endpoint: z.string().min(1),
      summary: z.string().min(1)
    },
    async ({ endpoint, summary }) => {
      try {
        // 1. Find the vibe.yaml spec file
        const specPath = await findSpecFile(repoRoot);
        
        if (!specPath) {
          return {
            content: [{ 
              type: 'text', 
              text: 'Failed to find OpenAPI spec file vibe.yaml. Make sure it exists in the repository.' 
            }],
            isError: true
          };
        }
        
        // 2. Parse the path and HTTP method from the endpoint
        const { path: routePath, method } = parseEndpoint(endpoint);
        
        // 3. Add the endpoint to the spec file
        await addEndpointToSpec(specPath, routePath, method, summary);
        
        return {
          content: [{ 
            type: 'text', 
            text: `Successfully added ${method} ${routePath} to OpenAPI spec at ${path.relative(repoRoot, specPath)}\n` +
                  `Summary: ${summary}`
          }]
        };
      } catch (error) {
        return {
          content: [{ 
            type: 'text', 
            text: `Error adding endpoint to spec: ${error instanceof Error ? error.message : String(error)}` 
          }],
          isError: true
        };
      }
    }
  );
}

/**
 * Find the vibe.yaml spec file in the repository
 */
async function findSpecFile(repoRoot: string): Promise<string | null> {
  // Look for vibe.yaml in common locations
  const possiblePaths = [
    path.join(repoRoot, 'carrot', 'vibe.yaml'),
    path.join(repoRoot, 'vibe.yaml'),
    path.join(repoRoot, 'carrot', 'api', 'vibe.yaml'),
    path.join(repoRoot, 'carrot', 'docs', 'vibe.yaml'),
    path.join(repoRoot, 'docs', 'vibe.yaml'),
    path.join(repoRoot, 'specs', 'vibe.yaml')
  ];
  
  // Find the first existing path
  const specPath = possiblePaths.find(p => fileExists(p));
  
  return specPath || null;
}

/**
 * Parse the endpoint string to extract the path and HTTP method
 */
function parseEndpoint(endpoint: string): { path: string; method: string } {
  // Default to GET if no method is specified
  let method = 'get';
  let path = endpoint;
  
  // Check if the endpoint includes a method
  const methodMatch = endpoint.match(/^(get|post|put|delete|patch|options|head):(.*)/i);
  
  if (methodMatch) {
    method = methodMatch[1].toLowerCase();
    path = methodMatch[2];
  }
  
  // Ensure path starts with a slash
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  return { path, method };
}

/**
 * Add the endpoint to the vibe.yaml spec file
 */
async function addEndpointToSpec(specPath: string, routePath: string, method: string, summary: string): Promise<void> {
  // Read the current spec file
  const specContent = fs.readFileSync(specPath, 'utf-8');
  
  // Check if the route already exists in the spec
  const pathPattern = new RegExp(`${routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*`);
  const methodPattern = new RegExp(`${method.toLowerCase()}:\\s*`);
  
  let updatedContent = specContent;
  
  if (pathPattern.test(specContent)) {
    // The path already exists in the spec
    
    // Find the path entry and check if the method exists
    const pathIndex = specContent.search(pathPattern);
    const pathBlock = specContent.slice(pathIndex);
    
    if (methodPattern.test(pathBlock.slice(0, pathBlock.indexOf('\n  /')))) {
      // Method already exists for this path
      throw new Error(`Endpoint ${method.toUpperCase()} ${routePath} already exists in the spec`);
    }
    
    // Add the method to the existing path
    const pathIndentation = specContent.slice(specContent.lastIndexOf('\n', pathIndex) + 1, pathIndex).match(/^\s*/)?.[0] || '';
    const insertPoint = pathIndex + routePath.length + 1; // +1 for the colon
    
    const methodStub = `
${pathIndentation}  ${method.toLowerCase()}:
${pathIndentation}    summary: ${summary}
${pathIndentation}    responses:
${pathIndentation}      '200':
${pathIndentation}        description: Successful response
${pathIndentation}        content:
${pathIndentation}          application/json:
${pathIndentation}            schema:
${pathIndentation}              type: object`;
    
    updatedContent = specContent.slice(0, insertPoint) + methodStub + specContent.slice(insertPoint);
  } else {
    // The path doesn't exist, add it to the paths section
    
    // Find the paths section
    const pathsIndex = specContent.indexOf('paths:');
    
    if (pathsIndex === -1) {
      throw new Error('Could not find paths section in OpenAPI spec');
    }
    
    // Determine the indentation of the paths section
    const pathsLine = specContent.slice(specContent.lastIndexOf('\n', pathsIndex) + 1, specContent.indexOf('\n', pathsIndex));
    const baseIndent = pathsLine.match(/^\s*/)?.[0] || '';
    const pathIndent = baseIndent + '  ';
    
    // Find a good insertion point (after the last path entry)
    let insertPoint: number;
    
    // Find the next top-level YAML key after paths
    const nextKeyMatch = specContent.slice(pathsIndex).match(/\n(\s*)[a-zA-Z0-9_]+:/);
    
    if (nextKeyMatch && nextKeyMatch[1].length === baseIndent.length && nextKeyMatch.index !== undefined) {
      // Found the next top-level key, insert before it
      insertPoint = pathsIndex + nextKeyMatch.index;
    } else {
      // No next key, insert at the end of the file
      insertPoint = specContent.length;
    }
    
    // Create the path entry stub
    const pathStub = `
${pathIndent}${routePath}:
${pathIndent}  ${method.toLowerCase()}:
${pathIndent}    summary: ${summary}
${pathIndent}    responses:
${pathIndent}      '200':
${pathIndent}        description: Successful response
${pathIndent}        content:
${pathIndent}          application/json:
${pathIndent}            schema:
${pathIndent}              type: object`;
    
    updatedContent = specContent.slice(0, insertPoint) + pathStub + specContent.slice(insertPoint);
  }
  
  // Write the updated content back
  fs.writeFileSync(specPath, updatedContent);
} 