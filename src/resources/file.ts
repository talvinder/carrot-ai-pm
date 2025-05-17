import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { fileExists, isPathInRepo, resolveRepoPath } from '../utils/path.js';

/**
 * Configure file resource for accessing source files
 */
export function fileResource(server: McpServer, repoRoot: string): void {
  // Template for file:// resources
  const fileTemplate = new ResourceTemplate('file://{path}', {
    list: async () => {
      // List all files in the carrot directory
      const carrotDir = path.join(repoRoot, 'carrot');
      
      if (!fs.existsSync(carrotDir)) {
        console.warn(`Carrot directory not found at ${carrotDir}`);
        return { resources: [] };
      }
      
      try {
        // Get all files recursively in the carrot directory
        const files = await glob('**/*', { 
          cwd: carrotDir,
          nodir: true,
          dot: false,
          ignore: ['**/node_modules/**', '**/.git/**', '**/__pycache__/**']
        });
        
        // Format as resources
        const resources = files.map(file => ({
          uri: `file://${file}`,
          name: path.basename(file),
          description: `Source file: ${file}`
        }));
        
        return { resources };
      } catch (error) {
        console.error('Error listing files:', error);
        return { resources: [] };
      }
    }
  });
  
  // Handler for reading individual files
  server.resource('file', fileTemplate, async (uri, params) => {
    const { path: filePath } = params;
    
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('File path not provided or invalid');
    }
    
    // Resolve the file path within the repository
    const carrotDir = path.join(repoRoot, 'carrot');
    const fullPath = path.join(carrotDir, filePath);
    
    // Security check: ensure the path is within the repo
    if (!isPathInRepo(fullPath, repoRoot)) {
      throw new Error('Access denied: Attempting to access file outside repository');
    }
    
    // Check if file exists
    if (!fileExists(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    try {
      // Read file content
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Determine MIME type based on extension
      const ext = path.extname(filePath).toLowerCase();
      let mimeType = 'text/plain';
      
      if (ext === '.py') mimeType = 'text/x-python';
      else if (ext === '.js') mimeType = 'application/javascript';
      else if (ext === '.json') mimeType = 'application/json';
      else if (ext === '.html') mimeType = 'text/html';
      else if (ext === '.css') mimeType = 'text/css';
      else if (ext === '.md') mimeType = 'text/markdown';
      else if (ext === '.yaml' || ext === '.yml') mimeType = 'application/x-yaml';
      
      return {
        contents: [{
          uri: uri.href,
          mimeType,
          text: content
        }]
      };
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      throw new Error(`Failed to read file: ${filePath}`);
    }
  });
} 