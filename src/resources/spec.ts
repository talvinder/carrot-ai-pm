import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileExists, resolveRepoPath } from '../utils/path.js';

/**
 * Configure spec resource for accessing the OpenAPI/vibe spec
 */
export function specResource(server: McpServer, repoRoot: string): void {
  // Template for spec://vibe.yaml resource
  const specTemplate = new ResourceTemplate('spec://{specName}', {
    list: async () => {
      // For now, we only support the vibe.yaml spec
      return { 
        resources: [{
          uri: 'spec://vibe.yaml',
          name: 'vibe.yaml',
          description: 'OpenAPI specification for the API',
          mimeType: 'application/x-yaml'
        }]
      };
    }
  });
  
  // Handler for reading spec files
  server.resource('spec', specTemplate, async (uri, params) => {
    const { specName } = params;
    
    if (specName !== 'vibe.yaml') {
      throw new Error(`Spec not supported: ${specName}`);
    }
    
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
    
    if (!specPath) {
      throw new Error('OpenAPI spec file vibe.yaml not found');
    }
    
    try {
      // Read spec content
      const content = fs.readFileSync(specPath, 'utf-8');
      
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/x-yaml',
          text: content
        }]
      };
    } catch (error) {
      console.error(`Error reading spec file ${specPath}:`, error);
      throw new Error('Failed to read OpenAPI spec file');
    }
  });
} 