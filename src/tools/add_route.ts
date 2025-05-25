import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Define the HTTP methods enum
const HttpMethod = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']);
type HttpMethodType = z.infer<typeof HttpMethod>;

interface ProjectContext {
  domain: string;
  existingSchemas: any[];
  patterns: string[];
  apiStyle: 'REST' | 'GraphQL' | 'RPC';
}

/**
 * Analyze project context to understand domain and patterns
 */
function analyzeProjectContext(repoRoot: string, routePath: string): ProjectContext {
  const context: ProjectContext = {
    domain: 'generic',
    existingSchemas: [],
    patterns: [],
    apiStyle: 'REST'
  };

  try {
    // Analyze route path for domain hints
    const pathSegments = routePath.toLowerCase().split('/').filter(p => p);
    
    // Domain detection from path
    if (pathSegments.includes('spotify') || pathSegments.includes('music') || pathSegments.includes('playlist')) {
      context.domain = 'spotify';
    } else if (pathSegments.includes('user') || pathSegments.includes('auth')) {
      context.domain = 'user_management';
    } else if (pathSegments.includes('api')) {
      context.domain = 'api';
    }

    // Look for existing type definitions
    const typesFiles = [
      path.join(repoRoot, 'src/app/api/spotify/types.ts'),
      path.join(repoRoot, 'src/types.ts'),
      path.join(repoRoot, 'types.ts')
    ];

    for (const typesFile of typesFiles) {
      if (fs.existsSync(typesFile)) {
        const content = fs.readFileSync(typesFile, 'utf8');
        
        // Extract schema patterns
        if (content.includes('playlist')) {
          context.patterns.push('playlist_management');
        }
        if (content.includes('user')) {
          context.patterns.push('user_management');
        }
        if (content.includes('zod') || content.includes('z.')) {
          context.patterns.push('zod_validation');
        }
      }
    }

    // Look for existing API routes to understand patterns
    const apiDir = path.join(repoRoot, 'src/app/api');
    if (fs.existsSync(apiDir)) {
      const scanDirectory = (dir: string) => {
        try {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const itemPath = path.join(dir, item);
            if (fs.statSync(itemPath).isDirectory()) {
              scanDirectory(itemPath);
            } else if (item === 'route.ts') {
              const content = fs.readFileSync(itemPath, 'utf8');
              if (content.includes('NextRequest') && content.includes('NextResponse')) {
                context.patterns.push('nextjs_api');
              }
              if (content.includes('x-user-id')) {
                context.patterns.push('user_auth_header');
              }
            }
          }
        } catch (err) {
          // Ignore errors in directory scanning
        }
      };
      scanDirectory(apiDir);
    }

  } catch (error) {
    console.warn('Error analyzing project context:', error);
  }

  return context;
}

/**
 * Generate domain-specific schema based on context
 */
function generateDomainSchema(context: ProjectContext, routePath: string, method: string): any {
  const pathSegments = routePath.split('/').filter(p => p);
  const resourceName = pathSegments[pathSegments.length - 1] || 'resource';
  
  switch (context.domain) {
    case 'spotify':
      return generateSpotifySchema(resourceName, method, context);
    case 'user_management':
      return generateUserSchema(resourceName, method, context);
    default:
      return generateGenericSchema(resourceName, method, context);
  }
}

/**
 * Generate Spotify-specific schemas
 */
function generateSpotifySchema(resourceName: string, method: string, context: ProjectContext): any {
  if (resourceName.includes('playlist')) {
    const playlistSchema = {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Unique playlist identifier' },
        name: { type: 'string', description: 'Playlist name', maxLength: 100 },
        description: { type: 'string', description: 'Playlist description', maxLength: 300 },
        public: { type: 'boolean', description: 'Whether the playlist is public', default: true },
        collaborative: { type: 'boolean', description: 'Whether the playlist is collaborative', default: false },
        userId: { type: 'string', description: 'Owner user ID' },
        tracks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Track ID' },
              name: { type: 'string', description: 'Track name' },
              artist: { type: 'string', description: 'Artist name' },
              duration: { type: 'integer', description: 'Track duration in seconds' },
              addedAt: { type: 'string', format: 'date-time', description: 'When track was added' }
            }
          }
        },
        createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
        updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
      },
      required: ['id', 'name', 'userId']
    };

    const createSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Playlist name', maxLength: 100 },
        description: { type: 'string', description: 'Playlist description', maxLength: 300 },
        public: { type: 'boolean', description: 'Whether the playlist is public', default: true },
        collaborative: { type: 'boolean', description: 'Whether the playlist is collaborative', default: false }
      },
      required: ['name']
    };

    const updateSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Playlist name', maxLength: 100 },
        description: { type: 'string', description: 'Playlist description', maxLength: 300 },
        public: { type: 'boolean', description: 'Whether the playlist is public' },
        collaborative: { type: 'boolean', description: 'Whether the playlist is collaborative' }
      },
      additionalProperties: false
    };

    return {
      resource: playlistSchema,
      create: createSchema,
      update: updateSchema,
      responses: {
        '200': {
          description: 'Playlist operation successful',
          content: {
            'application/json': {
              schema: playlistSchema
            }
          }
        },
        '201': {
          description: 'Playlist created successfully',
          content: {
            'application/json': {
              schema: playlistSchema
            }
          }
        },
        '400': {
          description: 'Invalid playlist data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Invalid playlist data' },
                  details: { type: 'object', additionalProperties: true }
                }
              }
            }
          }
        },
        '403': {
          description: 'Unauthorized access to playlist',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Unauthorized access' }
                }
              }
            }
          }
        },
        '404': {
          description: 'Playlist not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Playlist not found' }
                }
              }
            }
          }
        }
      }
    };
  }

  // Default Spotify resource schema
  return generateGenericSchema(resourceName, method, context);
}

/**
 * Generate user management schemas
 */
function generateUserSchema(resourceName: string, method: string, context: ProjectContext): any {
  // Implementation for user-related schemas
  return generateGenericSchema(resourceName, method, context);
}

/**
 * Generate generic schemas as fallback
 */
function generateGenericSchema(resourceName: string, method: string, context: ProjectContext): any {
  const baseSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique identifier' },
      name: { type: 'string', description: 'Resource name' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    },
    required: ['id', 'name']
  };

  return {
    resource: baseSchema,
    create: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
    update: { type: 'object', properties: { name: { type: 'string' } } },
    responses: {
      '200': { description: 'Successful response', content: { 'application/json': { schema: baseSchema } } },
      '400': { description: 'Bad request' },
      '404': { description: 'Resource not found' }
    }
  };
}

/**
 * Generate context-aware test cases
 */
function generateTestCases(context: ProjectContext, routePath: string, method: string): any[] {
  const testCases = [];

  if (context.domain === 'spotify' && routePath.includes('playlist')) {
    switch (method) {
      case 'GET':
        testCases.push(
          {
            name: 'get_user_playlist_success',
            description: 'Successfully retrieve user\'s playlist',
            setup: 'Create a playlist for user123',
            input: { headers: { 'x-user-id': 'user123' } },
            expectedStatus: 200,
            expectedResponse: { id: 'playlist123', name: 'Test Playlist', userId: 'user123' }
          },
          {
            name: 'get_playlist_unauthorized',
            description: 'Attempt to access another user\'s playlist',
            setup: 'Create a playlist for user456',
            input: { headers: { 'x-user-id': 'user123' } },
            expectedStatus: 403,
            expectedResponse: { error: 'Unauthorized access' }
          },
          {
            name: 'get_playlist_not_found',
            description: 'Attempt to get non-existent playlist',
            input: { headers: { 'x-user-id': 'user123' } },
            expectedStatus: 404,
            expectedResponse: { error: 'Playlist not found' }
          }
        );
        break;

      case 'PATCH':
        testCases.push(
          {
            name: 'update_playlist_success',
            description: 'Successfully update playlist name and description',
            setup: 'Create a playlist for user123',
            input: {
              headers: { 'x-user-id': 'user123' },
              body: { name: 'Updated Playlist', description: 'New description' }
            },
            expectedStatus: 200,
            expectedResponse: { name: 'Updated Playlist', description: 'New description' }
          },
          {
            name: 'update_playlist_partial',
            description: 'Successfully update only playlist name',
            setup: 'Create a playlist for user123',
            input: {
              headers: { 'x-user-id': 'user123' },
              body: { name: 'New Name Only' }
            },
            expectedStatus: 200,
            expectedResponse: { name: 'New Name Only' }
          },
          {
            name: 'update_playlist_invalid_data',
            description: 'Attempt to update with invalid data',
            setup: 'Create a playlist for user123',
            input: {
              headers: { 'x-user-id': 'user123' },
              body: { name: '', invalidField: 'value' }
            },
            expectedStatus: 400,
            expectedResponse: { error: 'Invalid playlist data' }
          }
        );
        break;

      case 'DELETE':
        testCases.push(
          {
            name: 'delete_playlist_success',
            description: 'Successfully delete user\'s playlist',
            setup: 'Create a playlist for user123',
            input: { headers: { 'x-user-id': 'user123' } },
            expectedStatus: 204
          },
          {
            name: 'delete_playlist_unauthorized',
            description: 'Attempt to delete another user\'s playlist',
            setup: 'Create a playlist for user456',
            input: { headers: { 'x-user-id': 'user123' } },
            expectedStatus: 403,
            expectedResponse: { error: 'Unauthorized access' }
          }
        );
        break;
    }
  }

  // Add generic test cases if no specific ones were generated
  if (testCases.length === 0) {
    testCases.push(
      {
        name: 'successful_request',
        description: 'Test successful request handling',
        input: {},
        expectedStatus: method === 'POST' ? 201 : 200
      },
      {
        name: 'invalid_request',
        description: 'Test invalid request handling',
        input: {},
        expectedStatus: 400
      }
    );
  }

  return testCases;
}

/**
 * Configure add_route tool for creating context-aware route specifications
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
        // Analyze project context
        const context = analyzeProjectContext(repoRoot, routePath);
        console.log('Detected project context:', context);

        // Normalize the route path
        const normalizedPath = routePath.startsWith('/') ? routePath : `/${routePath}`;
        
        // Generate domain-specific schemas
        const domainSchemas = generateDomainSchema(context, normalizedPath, method);
        
        // 1. Add route to vibe.yaml OpenAPI specification
        const vibeYamlPath = path.join(repoRoot, 'vibe.yaml');
        let spec: any;
        
        if (fs.existsSync(vibeYamlPath)) {
          spec = yaml.load(fs.readFileSync(vibeYamlPath, 'utf8')) as any;
        } else {
          // Create basic spec if it doesn't exist
          spec = {
            openapi: '3.0.0',
            info: {
              title: `${context.domain === 'spotify' ? 'Spotify' : 'API'} Specification`,
              version: '1.0.0',
              description: `${context.domain === 'spotify' ? 'Spotify playlist management' : 'API'} specification generated by Carrot MCP`
            },
            paths: {}
          };
        }

        // Ensure paths object exists
        if (!spec.paths) {
          spec.paths = {};
        }

        // Ensure the path exists in the spec
        if (!spec.paths[normalizedPath]) {
          spec.paths[normalizedPath] = {};
        }

        // Add the method to the path with domain-specific details
        const methodLower = method.toLowerCase();
        const operation: any = {
          summary: generateOperationSummary(context, normalizedPath, method),
          description: generateOperationDescription(context, normalizedPath, method, handler_name),
          operationId: handler_name,
          tags: [context.domain === 'spotify' ? 'Playlists' : 'API'],
          responses: domainSchemas.responses
        };

        // Add parameters for path variables
        if (normalizedPath.includes('{') && normalizedPath.includes('}')) {
          operation.parameters = extractPathParameters(normalizedPath, context);
        }

        // Add authentication if pattern detected
        if (context.patterns.includes('user_auth_header')) {
          operation.parameters = operation.parameters || [];
          operation.parameters.push({
            in: 'header',
            name: 'x-user-id',
            required: true,
            schema: { type: 'string' },
            description: 'User ID for authentication'
          });
        }

        // Add request body for POST/PUT/PATCH methods
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          const schemaKey = method === 'POST' ? 'create' : 'update';
          operation.requestBody = {
            description: `${method === 'POST' ? 'Create' : 'Update'} request payload`,
            required: true,
            content: {
              'application/json': {
                schema: domainSchemas[schemaKey]
              }
            }
          };
        }

        spec.paths[normalizedPath][methodLower] = operation;

        // Ensure components section exists
        if (!spec.components) {
          spec.components = {};
        }
        if (!spec.components.schemas) {
          spec.components.schemas = {};
        }

        // Add domain-specific schemas to components
        const resourceName = extractResourceName(normalizedPath);
        const capitalizedResourceName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
        
        spec.components.schemas[capitalizedResourceName] = domainSchemas.resource;
        if (domainSchemas.create) {
          spec.components.schemas[`Create${capitalizedResourceName}Request`] = domainSchemas.create;
        }
        if (domainSchemas.update) {
          spec.components.schemas[`Update${capitalizedResourceName}Request`] = domainSchemas.update;
        }

        // Write updated spec back to vibe.yaml
        fs.writeFileSync(vibeYamlPath, yaml.dump(spec, { indent: 2 }));
        
        // 2. Create detailed route specification file
        const specsApiDir = path.join(repoRoot, 'specs', 'api');
        if (!fs.existsSync(specsApiDir)) {
          fs.mkdirSync(specsApiDir, { recursive: true });
        }

        // Create a spec file for this route
        const routeSpecFileName = `${handler_name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()}.json`;
        const routeSpecPath = path.join(specsApiDir, routeSpecFileName);

        // Generate context-aware test cases
        const testCases = generateTestCases(context, normalizedPath, method);

        const routeSpec = {
          route: {
            path: normalizedPath,
            method: method,
            handler: handler_name,
            summary: generateOperationSummary(context, normalizedPath, method),
            description: generateOperationDescription(context, normalizedPath, method, handler_name),
            domain: context.domain,
            created: new Date().toISOString()
          },
          context: {
            domain: context.domain,
            patterns: context.patterns,
            apiStyle: context.apiStyle
          },
          implementation: {
            status: 'specification',
            requirements: generateImplementationRequirements(context, method),
            dependencies: generateDependencies(context),
            notes: `Generated by Carrot AI PM add_route tool with ${context.domain} domain context`
          },
          testing: {
            testCases: testCases,
            coverage: {
              successCases: testCases.filter(tc => tc.expectedStatus < 400).length,
              errorCases: testCases.filter(tc => tc.expectedStatus >= 400).length,
              total: testCases.length
            }
          },
          schemas: {
            resource: domainSchemas.resource,
            create: domainSchemas.create,
            update: domainSchemas.update
          }
        };

        fs.writeFileSync(routeSpecPath, JSON.stringify(routeSpec, null, 2));
        
        return {
          content: [{ 
            type: 'text', 
            text: `Successfully added ${method} route specification for ${normalizedPath}\n\n` +
                  `Context Analysis:\n` +
                  `- Domain: ${context.domain}\n` +
                  `- Patterns: ${context.patterns.join(', ') || 'none detected'}\n` +
                  `- API Style: ${context.apiStyle}\n\n` +
                  `Updated:\n` +
                  `- vibe.yaml: Added ${methodLower} operation with domain-specific schemas\n` +
                  `- ${path.relative(repoRoot, routeSpecPath)}: Created detailed route specification with ${testCases.length} test cases\n\n` +
                  `The route specification includes domain-specific schemas, comprehensive test cases, and implementation guidance.`
          }]
        };
      } catch (error) {
        return {
          content: [{ 
            type: 'text', 
            text: `Error adding route specification: ${error instanceof Error ? error.message : String(error)}` 
          }],
          isError: true
        };
      }
    }
  );
}

// Helper functions

function generateOperationSummary(context: ProjectContext, path: string, method: string): string {
  if (context.domain === 'spotify' && path.includes('playlist')) {
    const hasId = path.includes('{') && path.includes('}');
    switch (method) {
      case 'GET':
        return hasId ? 'Get playlist by ID' : 'List user playlists';
      case 'POST':
        return 'Create new playlist';
      case 'PATCH':
        return 'Update playlist';
      case 'DELETE':
        return 'Delete playlist';
      default:
        return `${method} playlist operation`;
    }
  }
  return `${method} ${path}`;
}

function generateOperationDescription(context: ProjectContext, path: string, method: string, handler: string): string {
  if (context.domain === 'spotify' && path.includes('playlist')) {
    const hasId = path.includes('{') && path.includes('}');
    switch (method) {
      case 'GET':
        return hasId 
          ? 'Retrieve a specific playlist by ID. Users can only access their own playlists.'
          : 'Retrieve all playlists for the authenticated user with pagination support.';
      case 'POST':
        return 'Create a new playlist for the authenticated user. Playlist name is required.';
      case 'PATCH':
        return 'Update an existing playlist. Users can only update their own playlists. All fields are optional for partial updates.';
      case 'DELETE':
        return 'Delete a playlist. Users can only delete their own playlists.';
      default:
        return `${method} operation for playlist management. Handler: ${handler}`;
    }
  }
  return `${method} operation for ${path}. Handler: ${handler}`;
}

function extractPathParameters(path: string, context: ProjectContext): any[] {
  const params = [];
  const matches = path.match(/\{([^}]+)\}/g);
  
  if (matches) {
    for (const match of matches) {
      const paramName = match.slice(1, -1); // Remove { and }
      let description = `${paramName} parameter`;
      
      if (context.domain === 'spotify' && paramName.includes('playlist')) {
        description = 'Unique playlist identifier';
      } else if (paramName.includes('user')) {
        description = 'User identifier';
      } else if (paramName.includes('id')) {
        description = 'Unique resource identifier';
      }
      
      params.push({
        in: 'path',
        name: paramName,
        required: true,
        schema: { type: 'string' },
        description: description
      });
    }
  }
  
  return params;
}

function extractResourceName(path: string): string {
  const segments = path.split('/').filter(p => p && !p.includes('{'));
  return segments[segments.length - 1] || 'resource';
}

function generateImplementationRequirements(context: ProjectContext, method: string): string[] {
  const requirements = [];
  
  if (context.patterns.includes('zod_validation')) {
    requirements.push('Implement Zod schema validation');
  } else {
    requirements.push('Implement request validation');
  }
  
  if (context.patterns.includes('user_auth_header')) {
    requirements.push('Implement user authentication via x-user-id header');
    requirements.push('Add authorization checks for resource ownership');
  }
  
  if (context.patterns.includes('nextjs_api')) {
    requirements.push('Use NextRequest and NextResponse types');
    requirements.push('Implement proper error handling with status codes');
  }
  
  requirements.push('Add comprehensive logging');
  requirements.push('Include unit and integration tests');
  
  if (method === 'PATCH') {
    requirements.push('Implement partial update logic');
    requirements.push('Validate at least one field is provided for updates');
  }
  
  return requirements;
}

function generateDependencies(context: ProjectContext): string[] {
  const dependencies = [];
  
  if (context.patterns.includes('zod_validation')) {
    dependencies.push('zod');
  }
  
  if (context.patterns.includes('nextjs_api')) {
    dependencies.push('next');
  }
  
  if (context.domain === 'spotify') {
    dependencies.push('spotify-web-api-node (if using external API)');
  }
  
  return dependencies;
} 