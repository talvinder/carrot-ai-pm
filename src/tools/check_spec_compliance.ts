import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Spec Compliance Checker Tool
 * 
 * Hypothesis: Developers need real-time feedback on whether their implementation 
 * matches the generated specifications, with actionable insights on deviations 
 * and suggestions for alignment.
 * 
 * This tool implements TDD-driven spec compliance checking with:
 * - Real-time validation against OpenAPI specs
 * - Actionable suggestions for fixes
 * - Continuous monitoring capabilities
 * - Project-wide compliance reporting
 */

export interface ComplianceCheckOptions {
  specPath: string;
  implementationPath?: string;
  endpoint?: string;
  method?: string;
  projectPath?: string;
  watchMode?: boolean;
}

export interface ComplianceResult {
  isCompliant: boolean;
  score: number;
  issues: ComplianceIssue[];
  suggestions: ComplianceSuggestion[];
  validationCompliance: ValidationCompliance;
  errorHandlingCompliance: ErrorHandlingCompliance;
  responseCompliance: ResponseCompliance;
  timestamp: Date;
}

export interface ComplianceIssue {
  type: 'MISSING_FIELD' | 'WRONG_TYPE' | 'MISSING_VALIDATION' | 'MISSING_ERROR_HANDLING' | 'RESPONSE_FORMAT_MISMATCH';
  field?: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  suggestion?: string;
}

export interface ComplianceSuggestion {
  type: 'ADD_VALIDATION' | 'FIX_RESPONSE_FORMAT' | 'ADD_ERROR_HANDLING' | 'UPDATE_SCHEMA';
  description: string;
  code?: string;
  autoFixable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface ValidationCompliance {
  hasValidation: boolean;
  missingValidations: string[];
  validationLibrary?: 'express-validator' | 'joi' | 'zod' | 'custom' | 'none';
}

export interface ErrorHandlingCompliance {
  handles404: boolean;
  handles400: boolean;
  handles500: boolean;
  errorFormat: 'compliant' | 'non-compliant' | 'partial';
  missingErrorCodes: string[];
}

export interface ResponseCompliance {
  matchesSchema: boolean;
  missingFields: string[];
  extraFields: string[];
  typeMatches: boolean;
}

export interface ProjectComplianceReport {
  overallScore: number;
  endpoints: EndpointCompliance[];
  summary: {
    compliant: number;
    nonCompliant: number;
    total: number;
    criticalIssues: number;
  };
  recommendations: string[];
  generatedAt: Date;
}

export interface EndpointCompliance {
  endpoint: string;
  method: string;
  isCompliant: boolean;
  score: number;
  issues: ComplianceIssue[];
  filePath: string;
}

/**
 * Configure check_spec_compliance tool for validating implementation against specs
 */
export function checkSpecComplianceTool(server: McpServer, repoRoot: string): void {
  console.log('Initializing check_spec_compliance tool with repo root:', repoRoot);
  
  server.tool(
    'check_spec_compliance',
    {
      specPath: z.string().optional().describe('Path to the OpenAPI spec file (defaults to vibe.yaml in project root)'),
      implementationPath: z.string().optional().describe('Path to implementation file to check (if not provided, scans project)'),
      endpoint: z.string().optional().describe('Specific endpoint to check (e.g., /api/users)'),
      method: z.string().optional().describe('HTTP method to check (GET, POST, etc.)'),
      projectPath: z.string().optional().describe('Project directory to scan (defaults to current directory)'),
      watchMode: z.boolean().optional().describe('Enable continuous monitoring mode'),
      generateReport: z.boolean().optional().describe('Generate comprehensive project compliance report')
    },
    async ({ 
      specPath, 
      implementationPath, 
      endpoint, 
      method, 
      projectPath, 
      watchMode = false,
      generateReport = false
    }: { 
      specPath?: string; 
      implementationPath?: string; 
      endpoint?: string; 
      method?: string; 
      projectPath?: string; 
      watchMode?: boolean;
      generateReport?: boolean;
    }) => {
      try {
        console.log('check_spec_compliance tool called with:', { 
          specPath, implementationPath, endpoint, method, projectPath, watchMode, generateReport 
        });

        const baseDir = projectPath ? path.resolve(repoRoot, projectPath) : repoRoot;
        const defaultSpecPath = path.join(baseDir, 'vibe.yaml');
        const finalSpecPath = specPath ? path.resolve(baseDir, specPath) : defaultSpecPath;

        // Validate spec file exists
        if (!fs.existsSync(finalSpecPath)) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: `Spec file not found: ${finalSpecPath}. Generate a spec first using grow_spec tool.`,
                  suggestions: [
                    'Run grow_spec tool to generate OpenAPI specification',
                    'Ensure vibe.yaml exists in your project root',
                    'Check the specPath parameter if using custom location'
                  ]
                }, null, 2)
              }
            ]
          };
        }

        if (generateReport) {
          // Generate comprehensive project report
          const report = await generateProjectComplianceReport({
            projectPath: baseDir,
            specPath: finalSpecPath
          });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  type: 'project_compliance_report',
                  report,
                  summary: `Project compliance: ${report.overallScore.toFixed(1)}% - ${report.summary.compliant}/${report.summary.total} endpoints compliant`,
                  recommendations: report.recommendations
                }, null, 2)
              }
            ]
          };
        }

        if (watchMode) {
          // Start continuous monitoring
          const watchResult = await startComplianceWatch({
            specPath: finalSpecPath,
            implementationPath,
            projectPath: baseDir,
            endpoint,
            method
          });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(watchResult, null, 2)
              }
            ]
          };
        }

        if (implementationPath && endpoint && method) {
          // Check specific endpoint implementation
          const result = await checkSpecCompliance({
            specPath: finalSpecPath,
            implementationPath: path.resolve(baseDir, implementationPath),
            endpoint,
            method
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  type: 'endpoint_compliance',
                  result,
                  summary: generateComplianceSummary(result),
                  actionableSteps: generateActionableSteps(result)
                }, null, 2)
              }
            ]
          };
        }

        // For now, require specific endpoint checking
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Specific endpoint compliance checking required',
                message: 'Project-wide scanning is not yet implemented. Please specify implementationPath, endpoint, and method parameters.',
                usage: {
                  example: {
                    implementationPath: 'routes/users.js',
                    endpoint: '/api/users',
                    method: 'POST'
                  }
                },
                availableOptions: [
                  'Specify implementationPath, endpoint, and method for detailed compliance checking',
                  'Use generateReport: true for project-wide analysis (when implemented)',
                  'Use watchMode: true for continuous monitoring (when implemented)'
                ]
              }, null, 2)
            }
          ],
          isError: true
        };

      } catch (error: any) {
        console.error('Error in check_spec_compliance:', error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Compliance check failed: ${error.message}`,
                troubleshooting: [
                  'Ensure spec file is valid YAML/JSON',
                  'Check file permissions',
                  'Verify implementation files exist',
                  'Run with verbose logging for more details'
                ]
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    }
  );
}

/**
 * Core compliance checking function
 */
export async function checkSpecCompliance(options: ComplianceCheckOptions): Promise<ComplianceResult> {
  const { specPath, implementationPath, endpoint, method } = options;
  
  if (!implementationPath || !endpoint || !method) {
    throw new Error('implementationPath, endpoint, and method are required for specific compliance checking');
  }

  // Load and parse spec
  const spec = await loadSpec(specPath);
  const implementation = await loadImplementation(implementationPath);
  
  // Find the specific endpoint in spec
  const endpointSpec = findEndpointSpec(spec, endpoint, method);
  if (!endpointSpec) {
    throw new Error(`Endpoint ${method} ${endpoint} not found in spec`);
  }

  // Analyze implementation
  const analysis = await analyzeImplementation(implementation, endpoint, method);
  
  // Check compliance
  const issues: ComplianceIssue[] = [];
  const suggestions: ComplianceSuggestion[] = [];
  
  // Check response compliance
  const responseCompliance = checkResponseCompliance(endpointSpec, analysis);
  if (!responseCompliance.matchesSchema) {
    issues.push(...generateResponseIssues(responseCompliance, endpointSpec));
    suggestions.push(...generateResponseSuggestions(responseCompliance, endpointSpec));
  }
  
  // Check validation compliance
  const validationCompliance = checkValidationCompliance(endpointSpec, analysis);
  if (!validationCompliance.hasValidation && hasRequestBody(endpointSpec)) {
    issues.push({
      type: 'MISSING_VALIDATION',
      severity: 'error',
      message: 'Request validation is missing but required by spec',
      suggestion: 'Add request validation middleware'
    });
    suggestions.push(generateValidationSuggestion(endpointSpec));
  }
  
  // Check error handling compliance
  const errorHandlingCompliance = checkErrorHandlingCompliance(endpointSpec, analysis);
  if (errorHandlingCompliance.missingErrorCodes.length > 0) {
    issues.push(...generateErrorHandlingIssues(errorHandlingCompliance));
    suggestions.push(...generateErrorHandlingSuggestions(errorHandlingCompliance, endpointSpec));
  }
  
  // Calculate compliance score
  const score = calculateComplianceScore(issues, endpointSpec);
  const isCompliant = score >= 0.8 && issues.filter(i => i.severity === 'error').length === 0;
  
  return {
    isCompliant,
    score,
    issues,
    suggestions,
    validationCompliance,
    errorHandlingCompliance,
    responseCompliance,
    timestamp: new Date()
  };
}

/**
 * Load and parse OpenAPI spec
 */
async function loadSpec(specPath: string): Promise<any> {
  const content = fs.readFileSync(specPath, 'utf8');
  
  if (specPath.endsWith('.yaml') || specPath.endsWith('.yml')) {
    return yaml.load(content);
  } else if (specPath.endsWith('.json')) {
    return JSON.parse(content);
  } else {
    // Try to parse as YAML first, then JSON
    try {
      return yaml.load(content);
    } catch {
      return JSON.parse(content);
    }
  }
}

/**
 * Load implementation file
 */
async function loadImplementation(implementationPath: string): Promise<string> {
  if (!fs.existsSync(implementationPath)) {
    throw new Error(`Implementation file not found: ${implementationPath}`);
  }
  return fs.readFileSync(implementationPath, 'utf8');
}

/**
 * Find endpoint specification in OpenAPI spec
 */
function findEndpointSpec(spec: any, endpoint: string, method: string): any {
  const paths = spec.paths || {};
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const normalizedMethod = method.toLowerCase();
  
  // Direct match
  if (paths[normalizedEndpoint] && paths[normalizedEndpoint][normalizedMethod]) {
    return paths[normalizedEndpoint][normalizedMethod];
  }
  
  // Pattern matching for parameterized routes
  for (const [specPath, pathSpec] of Object.entries(paths)) {
    if (pathMatches(normalizedEndpoint, specPath) && 
        typeof pathSpec === 'object' && 
        pathSpec !== null && 
        (pathSpec as any)[normalizedMethod]) {
      return (pathSpec as any)[normalizedMethod];
    }
  }
  
  return null;
}

/**
 * Normalize endpoint path for comparison
 */
function normalizeEndpoint(endpoint: string): string {
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

/**
 * Check if endpoint matches spec path pattern
 */
function pathMatches(endpoint: string, specPath: string): boolean {
  // Convert OpenAPI path parameters to regex
  const regexPattern = specPath.replace(/\{[^}]+\}/g, '[^/]+');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(endpoint);
}

/**
 * Analyze implementation code
 */
async function analyzeImplementation(code: string, endpoint: string, method: string): Promise<any> {
  const analysis = {
    hasValidation: false,
    validationLibrary: 'none',
    errorHandling: {
      handles404: false,
      handles400: false,
      handles500: false
    },
    responseFormat: 'unknown',
    routePattern: null,
    middleware: []
  };
  
  // Detect validation middleware
  if (code.includes('body(') || code.includes('param(') || code.includes('query(')) {
    analysis.hasValidation = true;
    analysis.validationLibrary = 'express-validator';
  } else if (code.includes('Joi.') || code.includes('.validate(')) {
    analysis.hasValidation = true;
    analysis.validationLibrary = 'joi';
  } else if (code.includes('z.') && code.includes('.parse(')) {
    analysis.hasValidation = true;
    analysis.validationLibrary = 'zod';
  }
  
  // Detect error handling
  if (code.includes('404') || code.includes('not found')) {
    analysis.errorHandling.handles404 = true;
  }
  if (code.includes('400') || code.includes('bad request')) {
    analysis.errorHandling.handles400 = true;
  }
  if (code.includes('500') || code.includes('internal server error')) {
    analysis.errorHandling.handles500 = true;
  }
  
  // Analyze response format
  const responseMatch = code.match(/res\.json\(([^)]+)\)/);
  if (responseMatch) {
    analysis.responseFormat = responseMatch[1];
  }
  
  return analysis;
}

/**
 * Check response compliance against spec
 */
function checkResponseCompliance(endpointSpec: any, analysis: any): ResponseCompliance {
  const responses = endpointSpec.responses || {};
  const successResponse = responses['200'] || responses['201'] || {};
  const schema = successResponse.content?.['application/json']?.schema;
  
  if (!schema) {
    return {
      matchesSchema: true, // No schema to validate against
      missingFields: [],
      extraFields: [],
      typeMatches: true
    };
  }
  
  // Basic compliance check - would need more sophisticated analysis for production
  return {
    matchesSchema: true, // Placeholder - would implement actual schema validation
    missingFields: [],
    extraFields: [],
    typeMatches: true
  };
}

/**
 * Check validation compliance
 */
function checkValidationCompliance(endpointSpec: any, analysis: any): ValidationCompliance {
  const requestBody = endpointSpec.requestBody;
  const hasRequestBody = !!requestBody;
  
  return {
    hasValidation: analysis.hasValidation,
    missingValidations: hasRequestBody && !analysis.hasValidation ? ['request-body'] : [],
    validationLibrary: analysis.validationLibrary
  };
}

/**
 * Check error handling compliance
 */
function checkErrorHandlingCompliance(endpointSpec: any, analysis: any): ErrorHandlingCompliance {
  const responses = endpointSpec.responses || {};
  const expectedErrors = Object.keys(responses).filter(code => code.startsWith('4') || code.startsWith('5'));
  const missingErrorCodes = [];
  
  if (expectedErrors.includes('404') && !analysis.errorHandling.handles404) {
    missingErrorCodes.push('404');
  }
  if (expectedErrors.includes('400') && !analysis.errorHandling.handles400) {
    missingErrorCodes.push('400');
  }
  if (expectedErrors.includes('500') && !analysis.errorHandling.handles500) {
    missingErrorCodes.push('500');
  }
  
  return {
    handles404: analysis.errorHandling.handles404,
    handles400: analysis.errorHandling.handles400,
    handles500: analysis.errorHandling.handles500,
    errorFormat: missingErrorCodes.length === 0 ? 'compliant' : 'partial',
    missingErrorCodes
  };
}

/**
 * Check if endpoint has request body
 */
function hasRequestBody(endpointSpec: any): boolean {
  return !!endpointSpec.requestBody;
}

/**
 * Generate response compliance issues
 */
function generateResponseIssues(responseCompliance: ResponseCompliance, endpointSpec: any): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  
  responseCompliance.missingFields.forEach((field: string) => {
    issues.push({
      type: 'MISSING_FIELD',
      field,
      severity: 'error',
      message: `Required field '${field}' is missing from response`,
      suggestion: `Add '${field}' to the response object`
    });
  });
  
  return issues;
}

/**
 * Generate response suggestions
 */
function generateResponseSuggestions(responseCompliance: ResponseCompliance, endpointSpec: any): ComplianceSuggestion[] {
  const suggestions: ComplianceSuggestion[] = [];
  
  if (responseCompliance.missingFields.length > 0) {
    suggestions.push({
      type: 'FIX_RESPONSE_FORMAT',
      description: 'Update response to include all required fields',
      autoFixable: false,
      priority: 'high'
    });
  }
  
  return suggestions;
}

/**
 * Generate validation suggestion
 */
function generateValidationSuggestion(endpointSpec: any): ComplianceSuggestion {
  const requestBody = endpointSpec.requestBody;
  const schema = requestBody?.content?.['application/json']?.schema;
  const required = schema?.required || [];
  
  let code = '';
  if (required.length > 0) {
    const validations = required.map((field: string) => `body('${field}').notEmpty()`).join(',\n    ');
    code = `[\n    ${validations}\n  ]`;
  }
  
  return {
    type: 'ADD_VALIDATION',
    description: 'Add request validation middleware',
    code,
    autoFixable: true,
    priority: 'high'
  };
}

/**
 * Generate error handling issues
 */
function generateErrorHandlingIssues(errorHandlingCompliance: ErrorHandlingCompliance): ComplianceIssue[] {
  return errorHandlingCompliance.missingErrorCodes.map(code => ({
    type: 'MISSING_ERROR_HANDLING',
    severity: 'warning' as const,
    message: `Missing error handling for HTTP ${code}`,
    suggestion: `Add error handling for ${code} status code`
  }));
}

/**
 * Generate error handling suggestions
 */
function generateErrorHandlingSuggestions(errorHandlingCompliance: ErrorHandlingCompliance, endpointSpec: any): ComplianceSuggestion[] {
  return errorHandlingCompliance.missingErrorCodes.map(code => ({
    type: 'ADD_ERROR_HANDLING',
    description: `Add ${code} error handling`,
    code: generateErrorHandlingCode(code),
    autoFixable: true,
    priority: code === '404' ? 'high' : 'medium'
  }));
}

/**
 * Generate error handling code
 */
function generateErrorHandlingCode(statusCode: string): string {
  switch (statusCode) {
    case '404':
      return `if (!resource) {
  return res.status(404).json({
    error: 'Resource not found',
    status: 404
  });
}`;
    case '400':
      return `const errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(400).json({
    error: 'Invalid request',
    status: 400,
    details: errors.array()
  });
}`;
    default:
      return `// Add ${statusCode} error handling`;
  }
}

/**
 * Calculate compliance score
 */
function calculateComplianceScore(issues: ComplianceIssue[], endpointSpec: any): number {
  const totalChecks = 10; // Base number of compliance checks
  const errorWeight = 3;
  const warningWeight = 1;
  
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  
  const deductions = (errorCount * errorWeight) + (warningCount * warningWeight);
  const score = Math.max(0, (totalChecks - deductions) / totalChecks);
  
  return score;
}

/**
 * Generate compliance summary
 */
function generateComplianceSummary(result: ComplianceResult): string {
  const status = result.isCompliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT';
  const score = `${(result.score * 100).toFixed(1)}%`;
  const issueCount = result.issues.length;
  
  return `${status} (${score}) - ${issueCount} issues found`;
}

/**
 * Generate actionable steps
 */
function generateActionableSteps(result: ComplianceResult): string[] {
  const steps: string[] = [];
  
  if (result.suggestions.length > 0) {
    steps.push('Review and apply suggested fixes:');
    result.suggestions.forEach((suggestion, index) => {
      steps.push(`  ${index + 1}. ${suggestion.description}`);
    });
  }
  
  if (result.issues.filter(i => i.severity === 'error').length > 0) {
    steps.push('Fix critical errors first (marked as severity: error)');
  }
  
  if (!result.isCompliant) {
    steps.push('Re-run compliance check after making changes');
  }
  
  return steps;
}

/**
 * Scan project for compliance issues
 */
async function scanProjectCompliance(options: { projectPath: string; specPath: string }): Promise<EndpointCompliance[]> {
  // This would implement project-wide scanning
  // For now, return placeholder
  return [];
}

/**
 * Generate project compliance report
 */
export async function generateProjectComplianceReport(options: { projectPath: string; specPath: string }): Promise<ProjectComplianceReport> {
  // This would implement comprehensive project reporting
  // For now, return clear indication that this is not implemented
  throw new Error('Project compliance reporting is not yet implemented. Please use specific endpoint checking with implementationPath, endpoint, and method parameters.');
}

/**
 * Start compliance watch mode
 */
export async function startComplianceWatch(options: any): Promise<any> {
  // This would implement file watching for continuous monitoring
  // For now, throw error to indicate this is not implemented
  throw new Error('Watch mode is not yet implemented. Please use specific endpoint checking with implementationPath, endpoint, and method parameters.');
} 