import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileExists } from '../utils/path.js';

/**
 * Configure docs resource for accessing repo README
 */
export function docsResource(server: McpServer, repoRoot: string): void {
  // Template for docs:// resources
  const docsTemplate = new ResourceTemplate('docs://{docName}', {
    list: async () => {
      // Currently only supporting README.md
      return { 
        resources: [{
          uri: 'docs://README.md',
          name: 'README.md',
          description: 'Repository documentation',
          mimeType: 'text/markdown'
        }]
      };
    }
  });
  
  // Handler for reading doc files
  server.resource('docs', docsTemplate, async (uri, params) => {
    const { docName } = params;
    
    if (docName !== 'README.md') {
      throw new Error(`Doc not supported: ${docName}`);
    }
    
    // Look for README.md in common locations
    const possiblePaths = [
      path.join(repoRoot, 'README.md'),
      path.join(repoRoot, 'carrot', 'README.md'),
      path.join(repoRoot, 'docs', 'README.md')
    ];
    
    // Find the first existing path
    const docPath = possiblePaths.find(p => fileExists(p));
    
    if (!docPath) {
      throw new Error('README.md not found');
    }
    
    try {
      // Read doc content
      const content = fs.readFileSync(docPath, 'utf-8');
      
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/markdown',
          text: content
        }]
      };
    } catch (error) {
      console.error(`Error reading doc file ${docPath}:`, error);
      throw new Error('Failed to read README.md');
    }
  });
} 