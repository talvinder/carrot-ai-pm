import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Import the universal compliance framework
import { 
  ComplianceCheckerFactory, 
  ComplianceResult, 
  ComplianceContext, 
  ArtifactType,
  ComplianceUtils,
  ProjectContext
} from './compliance/base.js';

// Import specific checkers
import { UIComponentComplianceChecker } from './compliance/ui-checker.js';
import { DatabaseComplianceChecker } from './compliance/db-checker.js';
import { CLIComplianceChecker } from './compliance/cli-checker.js';

// Import the existing API checker (to be refactored)
import { checkSpecCompliance as checkAPICompliance } from './check_spec_compliance.js';

/**
 * Universal Spec Compliance Checker Tool
 * 
 * This tool extends beyond API compliance to support multiple artifact types:
 * - api: REST/GraphQL APIs (existing functionality)
 * - ui: React/Vue/Angular components
 * - db: Database schemas
 * - cli: Command line tools
 * - job: Background jobs
 * - page: Web pages/routes
 * - lib: Libraries/modules
 */

// Register compliance checkers
ComplianceCheckerFactory.register('ui', () => new UIComponentComplianceChecker());
ComplianceCheckerFactory.register('db', () => new DatabaseComplianceChecker());
ComplianceCheckerFactory.register('cli', () => new CLIComplianceChecker());
// TODO: Register other checkers as they're implemented

export function checkSpecComplianceUniversalTool(server: McpServer, repoRoot: string): void {
  console.log('Initializing universal check_spec_compliance tool with repo root:', repoRoot);
  
  server.tool(
    'check_spec_compliance',
    {
      type: z.enum(['api', 'ui', 'page', 'cli', 'job', 'db', 'lib']).optional().describe('Artifact type to check (defaults to api for backward compatibility)'),
      identifier: z.string().optional().describe('Artifact identifier (e.g., /api/users, AddToCartButton, users_table)'),
      specPath: z.string().optional().describe('Path to spec file (auto-detected if not provided)'),
      implementationPath: z.string().optional().describe('Path to implementation (auto-detected if not provided)'),
      endpoint: z.string().optional().describe('Specific endpoint to check (for API compatibility)'),
      method: z.string().optional().describe('HTTP method to check (for API compatibility)'),
      projectPath: z.string().optional().describe('Project directory to scan'),
      watchMode: z.boolean().optional().describe('Enable continuous monitoring'),
      generateReport: z.boolean().optional().describe('Generate comprehensive compliance report')
    },
    async ({ 
      type = 'api', // Default to API for backward compatibility
      identifier,
      specPath, 
      implementationPath, 
      endpoint, 
      method, 
      projectPath, 
      watchMode = false,
      generateReport = false
    }: { 
      type?: ArtifactType;
      identifier?: string;
      specPath?: string; 
      implementationPath?: string; 
      endpoint?: string; 
      method?: string; 
      projectPath?: string; 
      watchMode?: boolean;
      generateReport?: boolean;
    }) => {
      try {
        console.log('Universal check_spec_compliance tool called with:', { 
          type, identifier, specPath, implementationPath, endpoint, method, projectPath, watchMode, generateReport 
        });

        const baseDir = projectPath ? path.resolve(repoRoot, projectPath) : repoRoot;
        
        // Handle backward compatibility for API endpoints
        if (type === 'api' && endpoint && method) {
          identifier = identifier || endpoint;
        }

        if (generateReport) {
          return await generateProjectWideReport(baseDir, type);
        }

        if (watchMode) {
          return await enableWatchMode(baseDir, type, identifier);
        }

        // Check if we can handle this artifact type
        const supportedTypes = ComplianceCheckerFactory.getSupportedTypes();
        
        if (type === 'api') {
          // Use existing API compliance checker for backward compatibility
          return await handleAPICompliance(baseDir, { endpoint, method, implementationPath, specPath });
        } else if (supportedTypes.includes(type)) {
          // Use universal compliance framework
          return await handleUniversalCompliance(baseDir, type, identifier, { specPath, implementationPath });
        } else {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: `Artifact type '${type}' is not yet implemented`,
                supportedTypes: ['api', ...supportedTypes],
                message: `The ${type} compliance checker is under development. Currently supported: ${['api', ...supportedTypes].join(', ')}`,
                roadmap: {
                  'ui': 'Available - React/Vue component compliance',
                  'db': 'Coming soon - Database schema compliance',
                  'cli': 'Coming soon - CLI tool compliance',
                  'job': 'Coming soon - Background job compliance',
                  'page': 'Coming soon - Web page compliance',
                  'lib': 'Coming soon - Library compliance'
                }
              }, null, 2)
            }],
            isError: true
          };
        }

      } catch (error: any) {
        console.error('Error in universal check_spec_compliance:', error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Compliance check failed: ${error.message}`,
              troubleshooting: [
                'Ensure spec file exists and is valid',
                'Check file permissions',
                'Verify implementation files exist',
                'Ensure artifact type is supported',
                'Run with verbose logging for more details'
              ]
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );
}

/**
 * Handle API compliance checking (backward compatibility)
 */
async function handleAPICompliance(
  baseDir: string, 
  options: { endpoint?: string; method?: string; implementationPath?: string; specPath?: string }
): Promise<any> {
  const { endpoint, method, implementationPath, specPath } = options;
  
  if (!endpoint || !method || !implementationPath) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: 'API compliance checking requires endpoint, method, and implementationPath parameters',
          usage: {
            example: {
              type: 'api',
              endpoint: '/api/users',
              method: 'POST',
              implementationPath: 'routes/users.js'
            }
          }
        }, null, 2)
      }],
      isError: true
    };
  }

  const defaultSpecPath = path.join(baseDir, 'vibe.yaml');
  const finalSpecPath = specPath ? path.resolve(baseDir, specPath) : defaultSpecPath;

  if (!fs.existsSync(finalSpecPath)) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: `Spec file not found: ${finalSpecPath}. Generate a spec first using grow_spec tool.`,
          suggestions: [
            'Run grow_spec tool to generate OpenAPI specification',
            'Ensure vibe.yaml exists in your project root',
            'Check the specPath parameter if using custom location'
          ]
        }, null, 2)
      }],
      isError: true
    };
  }

  // Use existing API compliance checker
  const result = await checkAPICompliance({
    specPath: finalSpecPath,
    implementationPath: path.resolve(baseDir, implementationPath),
    endpoint,
    method
  });

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        type: 'api_compliance',
        result,
        summary: generateLegacyComplianceSummary(result),
        actionableSteps: generateLegacyActionableSteps(result)
      }, null, 2)
    }]
  };
}

/**
 * Handle universal compliance checking for non-API artifacts
 */
async function handleUniversalCompliance(
  baseDir: string,
  type: ArtifactType,
  identifier?: string,
  options: { specPath?: string; implementationPath?: string } = {}
): Promise<any> {
  if (!identifier) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: `Identifier is required for ${type} compliance checking`,
          usage: {
            examples: {
              ui: { type: 'ui', identifier: 'AddToCartButton' },
              db: { type: 'db', identifier: 'users_table' },
              cli: { type: 'cli', identifier: 'deploy' }
            }
          }
        }, null, 2)
      }],
      isError: true
    };
  }

  // Auto-detect spec and implementation paths
  const specPath = options.specPath || await autoDetectSpecPath(baseDir, type, identifier);
  const implementationPath = options.implementationPath || await autoDetectImplementationPath(baseDir, type, identifier);

  if (!specPath || !fs.existsSync(specPath)) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: `Spec file not found for ${type}:${identifier}`,
          suggestions: [
            `Run grow_spec tool with type=${type} and identifier=${identifier}`,
            'Check if spec file exists in specs/ directory',
            'Provide explicit specPath parameter'
          ],
          expectedLocation: specPath || `specs/${type}/${identifier}-*.yaml`
        }, null, 2)
      }],
      isError: true
    };
  }

  if (!implementationPath || !fs.existsSync(implementationPath)) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: `Implementation file not found for ${type}:${identifier}`,
          suggestions: [
            'Check if implementation file exists',
            'Provide explicit implementationPath parameter',
            'Ensure file path is correct'
          ],
          expectedLocation: implementationPath || `Auto-detection failed`
        }, null, 2)
      }],
      isError: true
    };
  }

  // Load spec and implementation
  const spec = await loadArtifactSpec(specPath);
  const implementation = await loadImplementation(implementationPath, type);
  
  // Create compliance context
  const context = await createComplianceContext(baseDir, type);
  
  // Get compliance checker and run check
  const checker = ComplianceCheckerFactory.create(type);
  const result = await checker.checkCompliance(spec, implementation, context);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        type: `${type}_compliance`,
        result,
        summary: ComplianceUtils.generateSummary(result),
        actionableSteps: generateUniversalActionableSteps(result),
        dimensions: Object.entries(result.dimensions).map(([name, dim]) => ({
          name: dim.name,
          score: `${(dim.score * 100).toFixed(1)}%`,
          status: dim.isCompliant ? '✅' : '❌',
          issues: dim.issues.length
        }))
      }, null, 2)
    }]
  };
}

/**
 * Generate project-wide compliance report
 */
async function generateProjectWideReport(baseDir: string, type?: ArtifactType): Promise<any> {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        error: 'Project-wide compliance reporting is not yet implemented',
        message: 'This feature is under development. Please use specific artifact checking instead.',
        plannedFeatures: [
          'Scan all specs in project',
          'Generate compliance dashboard',
          'Cross-artifact dependency checking',
          'Compliance trend analysis'
        ],
        usage: {
          example: {
            type: 'ui',
            identifier: 'AddToCartButton'
          }
        },
        status: 'not_implemented'
      }, null, 2)
    }],
    isError: true
  };
}

/**
 * Enable watch mode for continuous monitoring
 */
async function enableWatchMode(baseDir: string, type: ArtifactType, identifier?: string): Promise<any> {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        error: 'Watch mode is not yet implemented',
        message: 'Continuous monitoring is under development. Please use one-time checking instead.',
        plannedFeatures: [
          'File system watching',
          'Real-time compliance updates',
          'IDE integration',
          'Notification system'
        ],
        usage: {
          example: {
            type: 'ui',
            identifier: 'AddToCartButton'
          }
        },
        status: 'not_implemented'
      }, null, 2)
    }],
    isError: true
  };
}

/**
 * Auto-detect spec file path based on type and identifier
 */
async function autoDetectSpecPath(baseDir: string, type: ArtifactType, identifier: string): Promise<string | null> {
  const specsDir = path.join(baseDir, 'specs', type);
  
  if (!fs.existsSync(specsDir)) {
    return null;
  }

  // Look for spec files matching the identifier
  const files = fs.readdirSync(specsDir);
  const matchingFile = files.find(file => 
    file.includes(identifier.toLowerCase().replace(/[^a-z0-9]/g, '-')) &&
    (file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json'))
  );

  return matchingFile ? path.join(specsDir, matchingFile) : null;
}

/**
 * Auto-detect implementation file path based on type and identifier
 */
async function autoDetectImplementationPath(baseDir: string, type: ArtifactType, identifier: string): Promise<string | null> {
  const searchPaths: Record<ArtifactType, string[]> = {
    api: ['src/app/api', 'routes', 'api', 'src/routes'],
    ui: ['src/components', 'components', 'src/ui', 'ui'],
    page: ['src/pages', 'pages', 'src/app'],
    cli: ['src/cli', 'cli', 'bin'],
    job: ['src/jobs', 'jobs', 'src/workers', 'workers'],
    db: ['src/db', 'db', 'migrations', 'schema'],
    lib: ['src/lib', 'lib', 'src']
  };

  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.sql'];
  
  for (const searchPath of searchPaths[type] || []) {
    const fullPath = path.join(baseDir, searchPath);
    if (!fs.existsSync(fullPath)) continue;

    // Search recursively for files matching the identifier
    const found = await findFileRecursively(fullPath, identifier, extensions);
    if (found) return found;
  }

  return null;
}

/**
 * Recursively find file matching identifier
 */
async function findFileRecursively(dir: string, identifier: string, extensions: string[]): Promise<string | null> {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      const found = await findFileRecursively(fullPath, identifier, extensions);
      if (found) return found;
    } else if (item.isFile()) {
      const nameWithoutExt = path.parse(item.name).name;
      if (nameWithoutExt.toLowerCase().includes(identifier.toLowerCase()) &&
          extensions.some(ext => item.name.endsWith(ext))) {
        return fullPath;
      }
    }
  }
  
  return null;
}

/**
 * Load artifact specification
 */
async function loadArtifactSpec(specPath: string): Promise<any> {
  const content = fs.readFileSync(specPath, 'utf8');
  
  if (specPath.endsWith('.json')) {
    return JSON.parse(content);
  } else {
    return yaml.load(content);
  }
}

/**
 * Load implementation based on artifact type
 */
async function loadImplementation(implementationPath: string, type: ArtifactType): Promise<any> {
  const content = fs.readFileSync(implementationPath, 'utf8');
  const ext = path.extname(implementationPath);
  
  switch (type) {
    case 'ui':
      return {
        filePath: implementationPath,
        content,
        framework: detectFramework(content),
        language: ext === '.ts' || ext === '.tsx' ? 'typescript' : 'javascript',
        hasTypeDefinitions: content.includes('interface') || content.includes('type ')
      };
    
    case 'db':
      return {
        filePath: implementationPath,
        content,
        dbType: detectDatabaseType(content),
        language: ext === '.sql' ? 'sql' : 'javascript',
        hasSchema: content.includes('CREATE TABLE') || content.includes('Schema'),
        hasMigrations: content.includes('migration') || content.includes('migrate')
      };
    
    default:
      return {
        filePath: implementationPath,
        content,
        language: ext === '.ts' ? 'typescript' : 'javascript'
      };
  }
}

/**
 * Detect framework from component content
 */
function detectFramework(content: string): 'react' | 'vue' | 'angular' {
  if (content.includes('React') || content.includes('jsx') || content.includes('useState')) {
    return 'react';
  } else if (content.includes('Vue') || content.includes('<template>')) {
    return 'vue';
  } else if (content.includes('@Component') || content.includes('Angular')) {
    return 'angular';
  }
  return 'react'; // Default assumption
}

/**
 * Detect database type from content
 */
function detectDatabaseType(content: string): 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' {
  if (content.includes('SERIAL') || content.includes('BIGSERIAL') || content.includes('TIMESTAMP WITH TIME ZONE')) {
    return 'postgresql';
  } else if (content.includes('AUTO_INCREMENT') || content.includes('TINYINT') || content.includes('MEDIUMINT')) {
    return 'mysql';
  } else if (content.includes('AUTOINCREMENT') || content.includes('INTEGER PRIMARY KEY')) {
    return 'sqlite';
  } else if (content.includes('mongoose') || content.includes('Schema') || content.includes('ObjectId')) {
    return 'mongodb';
  }
  return 'postgresql'; // Default assumption
}

/**
 * Create compliance context
 */
async function createComplianceContext(baseDir: string, type: ArtifactType): Promise<ComplianceContext> {
  const projectContext = await analyzeProjectContext(baseDir);
  
  return {
    artifactType: type,
    projectPath: baseDir,
    projectContext,
    toolchain: detectToolchain(baseDir),
    conventions: [], // TODO: Load from project conventions
    environment: 'development'
  };
}

/**
 * Analyze project context
 */
async function analyzeProjectContext(baseDir: string): Promise<ProjectContext> {
  const packageJsonPath = path.join(baseDir, 'package.json');
  let dependencies: Record<string, string> = {};
  let projectType: ProjectContext['type'] = 'unknown';
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (dependencies.next) projectType = 'nextjs';
    else if (dependencies.react) projectType = 'react';
    else if (dependencies.vue) projectType = 'vue';
    else if (dependencies.express) projectType = 'express';
    else if (dependencies.fastify) projectType = 'fastify';
  }
  
  return {
    type: projectType,
    language: fs.existsSync(path.join(baseDir, 'tsconfig.json')) ? 'typescript' : 'javascript',
    framework: Object.keys(dependencies).filter(dep => 
      ['react', 'vue', 'angular', 'express', 'fastify', 'next'].includes(dep)
    ),
    dependencies,
    patterns: [], // TODO: Detect patterns
    features: [] // TODO: Detect features
  };
}

/**
 * Detect toolchain
 */
function detectToolchain(baseDir: string): string[] {
  const toolchain: string[] = [];
  
  if (fs.existsSync(path.join(baseDir, 'package.json'))) toolchain.push('npm');
  if (fs.existsSync(path.join(baseDir, 'tsconfig.json'))) toolchain.push('typescript');
  if (fs.existsSync(path.join(baseDir, '.eslintrc.js'))) toolchain.push('eslint');
  if (fs.existsSync(path.join(baseDir, 'jest.config.js'))) toolchain.push('jest');
  
  return toolchain;
}

/**
 * Generate actionable steps for universal compliance results
 */
function generateUniversalActionableSteps(result: ComplianceResult): string[] {
  const steps: string[] = [];
  
  if (result.suggestions.length > 0) {
    steps.push('Review and apply suggested fixes:');
    result.suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .forEach((suggestion, index) => {
        const priority = suggestion.priority === 'high' ? '🔴' : 
                        suggestion.priority === 'medium' ? '🟡' : '🟢';
        steps.push(`  ${index + 1}. ${priority} ${suggestion.description}`);
        if (suggestion.code) {
          steps.push(`     Code: ${suggestion.code}`);
        }
      });
  }
  
  const criticalIssues = ComplianceUtils.filterIssuesBySeverity(result.issues, 'error');
  if (criticalIssues.length > 0) {
    steps.push(`Fix ${criticalIssues.length} critical error(s) first`);
  }
  
  if (!result.isCompliant) {
    steps.push('Re-run compliance check after making changes');
  }
  
  // Add dimension-specific guidance
  const failingDimensions = Object.values(result.dimensions).filter(d => !d.isCompliant);
  if (failingDimensions.length > 0) {
    steps.push('Focus on improving these areas:');
    failingDimensions.forEach(dim => {
      steps.push(`  - ${dim.name}: ${dim.issues.length} issue(s)`);
    });
  }
  
  return steps;
}

/**
 * Legacy compliance summary (for API backward compatibility)
 */
function generateLegacyComplianceSummary(result: any): string {
  const status = result.isCompliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT';
  const score = `${(result.score * 100).toFixed(1)}%`;
  const issueCount = result.issues.length;
  
  return `${status} (${score}) - ${issueCount} issues found`;
}

/**
 * Legacy actionable steps (for API backward compatibility)
 */
function generateLegacyActionableSteps(result: any): string[] {
  const steps: string[] = [];
  
  if (result.suggestions.length > 0) {
    steps.push('Review and apply suggested fixes:');
    result.suggestions.forEach((suggestion: any, index: number) => {
      steps.push(`  ${index + 1}. ${suggestion.description}`);
    });
  }
  
  if (result.issues.filter((i: any) => i.severity === 'error').length > 0) {
    steps.push('Fix critical errors first (marked as severity: error)');
  }
  
  if (!result.isCompliant) {
    steps.push('Re-run compliance check after making changes');
  }
  
  return steps;
} 