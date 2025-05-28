import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Configure setup_carrot tool for initializing Carrot project structure
 */
export function setupCarrotTool(server: McpServer, repoRoot: string): void {
  server.tool(
    'setup_carrot',
    {
      projectName: z.string().optional().describe('Name of the project (defaults to directory name)'),
      description: z.string().optional().describe('Description of the project')
    },
    async ({ projectName, description }: { projectName?: string; description?: string }) => {
      try {
        console.log(`Setting up Carrot structure in: ${repoRoot}`);
        
        // Get project name from directory if not provided
        const defaultProjectName = path.basename(repoRoot);
        const finalProjectName = projectName || defaultProjectName;
        
        // Create directory structure
        const carrotDir = path.join(repoRoot, 'carrot');
        const specsDir = path.join(repoRoot, 'specs');
        const dotCarrotDir = path.join(repoRoot, '.carrot');
        
        // Create carrot directory (for user implementation files)
        if (!fs.existsSync(carrotDir)) {
          fs.mkdirSync(carrotDir, { recursive: true });
          console.log(`Created carrot directory: ${carrotDir}`);
        }
        
        // Create .carrot directory (for internal files like compliance results)
        if (!fs.existsSync(dotCarrotDir)) {
          fs.mkdirSync(dotCarrotDir, { recursive: true });
          console.log(`Created .carrot directory: ${dotCarrotDir}`);
          
          // Create subdirectories for internal data
          const internalDirs = ['compliance', 'cache', 'logs'];
          for (const subDir of internalDirs) {
            const subDirPath = path.join(dotCarrotDir, subDir);
            if (!fs.existsSync(subDirPath)) {
              fs.mkdirSync(subDirPath, { recursive: true });
              console.log(`Created .carrot/${subDir} directory`);
            }
          }
        }
        
        // Create specs directory
        if (!fs.existsSync(specsDir)) {
          fs.mkdirSync(specsDir, { recursive: true });
          console.log(`Created specs directory: ${specsDir}`);
        }
        
        // Create subdirectories in specs
        const specSubDirs = ['api', 'ui', 'db', 'job'];
        for (const subDir of specSubDirs) {
          const subDirPath = path.join(specsDir, subDir);
          if (!fs.existsSync(subDirPath)) {
            fs.mkdirSync(subDirPath, { recursive: true });
            console.log(`Created specs/${subDir} directory`);
          }
        }
        
        // Create initial vibe.yaml if it doesn't exist
        const vibeYamlPath = path.join(repoRoot, 'vibe.yaml');
        if (!fs.existsSync(vibeYamlPath)) {
          const initialSpec = {
            openapi: '3.0.0',
            info: {
              title: `${finalProjectName} API`,
              description: description || `API specification for ${finalProjectName}`,
              version: '1.0.0'
            },
            servers: [
              {
                url: 'http://localhost:8000',
                description: 'Development server'
              }
            ],
            paths: {},
            components: {
              schemas: {},
              responses: {
                'NotFound': {
                  description: 'The requested resource was not found',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          error: { type: 'string', example: 'Resource not found' },
                          status: { type: 'integer', example: 404 }
                        }
                      }
                    }
                  }
                },
                'BadRequest': {
                  description: 'The request was invalid',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          error: { type: 'string', example: 'Invalid request' },
                          status: { type: 'integer', example: 400 },
                          details: {
                            type: 'object',
                            additionalProperties: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          };
          
          fs.writeFileSync(vibeYamlPath, yaml.dump(initialSpec), { mode: 0o644 });
          console.log(`Created vibe.yaml: ${vibeYamlPath}`);
        }
        
        // Create README.md with project information if it doesn't exist
        const readmePath = path.join(repoRoot, 'README.md');
        if (!fs.existsSync(readmePath)) {
          const readmeContent = `# ${finalProjectName}

${description || `A spec-driven API project managed by Carrot AI PM`}

## Project Structure

- \`vibe.yaml\` - OpenAPI specification (single source of truth)
- \`specs/\` - Detailed specifications organized by type
  - \`specs/api/\` - API endpoint specifications
  - \`specs/ui/\` - UI component specifications  
  - \`specs/db/\` - Database schema specifications
  - \`specs/job/\` - Background job specifications
- \`carrot/\` - Implementation files (generated from specs)
- \`.carrot/\` - Internal Carrot data (compliance results, cache, logs)

## Getting Started

1. Define your API in \`vibe.yaml\` using the \`grow_spec\` tool
2. Create detailed specifications in \`specs/\` directories
3. Use the specifications to guide implementation
4. Check compliance with \`check_spec_compliance\` tool

## Carrot AI PM Tools

- \`grow_spec\` - Add endpoints to vibe.yaml specification
- \`add_route\` - Add route specifications to the project
- \`check_spec_compliance\` - Validate implementations against specs
- \`search_code\` - Search through specifications and code
- \`format_code\` - Format specification files
- \`commit_changes\` - Commit specification changes

This project follows a spec-first development approach where specifications drive implementation.

## Compliance Tracking

Carrot automatically saves compliance results in \`.carrot/compliance/\` with:
- AST analysis of your code
- Detailed compliance reports
- Historical tracking of improvements
- Hallucination detection for AI-generated code

All compliance data is stored locally and never sent to external servers.
`;
          fs.writeFileSync(readmePath, readmeContent, { mode: 0o644 });
          console.log(`Created README.md: ${readmePath}`);
        }
        
        const createdItems = [];
        if (fs.existsSync(carrotDir)) createdItems.push('carrot/ directory (for implementation files)');
        if (fs.existsSync(dotCarrotDir)) createdItems.push('.carrot/ directory (for internal data: compliance, cache, logs)');
        if (fs.existsSync(specsDir)) createdItems.push('specs/ directory with subdirectories (api/, ui/, db/, job/)');
        if (fs.existsSync(vibeYamlPath)) createdItems.push('vibe.yaml OpenAPI specification');
        if (fs.existsSync(readmePath)) createdItems.push('README.md project documentation');
        
        return {
          content: [
            { 
              type: 'text', 
              text: `Successfully set up Carrot spec-driven project structure in ${repoRoot}\n\n` +
                    `Created:\n${createdItems.map(item => `- ${item}`).join('\n')}\n\n` +
                    `Your project is now ready for spec-first development!\n\n` +
                    `Next steps:\n` +
                    `1. Use 'grow_spec' to add API endpoints to vibe.yaml\n` +
                    `2. Use 'add_route' to create detailed route specifications\n` +
                    `3. Use specifications to guide your implementation\n` +
                    `4. Keep vibe.yaml as your single source of truth for the API`
            }
          ]
        };
      } catch (error) {
        console.error(`Error in setup_carrot tool: ${error}`);
        return {
          content: [
            { 
              type: 'text', 
              text: `Error setting up Carrot structure: ${error instanceof Error ? error.message : String(error)}` 
            }
          ],
          isError: true
        };
      }
    }
  );
} 