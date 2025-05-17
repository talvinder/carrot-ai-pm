import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { fileExists, resolveRepoPath } from '../utils/path.js';

// Define the HTTP methods enum
const HttpMethod = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']);
type HttpMethodType = z.infer<typeof HttpMethod>;

/**
 * Configure add_route tool for creating FastAPI route stubs
 */
export function addRouteTool(server: McpServer, repoRoot: string): void {
  server.tool(
    'add_route',
    {
      path: z.string().min(1),
      method: HttpMethod,
      handler_name: z.string().min(1)
    },
    async ({ path: routePath, method, handler_name }) => {
      try {
        // 1. Find the FastAPI app file where routes are defined
        const appFiles = await findAppFiles(repoRoot);
        
        if (appFiles.length === 0) {
          return {
            content: [{ 
              type: 'text', 
              text: 'Failed to find FastAPI app file. Make sure the carrot directory exists and contains a FastAPI application.' 
            }],
            isError: true
          };
        }
        
        // Use the first found app file (main)
        const appFile = appFiles[0];
        
        // 2. Find or create the handler file
        const handlerFile = await createHandlerFile(repoRoot, handler_name);
        
        // 3. Add the route to the app file
        await addRouteToApp(appFile, handlerFile, handler_name, routePath, method);
        
        return {
          content: [{ 
            type: 'text', 
            text: `Successfully added ${method} route for ${routePath}\n` +
                  `- Created/updated handler in: ${path.relative(repoRoot, handlerFile)}\n` +
                  `- Updated app file: ${path.relative(repoRoot, appFile)}`
          }]
        };
      } catch (error) {
        return {
          content: [{ 
            type: 'text', 
            text: `Error adding route: ${error instanceof Error ? error.message : String(error)}` 
          }],
          isError: true
        };
      }
    }
  );
}

/**
 * Find FastAPI app files in the repository
 */
async function findAppFiles(repoRoot: string): Promise<string[]> {
  const carrotDir = path.join(repoRoot, 'carrot');
  
  if (!fs.existsSync(carrotDir)) {
    throw new Error('Carrot directory not found');
  }
  
  // Look for Python files that import FastAPI and create an app instance
  const pythonFiles = await glob('**/*.py', { 
    cwd: carrotDir,
    ignore: ['**/venv/**', '**/__pycache__/**', '**/tests/**'],
    absolute: true
  });
  
  const appFiles: string[] = [];
  
  // Check each file for FastAPI imports and app creation
  for (const file of pythonFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Simple heuristic: look for FastAPI import and app creation
    if ((content.includes('from fastapi import') || content.includes('import fastapi')) &&
        (content.includes('FastAPI(') || content.includes('APIRouter('))) {
      appFiles.push(file);
    }
  }
  
  return appFiles;
}

/**
 * Create or find a handler file for the new route
 */
async function createHandlerFile(repoRoot: string, handler_name: string): Promise<string> {
  const carrotDir = path.join(repoRoot, 'carrot');
  
  // Common locations for route handlers
  const possibleDirs = [
    path.join(carrotDir, 'api', 'routes'),
    path.join(carrotDir, 'routes'),
    path.join(carrotDir, 'endpoints'),
    path.join(carrotDir, 'handlers'),
    carrotDir
  ];
  
  // Find the first existing directory
  const routesDir = possibleDirs.find(dir => fs.existsSync(dir));
  
  if (!routesDir) {
    // Create a routes directory if none exists
    const newRoutesDir = path.join(carrotDir, 'routes');
    fs.mkdirSync(newRoutesDir, { recursive: true });
    
    // Create an __init__.py to make it a proper package
    fs.writeFileSync(path.join(newRoutesDir, '__init__.py'), '# Routes package\n');
    
    return createHandlerInDir(newRoutesDir, handler_name);
  }
  
  return createHandlerInDir(routesDir, handler_name);
}

/**
 * Create a handler file in the specified directory
 */
function createHandlerInDir(directory: string, handler_name: string): string {
  // Create file name from handler name
  const fileName = `${handler_name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()}.py`;
  const filePath = path.join(directory, fileName);
  
  // Check if the file already exists
  if (fileExists(filePath)) {
    return filePath;
  }
  
  // Create a new handler file with a template
  const template = `from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict, Any

router = APIRouter()

@router.get("/{path}")
async def ${handler_name}() -> Dict[str, Any]:
    """
    Handler for {path}
    """
    return {"message": "This is a stub handler for ${handler_name}"}
`;
  
  fs.writeFileSync(filePath, template);
  
  // Create or update __init__.py to export the router
  const initPath = path.join(directory, '__init__.py');
  
  if (fileExists(initPath)) {
    const initContent = fs.readFileSync(initPath, 'utf-8');
    
    // Only add the import if it doesn't already exist
    if (!initContent.includes(`from . import ${fileName.replace('.py', '')}`)) {
      fs.appendFileSync(initPath, `\nfrom . import ${fileName.replace('.py', '')}\n`);
    }
  } else {
    fs.writeFileSync(initPath, `# Routes package\nfrom . import ${fileName.replace('.py', '')}\n`);
  }
  
  return filePath;
}

/**
 * Add the route to the app file
 */
async function addRouteToApp(appFile: string, handlerFile: string, handlerName: string, routePath: string, method: HttpMethodType): Promise<void> {
  const appContent = fs.readFileSync(appFile, 'utf-8');
  const handlerModule = path.relative(path.dirname(appFile), handlerFile).replace('.py', '').replace(/\\/g, '/');
  
  // Find the app object
  const appMatch = appContent.match(/(\w+)\s*=\s*FastAPI\(/);
  const routerMatch = appContent.match(/(\w+)\s*=\s*APIRouter\(/);
  
  const appVarName = appMatch ? appMatch[1] : routerMatch ? routerMatch[1] : 'app';
  
  // Prepare the import statement
  let importPath = handlerModule;
  if (importPath.startsWith('../') || importPath.startsWith('./')) {
    // Relative import
    importPath = importPath.replace(/^\.\.\//, '').replace(/^\.\//, '');
  } else if (!importPath.includes('/')) {
    // Local import
    importPath = `.${importPath}`;
  }
  
  // Add the import and route registration
  let updatedContent = appContent;
  
  // Check if the import already exists
  const importRegex = new RegExp(`from\\s+.*${handlerModule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+import`, 'g');
  
  if (!importRegex.test(updatedContent)) {
    // Add the import at the end of import section
    const lastImportIndex = updatedContent.lastIndexOf('import');
    const lastImportLineEnd = updatedContent.indexOf('\n', lastImportIndex) + 1;
    
    updatedContent = 
      updatedContent.slice(0, lastImportLineEnd) +
      `from ${importPath.replace(/\\/g, '.')} import router as ${handlerName}_router\n` +
      updatedContent.slice(lastImportLineEnd);
  }
  
  // Check if the route is already registered
  const routeRegistrationRegex = new RegExp(`${appVarName}\\.include_router\\(\\s*${handlerName}_router`, 'g');
  
  if (!routeRegistrationRegex.test(updatedContent)) {
    // Find a good place to add the registration
    const lastRouterRegistration = updatedContent.lastIndexOf('include_router');
    
    if (lastRouterRegistration !== -1) {
      // Add after the last router registration
      const lastRouterLineEnd = updatedContent.indexOf('\n', lastRouterRegistration) + 1;
      
      updatedContent = 
        updatedContent.slice(0, lastRouterLineEnd) +
        `${appVarName}.include_router(${handlerName}_router, prefix="${routePath.startsWith('/') ? routePath : '/' + routePath}")\n` +
        updatedContent.slice(lastRouterLineEnd);
    } else {
      // Add at the end of the file
      updatedContent += `\n# Register ${handlerName} router\n`;
      updatedContent += `${appVarName}.include_router(${handlerName}_router, prefix="${routePath.startsWith('/') ? routePath : '/' + routePath}")\n`;
    }
  }
  
  // Write the updated content back
  fs.writeFileSync(appFile, updatedContent);
} 