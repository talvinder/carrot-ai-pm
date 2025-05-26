/**
 * CLI Spec Generation Tool
 * 
 * Generates framework-neutral CLI specifications for:
 * - Command-line arguments and options
 * - Subcommands and command hierarchies
 * - Help text and documentation
 * - Exit codes and error handling
 * - User interaction patterns
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface CLISpec {
  type: 'cli';
  identifier: string;
  summary: string;
  specification: {
    interface: {
      command: CommandDefinition;
      subcommands?: Record<string, SubcommandDefinition>;
      global_options: OptionDefinition[];
      arguments: ArgumentDefinition[];
    };
    behavior: {
      execution_flow: ExecutionFlowDefinition[];
      error_handling: ErrorHandlingDefinition[];
      user_interaction: UserInteractionDefinition[];
    };
    output: {
      formats: OutputFormatDefinition[];
      verbosity_levels: VerbosityLevelDefinition[];
      exit_codes: ExitCodeDefinition[];
    };
    usability: {
      help_system: HelpSystemDefinition;
      auto_completion: AutoCompletionDefinition;
      configuration: ConfigurationDefinition;
    };
    compatibility: {
      platforms: string[];
      shell_integration: ShellIntegrationDefinition[];
      environment_variables: EnvironmentVariableDefinition[];
    };
  };
  complianceRules: string[];
}

export interface CommandDefinition {
  name: string;
  description: string;
  usage: string;
  examples: ExampleDefinition[];
  aliases?: string[];
}

export interface SubcommandDefinition {
  name: string;
  description: string;
  usage: string;
  options: OptionDefinition[];
  arguments: ArgumentDefinition[];
  examples: ExampleDefinition[];
  aliases?: string[];
}

export interface OptionDefinition {
  name: string;
  short?: string;
  long: string;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'array' | 'choice';
  required?: boolean;
  default?: any;
  choices?: string[];
  multiple?: boolean;
  conflicts_with?: string[];
  requires?: string[];
  frameworkTypes?: Record<string, string>; // Framework-specific type mappings
}

export interface ArgumentDefinition {
  name: string;
  description: string;
  type: 'string' | 'number' | 'file' | 'directory' | 'url';
  required?: boolean;
  multiple?: boolean;
  position?: number;
  validation?: ValidationDefinition;
}

export interface ExampleDefinition {
  command: string;
  description: string;
  output?: string;
}

export interface ExecutionFlowDefinition {
  step: string;
  description: string;
  conditions?: string[];
  actions: string[];
}

export interface ErrorHandlingDefinition {
  error_type: string;
  description: string;
  exit_code: number;
  message_format: string;
  recovery_actions?: string[];
}

export interface UserInteractionDefinition {
  type: 'prompt' | 'confirmation' | 'selection' | 'progress';
  description: string;
  conditions: string[];
  format: string;
  validation?: ValidationDefinition;
}

export interface OutputFormatDefinition {
  name: string;
  description: string;
  mime_type?: string;
  options: string[];
  examples: string[];
}

export interface VerbosityLevelDefinition {
  level: string;
  description: string;
  includes: string[];
}

export interface ExitCodeDefinition {
  code: number;
  name: string;
  description: string;
  conditions: string[];
}

export interface HelpSystemDefinition {
  formats: string[];
  sections: string[];
  auto_generation: boolean;
  examples_included: boolean;
}

export interface AutoCompletionDefinition {
  supported_shells: string[];
  completion_types: string[];
  dynamic_completion: boolean;
}

export interface ConfigurationDefinition {
  file_formats: string[];
  locations: string[];
  precedence_order: string[];
  environment_override: boolean;
}

export interface ShellIntegrationDefinition {
  shell: string;
  features: string[];
  installation_method: string;
}

export interface EnvironmentVariableDefinition {
  name: string;
  description: string;
  type: string;
  default?: string;
  required?: boolean;
}

export interface ValidationDefinition {
  pattern?: string;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  custom_validator?: string;
}

export function growCLISpecTool(server: McpServer, repoRoot: string): void {
  console.log('Initializing grow_cli_spec tool with repo root:', repoRoot);
  
  server.tool(
    'grow_cli_spec',
    {
      commandName: z.string().describe('Name of the CLI command or tool'),
      summary: z.string().describe('Brief description of the CLI tool purpose'),
      generateExamples: z.boolean().optional().default(true).describe('Generate implementation examples'),
      frameworks: z.array(z.enum(['node', 'python', 'go', 'rust', 'bash'])).optional().default(['node']).describe('Target frameworks for examples')
    },
    async ({ commandName, summary, generateExamples = true, frameworks = ['node'] }) => {
      try {
        console.log('Generating CLI spec for:', commandName);
        
        // Generate the CLI specification
        const spec = await generateCLISpec(commandName, summary, { generateExamples, frameworks });
        
        // Create specs directory structure
        const specsDir = path.join(repoRoot, 'specs', 'cli');
        const examplesDir = path.join(specsDir, 'examples');
        
        if (!fs.existsSync(specsDir)) {
          fs.mkdirSync(specsDir, { recursive: true });
        }
        
        if (!fs.existsSync(examplesDir)) {
          fs.mkdirSync(examplesDir, { recursive: true });
        }
        
        // Write the spec file
        const specFileName = `${commandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.yaml`;
        const specPath = path.join(specsDir, specFileName);
        const specYaml = yaml.dump(spec, { 
          indent: 2, 
          lineWidth: 120,
          noRefs: true 
        });
        
        fs.writeFileSync(specPath, specYaml);
        
        // Generate framework-specific examples if requested
        const examples: string[] = [];
        if (generateExamples) {
          for (const framework of frameworks) {
            const implementationExample = generateImplementationExample(spec, framework);
            const exampleFileName = `${commandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${framework}${getFileExtension(framework)}`;
            const examplePath = path.join(examplesDir, exampleFileName);
            
            fs.writeFileSync(examplePath, implementationExample);
            examples.push(exampleFileName);
          }
        }
        
        const result = {
          spec_file: specFileName,
          spec_path: specPath,
          examples: examples,
          summary: `Generated CLI specification for ${commandName}`,
          compliance_check: `Run: check_spec_compliance --type=cli --identifier=${commandName}`
        };
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }],
          isError: false
        };
        
      } catch (error: any) {
        console.error('Error generating CLI spec:', error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Failed to generate CLI spec: ${error.message}`,
              troubleshooting: [
                'Ensure command name is valid',
                'Check file permissions in specs directory',
                'Verify framework is supported'
              ]
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );
}

export async function generateCLISpec(
  commandName: string, 
  summary: string, 
  options: { generateExamples: boolean; frameworks: string[] }
): Promise<CLISpec> {
  
  // Analyze command name to infer structure
  const commandType = inferCommandType(commandName);
  const baseOptions = generateBaseOptions(commandName, commandType);
  const subcommands = generateSubcommands(commandName, commandType);
  const args = generateArguments(commandName, commandType);
  
  const spec: CLISpec = {
    type: 'cli',
    identifier: commandName,
    summary,
    specification: {
      interface: {
        command: {
          name: commandName,
          description: summary,
          usage: generateUsageString(commandName, commandType),
          examples: generateExamples(commandName, commandType),
          aliases: generateAliases(commandName)
        },
        subcommands: subcommands,
        global_options: baseOptions,
        arguments: args
      },
      behavior: {
        execution_flow: generateExecutionFlow(commandName, commandType),
        error_handling: generateErrorHandling(commandName, commandType),
        user_interaction: generateUserInteraction(commandName, commandType)
      },
      output: {
        formats: generateOutputFormats(commandName, commandType),
        verbosity_levels: generateVerbosityLevels(),
        exit_codes: generateExitCodes()
      },
      usability: {
        help_system: {
          formats: ['text', 'man', 'markdown'],
          sections: ['usage', 'description', 'options', 'examples', 'exit_codes'],
          auto_generation: true,
          examples_included: true
        },
        auto_completion: {
          supported_shells: ['bash', 'zsh', 'fish', 'powershell'],
          completion_types: ['commands', 'options', 'arguments', 'files'],
          dynamic_completion: true
        },
        configuration: {
          file_formats: ['json', 'yaml', 'toml'],
          locations: ['~/.config/app', './config', '/etc/app'],
          precedence_order: ['command_line', 'environment', 'config_file', 'defaults'],
          environment_override: true
        }
      },
      compatibility: {
        platforms: ['linux', 'macos', 'windows'],
        shell_integration: generateShellIntegration(),
        environment_variables: generateEnvironmentVariables(commandName)
      }
    },
    complianceRules: [
      'Command must have clear, descriptive help text',
      'All options must have both short and long forms where appropriate',
      'Exit codes must follow standard conventions (0 = success)',
      'Error messages must be clear and actionable',
      'Command must handle --help and --version options',
      'Input validation must provide helpful error messages',
      'Output format must be consistent and parseable',
      'Configuration precedence must be clearly documented',
      'Auto-completion should be available for major shells',
      'Command must be interruptible (handle SIGINT gracefully)'
    ]
  };
  
  return spec;
}

function inferCommandType(commandName: string): 'utility' | 'build' | 'deploy' | 'test' | 'dev' | 'data' {
  const name = commandName.toLowerCase();
  
  if (name.includes('build') || name.includes('compile') || name.includes('bundle')) {
    return 'build';
  }
  
  if (name.includes('deploy') || name.includes('publish') || name.includes('release')) {
    return 'deploy';
  }
  
  if (name.includes('test') || name.includes('spec') || name.includes('check')) {
    return 'test';
  }
  
  if (name.includes('dev') || name.includes('serve') || name.includes('watch')) {
    return 'dev';
  }
  
  if (name.includes('data') || name.includes('migrate') || name.includes('sync')) {
    return 'data';
  }
  
  return 'utility';
}

function generateBaseOptions(commandName: string, commandType: string): OptionDefinition[] {
  const baseOptions: OptionDefinition[] = [
    {
      name: 'help',
      short: 'h',
      long: '--help',
      description: 'Show help information',
      type: 'boolean',
      frameworkTypes: {
        node: 'boolean',
        python: 'store_true',
        go: 'bool',
        rust: 'bool',
        bash: 'flag'
      }
    },
    {
      name: 'version',
      short: 'V',
      long: '--version',
      description: 'Show version information',
      type: 'boolean',
      frameworkTypes: {
        node: 'boolean',
        python: 'store_true',
        go: 'bool',
        rust: 'bool',
        bash: 'flag'
      }
    },
    {
      name: 'verbose',
      short: 'v',
      long: '--verbose',
      description: 'Enable verbose output',
      type: 'boolean',
      frameworkTypes: {
        node: 'boolean',
        python: 'store_true',
        go: 'bool',
        rust: 'bool',
        bash: 'flag'
      }
    },
    {
      name: 'quiet',
      short: 'q',
      long: '--quiet',
      description: 'Suppress output',
      type: 'boolean',
      conflicts_with: ['verbose'],
      frameworkTypes: {
        node: 'boolean',
        python: 'store_true',
        go: 'bool',
        rust: 'bool',
        bash: 'flag'
      }
    }
  ];

  // Add command-type specific options
  if (commandType === 'build') {
    baseOptions.push({
      name: 'output',
      short: 'o',
      long: '--output',
      description: 'Output directory or file',
      type: 'string',
      frameworkTypes: {
        node: 'string',
        python: 'str',
        go: 'string',
        rust: 'String',
        bash: 'string'
      }
    });
  }

  if (commandType === 'dev') {
    baseOptions.push({
      name: 'port',
      short: 'p',
      long: '--port',
      description: 'Port number to use',
      type: 'number',
      default: 3000,
      frameworkTypes: {
        node: 'number',
        python: 'int',
        go: 'int',
        rust: 'u16',
        bash: 'number'
      }
    });
  }

  return baseOptions;
}

function generateSubcommands(commandName: string, commandType: string): Record<string, SubcommandDefinition> | undefined {
  const subcommands: Record<string, SubcommandDefinition> = {};

  if (commandType === 'build') {
    subcommands.clean = {
      name: 'clean',
      description: 'Clean build artifacts',
      usage: `${commandName} clean [options]`,
      options: [
        {
          name: 'force',
          short: 'f',
          long: '--force',
          description: 'Force clean without confirmation',
          type: 'boolean'
        }
      ],
      arguments: [],
      examples: [
        {
          command: `${commandName} clean`,
          description: 'Clean build artifacts'
        }
      ]
    };

    subcommands.watch = {
      name: 'watch',
      description: 'Watch for changes and rebuild',
      usage: `${commandName} watch [options]`,
      options: [
        {
          name: 'ignore',
          short: 'i',
          long: '--ignore',
          description: 'Patterns to ignore',
          type: 'array',
          multiple: true
        }
      ],
      arguments: [],
      examples: [
        {
          command: `${commandName} watch --ignore "*.test.js"`,
          description: 'Watch and rebuild, ignoring test files'
        }
      ]
    };
  }

  if (commandType === 'deploy') {
    subcommands.staging = {
      name: 'staging',
      description: 'Deploy to staging environment',
      usage: `${commandName} staging [options]`,
      options: [
        {
          name: 'dry-run',
          long: '--dry-run',
          description: 'Show what would be deployed without actually deploying',
          type: 'boolean'
        }
      ],
      arguments: [],
      examples: [
        {
          command: `${commandName} staging --dry-run`,
          description: 'Preview staging deployment'
        }
      ]
    };

    subcommands.production = {
      name: 'production',
      description: 'Deploy to production environment',
      usage: `${commandName} production [options]`,
      options: [
        {
          name: 'confirm',
          long: '--confirm',
          description: 'Skip confirmation prompt',
          type: 'boolean'
        }
      ],
      arguments: [],
      examples: [
        {
          command: `${commandName} production --confirm`,
          description: 'Deploy to production without confirmation'
        }
      ]
    };
  }

  return Object.keys(subcommands).length > 0 ? subcommands : undefined;
}

function generateArguments(commandName: string, commandType: string): ArgumentDefinition[] {
  const args: ArgumentDefinition[] = [];

  if (commandType === 'utility') {
    args.push({
      name: 'input',
      description: 'Input file or directory',
      type: 'file',
      required: true,
      position: 1,
      validation: {
        custom_validator: 'file_exists'
      }
    });
  }

  if (commandType === 'build') {
    args.push({
      name: 'source',
      description: 'Source directory to build',
      type: 'directory',
      required: false,
      position: 1,
      validation: {
        custom_validator: 'directory_exists'
      }
    });
  }

  return args;
}

function generateUsageString(commandName: string, commandType: string): string {
  let usage = commandName;
  
  if (commandType === 'build') {
    usage += ' [subcommand] [options] [source]';
  } else if (commandType === 'deploy') {
    usage += ' <environment> [options]';
  } else {
    usage += ' [options] <input>';
  }
  
  return usage;
}

function generateExamples(commandName: string, commandType: string): ExampleDefinition[] {
  const examples: ExampleDefinition[] = [
    {
      command: `${commandName} --help`,
      description: 'Show help information'
    },
    {
      command: `${commandName} --version`,
      description: 'Show version information'
    }
  ];

  if (commandType === 'build') {
    examples.push(
      {
        command: `${commandName} src/`,
        description: 'Build from source directory'
      },
      {
        command: `${commandName} clean`,
        description: 'Clean build artifacts'
      },
      {
        command: `${commandName} watch --verbose`,
        description: 'Watch for changes with verbose output'
      }
    );
  }

  if (commandType === 'deploy') {
    examples.push(
      {
        command: `${commandName} staging --dry-run`,
        description: 'Preview staging deployment'
      },
      {
        command: `${commandName} production --confirm`,
        description: 'Deploy to production'
      }
    );
  }

  return examples;
}

function generateAliases(commandName: string): string[] | undefined {
  const aliases: string[] = [];
  
  // Generate common aliases
  if (commandName.length > 4) {
    aliases.push(commandName.substring(0, 3));
  }
  
  // Add specific aliases based on command patterns
  if (commandName.includes('deploy')) {
    aliases.push('dep');
  }
  
  if (commandName.includes('build')) {
    aliases.push('b');
  }
  
  return aliases.length > 0 ? aliases : undefined;
}

function generateExecutionFlow(commandName: string, commandType: string): ExecutionFlowDefinition[] {
  return [
    {
      step: 'initialization',
      description: 'Parse command line arguments and validate input',
      actions: [
        'Parse command line arguments',
        'Validate required arguments',
        'Load configuration files',
        'Set up logging and output formatting'
      ]
    },
    {
      step: 'validation',
      description: 'Validate input parameters and environment',
      conditions: ['All required arguments provided'],
      actions: [
        'Validate file/directory paths',
        'Check permissions',
        'Verify dependencies',
        'Validate configuration'
      ]
    },
    {
      step: 'execution',
      description: 'Execute main command logic',
      conditions: ['Validation passed'],
      actions: [
        'Execute main command logic',
        'Handle progress reporting',
        'Process user interactions',
        'Generate output'
      ]
    },
    {
      step: 'cleanup',
      description: 'Clean up resources and exit',
      actions: [
        'Clean up temporary files',
        'Close file handles',
        'Report final status',
        'Exit with appropriate code'
      ]
    }
  ];
}

function generateErrorHandling(commandName: string, commandType: string): ErrorHandlingDefinition[] {
  return [
    {
      error_type: 'invalid_argument',
      description: 'Invalid command line argument provided',
      exit_code: 2,
      message_format: 'Error: Invalid argument "{argument}". {suggestion}',
      recovery_actions: ['Show usage information', 'Suggest correct format']
    },
    {
      error_type: 'file_not_found',
      description: 'Required file or directory not found',
      exit_code: 1,
      message_format: 'Error: File not found: {path}',
      recovery_actions: ['Check file path', 'Verify permissions']
    },
    {
      error_type: 'permission_denied',
      description: 'Insufficient permissions to perform operation',
      exit_code: 1,
      message_format: 'Error: Permission denied: {operation}',
      recovery_actions: ['Check file permissions', 'Run with appropriate privileges']
    },
    {
      error_type: 'network_error',
      description: 'Network operation failed',
      exit_code: 1,
      message_format: 'Error: Network operation failed: {details}',
      recovery_actions: ['Check network connectivity', 'Retry operation', 'Check firewall settings']
    }
  ];
}

function generateUserInteraction(commandName: string, commandType: string): UserInteractionDefinition[] {
  const interactions: UserInteractionDefinition[] = [];

  if (commandType === 'deploy') {
    interactions.push({
      type: 'confirmation',
      description: 'Confirm production deployment',
      conditions: ['Deploying to production', 'No --confirm flag provided'],
      format: 'Are you sure you want to deploy to production? (y/N): ',
      validation: {
        pattern: '^[yYnN]?$'
      }
    });
  }

  interactions.push({
    type: 'progress',
    description: 'Show operation progress',
    conditions: ['Long-running operation', 'Not in quiet mode'],
    format: 'Progress: {percentage}% [{bar}] {current}/{total}'
  });

  return interactions;
}

function generateOutputFormats(commandName: string, commandType: string): OutputFormatDefinition[] {
  return [
    {
      name: 'text',
      description: 'Human-readable text output',
      options: ['--format=text'],
      examples: ['Operation completed successfully']
    },
    {
      name: 'json',
      description: 'Machine-readable JSON output',
      mime_type: 'application/json',
      options: ['--format=json', '--json'],
      examples: ['{"status": "success", "result": {...}}']
    },
    {
      name: 'yaml',
      description: 'YAML formatted output',
      mime_type: 'application/yaml',
      options: ['--format=yaml'],
      examples: ['status: success\nresult: {...}']
    }
  ];
}

function generateVerbosityLevels(): VerbosityLevelDefinition[] {
  return [
    {
      level: 'quiet',
      description: 'Only show errors',
      includes: ['errors']
    },
    {
      level: 'normal',
      description: 'Show normal output',
      includes: ['errors', 'warnings', 'info']
    },
    {
      level: 'verbose',
      description: 'Show detailed output',
      includes: ['errors', 'warnings', 'info', 'debug']
    }
  ];
}

function generateExitCodes(): ExitCodeDefinition[] {
  return [
    {
      code: 0,
      name: 'success',
      description: 'Command completed successfully',
      conditions: ['No errors occurred']
    },
    {
      code: 1,
      name: 'general_error',
      description: 'General error occurred',
      conditions: ['Runtime error', 'Operation failed']
    },
    {
      code: 2,
      name: 'usage_error',
      description: 'Invalid command line usage',
      conditions: ['Invalid arguments', 'Missing required parameters']
    },
    {
      code: 130,
      name: 'interrupted',
      description: 'Command was interrupted by user',
      conditions: ['SIGINT received', 'Ctrl+C pressed']
    }
  ];
}

function generateShellIntegration(): ShellIntegrationDefinition[] {
  return [
    {
      shell: 'bash',
      features: ['completion', 'aliases'],
      installation_method: 'source completion script'
    },
    {
      shell: 'zsh',
      features: ['completion', 'aliases', 'functions'],
      installation_method: 'add to .zshrc'
    },
    {
      shell: 'fish',
      features: ['completion', 'abbreviations'],
      installation_method: 'install completion file'
    }
  ];
}

function generateEnvironmentVariables(commandName: string): EnvironmentVariableDefinition[] {
  const envVarPrefix = commandName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  
  return [
    {
      name: `${envVarPrefix}_CONFIG`,
      description: 'Path to configuration file',
      type: 'string',
      default: `~/.config/${commandName}/config.yaml`
    },
    {
      name: `${envVarPrefix}_LOG_LEVEL`,
      description: 'Logging level',
      type: 'string',
      default: 'info'
    },
    {
      name: `${envVarPrefix}_NO_COLOR`,
      description: 'Disable colored output',
      type: 'boolean',
      default: 'false'
    }
  ];
}

function getFileExtension(framework: string): string {
  const extensions: Record<string, string> = {
    node: '.js',
    python: '.py',
    go: '.go',
    rust: '.rs',
    bash: '.sh'
  };
  return extensions[framework] || '.txt';
}

function generateImplementationExample(spec: CLISpec, framework: string): string {
  switch (framework) {
    case 'node':
      return generateNodeExample(spec);
    case 'python':
      return generatePythonExample(spec);
    case 'go':
      return generateGoExample(spec);
    case 'rust':
      return generateRustExample(spec);
    case 'bash':
      return generateBashExample(spec);
    default:
      return `# ${framework} implementation for ${spec.identifier}\n# Implementation example not available for this framework`;
  }
}

function generateNodeExample(spec: CLISpec): string {
  return `#!/usr/bin/env node
/**
 * ${spec.identifier} - ${spec.summary}
 * Generated CLI implementation example
 */

const { program } = require('commander');
const pkg = require('./package.json');

// Configure main command
program
  .name('${spec.identifier}')
  .description('${spec.summary}')
  .version(pkg.version);

// Add global options
${spec.specification.interface.global_options.map(opt => {
  const shortFlag = opt.short ? `-${opt.short}, ` : '';
  return `program.option('${shortFlag}${opt.long}', '${opt.description}');`;
}).join('\n')}

// Add subcommands
${spec.specification.interface.subcommands ? Object.entries(spec.specification.interface.subcommands).map(([name, sub]) => `
program
  .command('${name}')
  .description('${sub.description}')
  ${sub.options.map(opt => {
    const shortFlag = opt.short ? `-${opt.short}, ` : '';
    return `.option('${shortFlag}${opt.long}', '${opt.description}')`;
  }).join('\n  ')}
  .action((options) => {
    console.log('Executing ${name} command with options:', options);
    // Implementation logic here
  });`).join('\n') : '// No subcommands defined'}

// Add arguments
${spec.specification.interface.arguments.map(arg => `
program.argument('${arg.required ? '<' : '['}${arg.name}${arg.required ? '>' : ']'}', '${arg.description}');`).join('')}

// Main action
program.action((${spec.specification.interface.arguments.map(arg => arg.name).join(', ')}, options) => {
  console.log('Executing main command');
  console.log('Arguments:', { ${spec.specification.interface.arguments.map(arg => arg.name).join(', ')} });
  console.log('Options:', options);
  
  // Implementation logic here
  process.exit(0);
});

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (err) {
  console.error('Error:', err.message);
  process.exit(err.exitCode || 1);
}
`;
}

function generatePythonExample(spec: CLISpec): string {
  return `#!/usr/bin/env python3
"""
${spec.identifier} - ${spec.summary}
Generated CLI implementation example
"""

import argparse
import sys
import logging

def setup_logging(verbose: bool, quiet: bool):
    """Setup logging configuration"""
    if quiet:
        level = logging.ERROR
    elif verbose:
        level = logging.DEBUG
    else:
        level = logging.INFO
    
    logging.basicConfig(
        level=level,
        format='%(levelname)s: %(message)s'
    )

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        prog='${spec.identifier}',
        description='${spec.summary}'
    )
    
    // Add global options
    ${spec.specification.interface.global_options.map(opt => {
      const action = opt.type === 'boolean' ? 'store_true' : 'store';
      const shortFlag = opt.short ? `'-${opt.short}', ` : '';
      return `parser.add_argument(${shortFlag}'${opt.long}', action='${action}', help='${opt.description}')`;
    }).join('\n    ')}
    
    // Add subcommands
    ${spec.specification.interface.subcommands ? `
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    ${Object.entries(spec.specification.interface.subcommands).map(([name, sub]) => `
    # ${name} subcommand
    ${name}_parser = subparsers.add_parser('${name}', help='${sub.description}')
    ${sub.options.map(opt => {
      const action = opt.type === 'boolean' ? 'store_true' : 'store';
      const shortFlag = opt.short ? `'-${opt.short}', ` : '';
      return `${name}_parser.add_argument(${shortFlag}'${opt.long}', action='${action}', help='${opt.description}')`;
    }).join('\n    ')}`).join('\n    ')}` : '# No subcommands defined'}
    
    # Add positional arguments
    ${spec.specification.interface.arguments.map(arg => {
      const nargs = arg.required ? '' : ", nargs='?'";
      return `parser.add_argument('${arg.name}', help='${arg.description}'${nargs})`;
    }).join('\n    ')}
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(getattr(args, 'verbose', False), getattr(args, 'quiet', False))
    
    try:
        # Handle subcommands
        if hasattr(args, 'command') and args.command:
            logging.info(f"Executing {args.command} command")
            # Subcommand implementation logic here
        else:
            logging.info("Executing main command")
            # Main command implementation logic here
        
        logging.info("Command completed successfully")
        sys.exit(0)
        
    except KeyboardInterrupt:
        logging.error("Command interrupted by user")
        sys.exit(130)
    except Exception as e:
        logging.error(f"Command failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
`;
}

function generateGoExample(spec: CLISpec): string {
  return `package main

// ${spec.identifier} - ${spec.summary}
// Generated CLI implementation example

import (
    "flag"
    "fmt"
    "log"
    "os"
)

type Config struct {
    Verbose bool
    Quiet   bool
    Help    bool
    Version bool
}

func main() {
    var config Config
    
    // Define flags
    flag.BoolVar(&config.Verbose, "verbose", false, "Enable verbose output")
    flag.BoolVar(&config.Verbose, "v", false, "Enable verbose output (short)")
    flag.BoolVar(&config.Quiet, "quiet", false, "Suppress output")
    flag.BoolVar(&config.Quiet, "q", false, "Suppress output (short)")
    flag.BoolVar(&config.Help, "help", false, "Show help information")
    flag.BoolVar(&config.Help, "h", false, "Show help information (short)")
    flag.BoolVar(&config.Version, "version", false, "Show version information")
    flag.BoolVar(&config.Version, "V", false, "Show version information (short)")
    
    flag.Parse()
    
    // Handle special flags
    if config.Help {
        flag.Usage()
        os.Exit(0)
    }
    
    if config.Version {
        fmt.Println("${spec.identifier} version 1.0.0")
        os.Exit(0)
    }
    
    // Setup logging
    if config.Quiet {
        log.SetOutput(os.Stderr)
    }
    
    // Get remaining arguments
    args := flag.Args()
    
    // Handle subcommands
    if len(args) > 0 {
        switch args[0] {
        ${spec.specification.interface.subcommands ? Object.keys(spec.specification.interface.subcommands).map(name => `
        case "${name}":
            handle${name.charAt(0).toUpperCase() + name.slice(1)}Command(args[1:], config)
        `).join('') : '// No subcommands defined'}
        default:
            fmt.Fprintf(os.Stderr, "Unknown command: %s\\n", args[0])
            os.Exit(2)
        }
    } else {
        // Main command logic
        handleMainCommand(args, config)
    }
}

func handleMainCommand(args []string, config Config) {
    if config.Verbose {
        log.Println("Executing main command")
    }
    
    // Implementation logic here
    fmt.Println("Command completed successfully")
}

${spec.specification.interface.subcommands ? Object.entries(spec.specification.interface.subcommands).map(([name, sub]) => `
func handle${name.charAt(0).toUpperCase() + name.slice(1)}Command(args []string, config Config) {
    if config.Verbose {
        log.Printf("Executing %s command", "${name}")
    }
    
    // ${sub.description}
    // Implementation logic here
    fmt.Printf("%s command completed successfully\\n", "${name}")
}`).join('\n') : ''}
`;
}

function generateRustExample(spec: CLISpec): string {
  return `// ${spec.identifier} - ${spec.summary}
// Generated CLI implementation example

use clap::{Arg, Command, ArgMatches};
use std::process;

fn main() {
    let app = Command::new("${spec.identifier}")
        .about("${spec.summary}")
        .version("1.0.0")
        ${spec.specification.interface.global_options.map(opt => {
          const short = opt.short ? `.short('${opt.short}')` : '';
          return `.arg(Arg::new("${opt.name}")
            ${short}
            .long("${opt.long.replace('--', '')}")
            .help("${opt.description}")
            .action(clap::ArgAction::SetTrue))`;
        }).join('\n        ')}
        ${spec.specification.interface.subcommands ? Object.entries(spec.specification.interface.subcommands).map(([name, sub]) => `
        .subcommand(
            Command::new("${name}")
                .about("${sub.description}")
                ${sub.options.map(opt => {
                  const short = opt.short ? `.short('${opt.short}')` : '';
                  return `.arg(Arg::new("${opt.name}")
                    ${short}
                    .long("${opt.long.replace('--', '')}")
                    .help("${opt.description}")
                    .action(clap::ArgAction::SetTrue))`;
                }).join('\n                ')}
        )`).join('') : '// No subcommands defined'}
        ${spec.specification.interface.arguments.map(arg => `
        .arg(Arg::new("${arg.name}")
            .help("${arg.description}")
            ${arg.required ? '.required(true)' : ''}
            .index(${arg.position || 1}))`).join('')};

    let matches = app.get_matches();

    // Handle global options
    let verbose = matches.get_flag("verbose");
    let quiet = matches.get_flag("quiet");

    if verbose {
        println!("Verbose mode enabled");
    }

    // Handle subcommands
    match matches.subcommand() {
        ${spec.specification.interface.subcommands ? Object.keys(spec.specification.interface.subcommands).map(name => `
        Some(("${name}", sub_matches)) => {
            handle_${name}_command(sub_matches, verbose, quiet);
        }`).join('') : '// No subcommands defined'}
        _ => {
            // Main command logic
            handle_main_command(&matches, verbose, quiet);
        }
    }
}

fn handle_main_command(matches: &ArgMatches, verbose: bool, quiet: bool) {
    if verbose {
        println!("Executing main command");
    }

    // Get arguments
    ${spec.specification.interface.arguments.map(arg => `
    let ${arg.name} = matches.get_one::<String>("${arg.name}");`).join('')}

    // Implementation logic here
    if !quiet {
        println!("Command completed successfully");
    }
}

${spec.specification.interface.subcommands ? Object.entries(spec.specification.interface.subcommands).map(([name, sub]) => `
fn handle_${name}_command(matches: &ArgMatches, verbose: bool, quiet: bool) {
    if verbose {
        println!("Executing ${name} command");
    }

    // ${sub.description}
    // Implementation logic here
    
    if !quiet {
        println!("${name} command completed successfully");
    }
}`).join('\n') : ''}
`;
}

function generateBashExample(spec: CLISpec): string {
  return `#!/bin/bash
# ${spec.identifier} - ${spec.summary}
# Generated CLI implementation example

set -euo pipefail

# Default values
VERBOSE=false
QUIET=false
COMMAND=""
${spec.specification.interface.arguments.map(arg => `${arg.name.toUpperCase()}=""`).join('\n')}

# Function to show help
show_help() {
    cat << EOF
${spec.identifier} - ${spec.summary}

Usage: ${spec.specification.interface.command.usage}

Options:
${spec.specification.interface.global_options.map(opt => {
  const short = opt.short ? `-${opt.short}, ` : '    ';
  return `  ${short}${opt.long.padEnd(20)} ${opt.description}`;
}).join('\n')}

${spec.specification.interface.subcommands ? `Commands:
${Object.entries(spec.specification.interface.subcommands).map(([name, sub]) => 
  `  ${name.padEnd(20)} ${sub.description}`
).join('\n')}` : ''}

Examples:
${spec.specification.interface.command.examples.map(ex => 
  `  ${ex.command.padEnd(30)} # ${ex.description}`
).join('\n')}
EOF
}

# Function to show version
show_version() {
    echo "${spec.identifier} version 1.0.0"
}

# Function to log messages
log() {
    local level="$1"
    shift
    if [[ "$level" == "ERROR" ]] || [[ "$QUIET" == "false" ]]; then
        if [[ "$level" == "DEBUG" && "$VERBOSE" == "false" ]]; then
            return
        fi
        echo "[$level] $*" >&2
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -V|--version)
            show_version
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -q|--quiet)
            QUIET=true
            shift
            ;;
        ${spec.specification.interface.subcommands ? Object.keys(spec.specification.interface.subcommands).map(name => `
        ${name})
            COMMAND="${name}"
            shift
            break
            ;;`).join('') : ''}
        -*)
            log "ERROR" "Unknown option: $1"
            exit 2
            ;;
        *)
            # Positional argument
            ${spec.specification.interface.arguments.length > 0 ? `
            if [[ -z "${spec.specification.interface.arguments[0].name.toUpperCase()}" ]]; then
                ${spec.specification.interface.arguments[0].name.toUpperCase()}="$1"
            fi` : ''}
            shift
            ;;
    esac
done

# Handle subcommands
case "$COMMAND" in
    ${spec.specification.interface.subcommands ? Object.entries(spec.specification.interface.subcommands).map(([name, sub]) => `
    "${name}")
        log "INFO" "Executing ${name} command"
        # ${sub.description}
        # Implementation logic here
        log "INFO" "${name} command completed successfully"
        ;;`).join('') : ''}
    "")
        # Main command logic
        log "DEBUG" "Executing main command"
        
        ${spec.specification.interface.arguments.map(arg => {
          if (arg.required) {
            return `
        if [[ -z "${arg.name.toUpperCase()}" ]]; then
            log "ERROR" "Missing required argument: ${arg.name}"
            exit 2
        fi`;
          }
          return '';
        }).join('')}
        
        # Implementation logic here
        log "INFO" "Command completed successfully"
        ;;
    *)
        log "ERROR" "Unknown command: $COMMAND"
        exit 2
        ;;
esac

exit 0
`;
} 