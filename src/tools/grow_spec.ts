import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Configure grow_spec tool for adding entries to the spec repository
 */
export function growSpecTool(server: McpServer, repoRoot: string): void {
  console.log('Initializing grow_spec tool with repo root:', repoRoot);
  
  server.tool(
    'grow_spec',
    {
      endpoint: z.string().min(1),
      summary: z.string().min(1),
      projectDir: z.string().optional().describe('Target project directory where specs should be generated. If not provided, will use current directory.')
    },
    async ({ endpoint, summary, projectDir }: { endpoint: string; summary: string; projectDir?: string }) => {
      try {
        console.log(`grow_spec tool called with endpoint: ${endpoint}, summary: ${summary}, projectDir: ${projectDir}`);
        
        // Ensure we never use absolute paths that start at root
        const baseDir = process.cwd();
        console.log('Base directory:', baseDir);
        
        // Use provided project directory or current working directory
        const targetDir = projectDir ? 
          (path.isAbsolute(projectDir) ? 
            // If absolute path provided, ensure it's under the user's home directory
            (projectDir.startsWith('/Users') ? projectDir : path.join(baseDir, projectDir)) :
            // If relative path, resolve from current directory
            path.resolve(baseDir, projectDir)
          ) : 
          baseDir;
        
        console.log(`Using target directory: ${targetDir}`);

        // Safety check - ensure we're not trying to write to root or system directories
        if (targetDir === '/' || targetDir.startsWith('/usr') || targetDir.startsWith('/etc')) {
          throw new Error('Cannot write to system directories');
        }

        // Ensure target directory exists
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Look for vibe.yaml in the target directory
        const vibeYamlPath = path.join(targetDir, 'vibe.yaml');
        
        // Create or read vibe.yaml
        let existingYaml;
        if (fs.existsSync(vibeYamlPath)) {
          existingYaml = yaml.load(fs.readFileSync(vibeYamlPath, 'utf8')) as any;
        } else {
          // Create initial OpenAPI spec
          existingYaml = {
            openapi: '3.0.0',
            info: {
              title: 'API Specification',
              version: '1.0.0'
            },
            paths: {}
          };
        }
        
        // Ensure paths object exists
        if (!existingYaml.paths) {
          existingYaml.paths = {};
        }
        
        // Add or update the endpoint
        const pathKey = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        if (!existingYaml.paths[pathKey]) {
          existingYaml.paths[pathKey] = {};
        }
        
        // Add GET method as default if no methods exist
        if (Object.keys(existingYaml.paths[pathKey]).length === 0) {
          existingYaml.paths[pathKey].get = {
            summary,
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object'
                    }
                  }
                }
              }
            }
          };
        }
        
        // Create specs directory in the target directory
        const specDir = path.join(targetDir, 'specs');
        try {
          if (!fs.existsSync(specDir)) {
            fs.mkdirSync(specDir, { recursive: true, mode: 0o755 });
          }
        } catch (err: any) {
          console.error('Error creating specs directory:', err);
          throw new Error(`Failed to create specs directory: ${err.message}`);
        }
        
        // Write updated YAML
        try {
          fs.writeFileSync(vibeYamlPath, yaml.dump(existingYaml), { mode: 0o644 });
        } catch (err: any) {
          console.error('Error writing vibe.yaml:', err);
          throw new Error(`Failed to write vibe.yaml: ${err.message}`);
        }
        
        // Generate timestamp and create spec file
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const safeEndpoint = endpoint.replace(/[\/\\:]/g, '-');
        const specFile = path.join(specDir, `${safeEndpoint}-${timestamp}.json`);
        
        // Generate a detailed spec based on the endpoint and summary
        const spec = generateDetailedSpec(endpoint, summary);
        
        // Write the spec to file
        try {
          fs.writeFileSync(specFile, JSON.stringify(spec, null, 2), { mode: 0o644 });
        } catch (err: any) {
          console.error('Error writing spec file:', err);
          throw new Error(`Failed to write spec file: ${err.message}`);
        }
        
        return {
          content: [
            { 
              type: 'text', 
              text: `Updated OpenAPI spec in ${path.relative(targetDir, vibeYamlPath)} and created detailed spec in ${path.relative(targetDir, specFile)}` 
            }
          ]
        };
      } catch (error) {
        console.error(`Error in grow_spec tool: ${error}`);
        return {
          content: [
            { 
              type: 'text', 
              text: `Error generating spec: ${error instanceof Error ? error.message : String(error)}` 
            }
          ],
          isError: true
        };
      }
    }
  );
}

/**
 * Generate a detailed specification based on the endpoint and summary
 */
function generateDetailedSpec(endpoint: string, summary: string): any {
  // Extract feature keywords from the summary
  const hasMultiTaskSpecs = /multi-task|multiple tasks|subtasks/i.test(summary);
  const hasMetadata = /metadata|task metadata|data fields/i.test(summary);
  const hasRefineSpec = /refine[_ -]spec|spec refinement/i.test(summary);
  const hasNotifications = /notification|alerts|user notice/i.test(summary);
  const hasDocumentation = /documentation|docs|guides/i.test(summary);
  
  // Build features array based on detected keywords
  const features = [];
  
  if (hasMultiTaskSpecs) {
    features.push({
      "name": "multi-task-specs",
      "description": "Support for defining complex tasks with multiple subtasks and dependencies",
      "details": {
        "structure": {
          "tasks": "Array of task objects that can be executed in sequence or parallel",
          "dependencies": "Graph representation of inter-task dependencies",
          "globalParams": "Parameters shared across all tasks in the spec"
        },
        "implementation": {
          "fileFormat": "Extended JSON format with task definitions",
          "scheduler": "Task execution with dependency resolution",
          "validation": "Schema-based validation of task structures"
        }
      }
    });
  }
  
  if (hasMetadata) {
    features.push({
      "name": "task-metadata",
      "description": "Extended metadata for task tracking, visualization, and management",
      "details": {
        "fields": {
          "owner": "Person responsible for the task",
          "priority": "Task importance (low, medium, high, critical)",
          "estimatedTime": "Expected completion time",
          "status": "Current execution state",
          "tags": "Categorization and filtering"
        },
        "capabilities": {
          "filtering": "Query tasks by metadata",
          "reporting": "Generate status reports based on metadata",
          "visualization": "Create dependency and status charts"
        }
      }
    });
  }
  
  if (hasRefineSpec) {
    features.push({
      "name": "refine-spec-tool",
      "description": "Tool for iteratively refining and updating task specifications",
      "details": {
        "operations": {
          "add": "Add new tasks to existing specs",
          "update": "Modify existing task definitions",
          "remove": "Remove tasks from specs",
          "reorder": "Change task execution order"
        },
        "intelligence": {
          "suggestions": "Smart suggestions for task refinement",
          "validation": "Verify spec integrity after changes",
          "history": "Track changes to specs over time"
        }
      }
    });
  }
  
  if (hasNotifications) {
    features.push({
      "name": "user-notifications",
      "description": "System for notifying users about task status changes and events",
      "details": {
        "channels": {
          "inApp": "Notifications within the Carrot UI",
          "email": "Email notifications for important events",
          "webhook": "Custom webhook integration"
        },
        "events": {
          "taskCompletion": "When tasks are completed",
          "taskFailure": "When tasks encounter errors",
          "progressUpdates": "Periodic updates on long-running tasks",
          "approvalRequests": "When user input is needed"
        },
        "preferences": {
          "perUser": "User-specific notification settings",
          "perProject": "Project-level notification rules"
        }
      }
    });
  }
  
  if (hasDocumentation) {
    features.push({
      "name": "documentation",
      "description": "Comprehensive documentation for Carrot features and APIs",
      "details": {
        "components": {
          "userGuide": "End-user documentation for Carrot",
          "developerDocs": "API documentation for developers",
          "tutorials": "Step-by-step guides for common workflows",
          "examples": "Sample projects and configurations"
        },
        "formats": {
          "markdown": "Source format for all documentation",
          "html": "Generated web documentation",
          "pdf": "Downloadable reference guides"
        },
        "infrastructure": {
          "docSite": "Documentation website with search",
          "versionControl": "Documentation versioned with code",
          "contributionFlow": "Process for community contributions"
        }
      }
    });
  }
  
  // If no specific features were detected, include all by default
  if (features.length === 0) {
    return generateFullSpec(endpoint, summary);
  }
  
  // Create implementation phases based on detected features
  const implementationPhases = generateImplementationPhases(features);
  
  // Return the complete spec
  return {
    endpoint,
    summary,
    createdAt: new Date().toISOString(),
    features,
    implementation: implementationPhases
  };
}

/**
 * Generate implementation phases based on detected features
 */
function generateImplementationPhases(features: any[]): any {
  const featureNames = features.map(f => f.name);
  
  // Design phase tasks
  const designTasks = [];
  if (featureNames.includes('multi-task-specs')) {
    designTasks.push("Create detailed schemas for multi-task specs");
  }
  if (featureNames.includes('task-metadata')) {
    designTasks.push("Design API endpoints for task metadata");
  }
  if (featureNames.includes('user-notifications')) {
    designTasks.push("Plan user notification system architecture");
  }
  if (featureNames.includes('documentation')) {
    designTasks.push("Outline documentation structure");
  }
  
  // Implementation phase tasks
  const implementationTasks = [];
  if (featureNames.includes('multi-task-specs')) {
    implementationTasks.push("Develop core multi-task spec functionality");
  }
  if (featureNames.includes('refine-spec-tool')) {
    implementationTasks.push("Build refine-spec tool backend");
  }
  if (featureNames.includes('user-notifications')) {
    implementationTasks.push("Implement notification system");
  }
  if (featureNames.includes('documentation')) {
    implementationTasks.push("Create documentation infrastructure");
  }
  
  // Testing phase tasks
  const testingTasks = ["Unit test all new components"];
  if (featureNames.includes('user-notifications')) {
    testingTasks.push("Integration testing of notification system");
  }
  if (featureNames.includes('refine-spec-tool')) {
    testingTasks.push("User testing of refine-spec tool");
  }
  if (featureNames.includes('documentation')) {
    testingTasks.push("Documentation review");
  }
  
  // Deployment phase tasks
  const deploymentTasks = [
    "Release new features",
    "Publish documentation",
    "Monitor system performance",
    "Gather user feedback"
  ];
  
  return {
    phases: [
      {
        name: "Design",
        tasks: designTasks.length > 0 ? designTasks : ["Design system architecture"],
        deliverables: ["Design documents", "API specifications", "Schema definitions"]
      },
      {
        name: "Implementation",
        tasks: implementationTasks.length > 0 ? implementationTasks : ["Implement core functionality"],
        deliverables: ["Functional code", "Initial documentation", "Test suite"]
      },
      {
        name: "Testing",
        tasks: testingTasks,
        deliverables: ["Test reports", "User feedback", "Documentation updates"]
      },
      {
        name: "Deployment",
        tasks: deploymentTasks,
        deliverables: ["Production release", "Public documentation", "Feedback analysis"]
      }
    ],
    dependencies: {
      external: ["MCP SDK", "Documentation generation tools", "Notification service"],
      internal: ["Existing task execution system", "User management", "API gateway"]
    }
  };
}

/**
 * Generate a full spec with all features when no specific features are detected
 */
function generateFullSpec(endpoint: string, summary: string): any {
  return {
    endpoint,
    summary,
    createdAt: new Date().toISOString(),
    features: [
      {
        "name": "multi-task-specs",
        "description": "Support for defining complex tasks with multiple subtasks and dependencies",
        "details": {
          "structure": {
            "tasks": "Array of task objects that can be executed in sequence or parallel",
            "dependencies": "Graph representation of inter-task dependencies",
            "globalParams": "Parameters shared across all tasks in the spec"
          },
          "implementation": {
            "fileFormat": "Extended JSON format with task definitions",
            "scheduler": "Task execution with dependency resolution",
            "validation": "Schema-based validation of task structures"
          }
        }
      },
      {
        "name": "task-metadata",
        "description": "Extended metadata for task tracking, visualization, and management",
        "details": {
          "fields": {
            "owner": "Person responsible for the task",
            "priority": "Task importance (low, medium, high, critical)",
            "estimatedTime": "Expected completion time",
            "status": "Current execution state",
            "tags": "Categorization and filtering"
          },
          "capabilities": {
            "filtering": "Query tasks by metadata",
            "reporting": "Generate status reports based on metadata",
            "visualization": "Create dependency and status charts"
          }
        }
      },
      {
        "name": "refine-spec-tool",
        "description": "Tool for iteratively refining and updating task specifications",
        "details": {
          "operations": {
            "add": "Add new tasks to existing specs",
            "update": "Modify existing task definitions",
            "remove": "Remove tasks from specs",
            "reorder": "Change task execution order"
          },
          "intelligence": {
            "suggestions": "Smart suggestions for task refinement",
            "validation": "Verify spec integrity after changes",
            "history": "Track changes to specs over time"
          }
        }
      },
      {
        "name": "user-notifications",
        "description": "System for notifying users about task status changes and events",
        "details": {
          "channels": {
            "inApp": "Notifications within the Carrot UI",
            "email": "Email notifications for important events",
            "webhook": "Custom webhook integration"
          },
          "events": {
            "taskCompletion": "When tasks are completed",
            "taskFailure": "When tasks encounter errors",
            "progressUpdates": "Periodic updates on long-running tasks",
            "approvalRequests": "When user input is needed"
          },
          "preferences": {
            "perUser": "User-specific notification settings",
            "perProject": "Project-level notification rules"
          }
        }
      },
      {
        "name": "documentation",
        "description": "Comprehensive documentation for Carrot features and APIs",
        "details": {
          "components": {
            "userGuide": "End-user documentation for Carrot",
            "developerDocs": "API documentation for developers",
            "tutorials": "Step-by-step guides for common workflows",
            "examples": "Sample projects and configurations"
          },
          "formats": {
            "markdown": "Source format for all documentation",
            "html": "Generated web documentation",
            "pdf": "Downloadable reference guides"
          },
          "infrastructure": {
            "docSite": "Documentation website with search",
            "versionControl": "Documentation versioned with code",
            "contributionFlow": "Process for community contributions"
          }
        }
      }
    ],
    implementation: {
      phases: [
        {
          name: "Design",
          tasks: [
            "Create detailed schemas for multi-task specs",
            "Design API endpoints for task metadata",
            "Plan user notification system architecture",
            "Outline documentation structure"
          ],
          deliverables: ["Design documents", "API specifications", "Schema definitions"]
        },
        {
          name: "Implementation",
          tasks: [
            "Develop core multi-task spec functionality",
            "Build refine-spec tool backend",
            "Implement notification system",
            "Create documentation infrastructure"
          ],
          deliverables: ["Functional code", "Initial documentation", "Test suite"]
        },
        {
          name: "Testing",
          tasks: [
            "Unit test all new components",
            "Integration testing of notification system",
            "User testing of refine-spec tool",
            "Documentation review"
          ],
          deliverables: ["Test reports", "User feedback", "Documentation updates"]
        },
        {
          name: "Deployment",
          tasks: [
            "Release new features",
            "Publish documentation",
            "Monitor system performance",
            "Gather user feedback"
          ],
          deliverables: ["Production release", "Public documentation", "Feedback analysis"]
        }
      ],
      dependencies: {
        external: ["MCP SDK", "Documentation generation tools", "Notification service"],
        internal: ["Existing task execution system", "User management", "API gateway"]
      }
    }
  };
}

/**
 * Extract features from the summary text
 * This function attempts to identify key features mentioned in the summary
 * and generates structured metadata for each identified feature
 */
function extractFeaturesFromSummary(summary: string): any[] {
  // Convert summary to lowercase and split by common separators
  const words = summary.toLowerCase().split(/[,.:;]|\sand\s|\swith\s/);
  
  // Define feature patterns to look for
  const featurePatterns = [
    { 
      pattern: /multi-task|multiple tasks|task management/, 
      name: 'multi-task-specs',
      description: 'Support for defining complex tasks with multiple subtasks and dependencies',
      template: {
        structure: {
          tasks: 'Array of task objects that can be executed in sequence or parallel',
          dependencies: 'Graph representation of inter-task dependencies',
          globalParams: 'Parameters shared across all tasks in the spec'
        }
      }
    },
    { 
      pattern: /metadata|task metadata|data fields/, 
      name: 'task-metadata',
      description: 'Extended metadata for task tracking, visualization, and management',
      template: {
        fields: {
          owner: 'Person responsible for the task',
          priority: 'Task importance (low, medium, high, critical)',
          status: 'Current execution state'
        }
      }
    },
    { 
      pattern: /refine[_ -]spec|spec refinement|update specs/, 
      name: 'refine-spec-tool',
      description: 'Tool for iteratively refining and updating task specifications',
      template: {
        operations: {
          add: 'Add new tasks to existing specs',
          update: 'Modify existing task definitions',
          remove: 'Remove tasks from specs'
        }
      }
    },
    { 
      pattern: /notification|alerts|user notice/, 
      name: 'user-notifications',
      description: 'System for notifying users about task status changes and events',
      template: {
        channels: {
          inApp: 'Notifications within the Carrot UI',
          email: 'Email notifications for important events'
        }
      }
    },
    { 
      pattern: /documentation|docs|guides/, 
      name: 'documentation',
      description: 'Comprehensive documentation for Carrot features and APIs',
      template: {
        components: {
          userGuide: 'End-user documentation for Carrot',
          developerDocs: 'API documentation for developers'
        }
      }
    }
  ];
  
  // Identify features mentioned in the summary
  const identifiedFeatures = [];
  
  for (const { pattern, name, description, template } of featurePatterns) {
    if (words.some(word => pattern.test(word))) {
      identifiedFeatures.push({
        name,
        description,
        details: template
      });
    }
  }
  
  return identifiedFeatures;
} 