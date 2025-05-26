/**
 * CLI Compliance Checker
 * 
 * Validates CLI implementations against their specifications, checking:
 * - Command-line interface compliance (arguments, options, subcommands)
 * - Help system and documentation
 * - Error handling and exit codes
 * - User interaction patterns
 * - Output formatting and verbosity
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  BaseComplianceChecker, 
  ComplianceIssue, 
  ComplianceDimension, 
  ComplianceContext,
  ArtifactType,
  ComplianceSuggestion
} from './base.js';
import { CLISpec } from '../grow_cli_spec.js';

export interface CLIImplementation {
  filePath: string;
  content: string;
  framework: 'node' | 'python' | 'go' | 'rust' | 'bash';
  language: 'javascript' | 'typescript' | 'python' | 'go' | 'rust' | 'bash';
  hasArgumentParsing: boolean;
  hasHelpSystem: boolean;
  hasErrorHandling: boolean;
  hasSubcommands: boolean;
}

export class CLIComplianceChecker extends BaseComplianceChecker<CLISpec, CLIImplementation> {
  readonly artifactType: ArtifactType = 'cli';
  readonly supportedFrameworks = ['node', 'python', 'go', 'rust', 'bash'];

  getComplianceDimensions(): string[] {
    return [
      'interface_compliance',
      'help_system_compliance',
      'error_handling_compliance',
      'user_interaction_compliance',
      'output_format_compliance'
    ];
  }

  protected async evaluateComplianceDimensions(
    spec: CLISpec, 
    implementation: CLIImplementation, 
    context: ComplianceContext
  ): Promise<Record<string, ComplianceDimension>> {
    
    const dimensions: Record<string, ComplianceDimension> = {};

    // Interface compliance (highest weight - critical for CLI functionality)
    const interfaceIssues = await this.checkInterfaceCompliance(spec, implementation);
    dimensions.interface_compliance = this.createDimension('Interface Compliance', interfaceIssues, 3.0);

    // Help system compliance (high weight - critical for usability)
    const helpIssues = await this.checkHelpSystemCompliance(spec, implementation);
    dimensions.help_system_compliance = this.createDimension('Help System Compliance', helpIssues, 2.0);

    // Error handling compliance (high weight - critical for reliability)
    const errorIssues = await this.checkErrorHandlingCompliance(spec, implementation);
    dimensions.error_handling_compliance = this.createDimension('Error Handling Compliance', errorIssues, 2.0);

    // User interaction compliance (medium weight - important for UX)
    const interactionIssues = await this.checkUserInteractionCompliance(spec, implementation);
    dimensions.user_interaction_compliance = this.createDimension('User Interaction Compliance', interactionIssues, 1.5);

    // Output format compliance (medium weight - important for consistency)
    const outputIssues = await this.checkOutputFormatCompliance(spec, implementation);
    dimensions.output_format_compliance = this.createDimension('Output Format Compliance', outputIssues, 1.0);

    return dimensions;
  }

  protected extractIdentifier(spec: CLISpec): string {
    return spec.identifier;
  }

  canHandle(spec: any, implementation: any, context: ComplianceContext): boolean {
    return context.artifactType === 'cli' && 
           this.supportedFrameworks.includes(implementation?.framework);
  }

  private async checkInterfaceCompliance(
    spec: CLISpec, 
    implementation: CLIImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];
    
    // Check if implementation has argument parsing
    if (!implementation.hasArgumentParsing) {
      issues.push({
        type: 'MISSING_ARGUMENT_PARSING',
        severity: 'error',
        message: 'CLI implementation missing argument parsing logic',
        suggestion: 'Add argument parsing using appropriate library for your framework',
        location: { file: implementation.filePath }
      });
      return issues; // Can't check further without argument parsing
    }

    // Check global options
    for (const option of spec.specification.interface.global_options) {
      if (!this.hasOption(implementation, option)) {
        issues.push({
          type: 'MISSING_OPTION',
          severity: 'error',
          message: `Missing option: ${option.long}`,
          suggestion: `Add option ${option.long} (${option.short ? `-${option.short}` : 'no short form'}) - ${option.description}`,
          location: { file: implementation.filePath }
        });
      }
    }

    // Check positional arguments
    for (const arg of spec.specification.interface.arguments) {
      if (!this.hasArgument(implementation, arg)) {
        issues.push({
          type: 'MISSING_ARGUMENT',
          severity: 'error',
          message: `Missing positional argument: ${arg.name}`,
          suggestion: `Add positional argument ${arg.name} - ${arg.description}`,
          location: { file: implementation.filePath }
        });
      }
    }

    // Check subcommands
    if (spec.specification.interface.subcommands) {
      if (!implementation.hasSubcommands) {
        issues.push({
          type: 'MISSING_SUBCOMMANDS',
          severity: 'error',
          message: 'CLI implementation missing subcommand support',
          suggestion: 'Add subcommand parsing and routing logic',
          location: { file: implementation.filePath }
        });
      }
    }

    return issues;
  }

  private async checkHelpSystemCompliance(
    spec: CLISpec, 
    implementation: CLIImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Check if help system exists
    if (!implementation.hasHelpSystem) {
      issues.push({
        type: 'MISSING_HELP_SYSTEM',
        severity: 'error',
        message: 'CLI implementation missing help system',
        suggestion: 'Add --help option and help text generation',
        location: { file: implementation.filePath }
      });
    }

    // Check help option
    if (!this.hasHelpOption(implementation)) {
      issues.push({
        type: 'MISSING_HELP_OPTION',
        severity: 'error',
        message: 'Missing --help option',
        suggestion: 'Add --help (-h) option to display usage information',
        location: { file: implementation.filePath }
      });
    }

    // Check version option
    if (!this.hasVersionOption(implementation)) {
      issues.push({
        type: 'MISSING_VERSION_OPTION',
        severity: 'error',
        message: 'Missing --version option',
        suggestion: 'Add --version (-V) option to display version information',
        location: { file: implementation.filePath }
      });
    }

    return issues;
  }

  private async checkErrorHandlingCompliance(
    spec: CLISpec, 
    implementation: CLIImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Check if error handling exists
    if (!implementation.hasErrorHandling) {
      issues.push({
        type: 'MISSING_ERROR_HANDLING',
        severity: 'error',
        message: 'CLI implementation missing error handling',
        suggestion: 'Add try-catch blocks and error reporting',
        location: { file: implementation.filePath }
      });
    }

    // Check exit codes
    for (const exitCode of spec.specification.output.exit_codes) {
      if (!this.hasExitCode(implementation, exitCode.code)) {
        issues.push({
          type: 'MISSING_EXIT_CODE',
          severity: 'warning',
          message: `Missing exit code ${exitCode.code} (${exitCode.name})`,
          suggestion: `Add exit code ${exitCode.code} for: ${exitCode.description}`,
          location: { file: implementation.filePath }
        });
      }
    }

    return issues;
  }

  private async checkUserInteractionCompliance(
    spec: CLISpec, 
    implementation: CLIImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Check user interactions defined in spec
    for (const interaction of spec.specification.behavior.user_interaction) {
      if (!this.hasUserInteraction(implementation, interaction)) {
        issues.push({
          type: 'MISSING_USER_INTERACTION',
          severity: 'info',
          message: `Missing ${interaction.type} interaction: ${interaction.description}`,
          suggestion: `Add ${interaction.type} prompt: ${interaction.format}`,
          location: { file: implementation.filePath }
        });
      }
    }

    return issues;
  }

  private async checkOutputFormatCompliance(
    spec: CLISpec, 
    implementation: CLIImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Check output formats
    for (const format of spec.specification.output.formats) {
      if (!this.hasOutputFormat(implementation, format)) {
        issues.push({
          type: 'MISSING_OUTPUT_FORMAT',
          severity: 'info',
          message: `Missing output format: ${format.name}`,
          suggestion: `Add ${format.name} output format with options: ${format.options.join(', ')}`,
          location: { file: implementation.filePath }
        });
      }
    }

    return issues;
  }

  // Helper methods for implementation analysis
  private hasOption(implementation: CLIImplementation, option: any): boolean {
    const optionPatterns = [
      new RegExp(`${option.long}`, 'i'),
      new RegExp(`option.*${option.name}`, 'i')
    ];
    return optionPatterns.some(pattern => pattern.test(implementation.content));
  }

  private hasArgument(implementation: CLIImplementation, arg: any): boolean {
    const argPatterns = [
      new RegExp(`${arg.name}`, 'i'),
      new RegExp(`argument.*${arg.name}`, 'i')
    ];
    return argPatterns.some(pattern => pattern.test(implementation.content));
  }

  private hasHelpOption(implementation: CLIImplementation): boolean {
    const helpPatterns = [
      /--help/i,
      /-h[^a-zA-Z]/i,
      /help.*option/i
    ];
    return helpPatterns.some(pattern => pattern.test(implementation.content));
  }

  private hasVersionOption(implementation: CLIImplementation): boolean {
    const versionPatterns = [
      /--version/i,
      /-V[^a-zA-Z]/i,
      /version.*option/i
    ];
    return versionPatterns.some(pattern => pattern.test(implementation.content));
  }

  private hasExitCode(implementation: CLIImplementation, code: number): boolean {
    const exitPatterns = [
      new RegExp(`exit\\s*\\(\\s*${code}\\s*\\)`, 'i'),
      new RegExp(`process\\.exit\\s*\\(\\s*${code}\\s*\\)`, 'i')
    ];
    return exitPatterns.some(pattern => pattern.test(implementation.content));
  }

  private hasUserInteraction(implementation: CLIImplementation, interaction: any): boolean {
    const interactionPatterns = [
      new RegExp(interaction.type, 'i'),
      /prompt/i,
      /confirm/i
    ];
    return interactionPatterns.some(pattern => pattern.test(implementation.content));
  }

  private hasOutputFormat(implementation: CLIImplementation, format: any): boolean {
    const formatPatterns = [
      new RegExp(format.name, 'i'),
      new RegExp(`format.*${format.name}`, 'i')
    ];
    return formatPatterns.some(pattern => pattern.test(implementation.content));
  }

  protected isAutoFixable(issueType: string): boolean {
    const autoFixableTypes = [
      'MISSING_HELP_OPTION',
      'MISSING_VERSION_OPTION'
    ];
    return autoFixableTypes.includes(issueType);
  }

  generateSuggestions(issues: ComplianceIssue[], context: ComplianceContext): ComplianceSuggestion[] {
    const suggestions = super.generateSuggestions(issues, context);
    
    // Add CLI-specific code suggestions
    return suggestions.map(suggestion => {
      if (suggestion.type === 'MISSING_HELP_OPTION') {
        suggestion.code = 'program.option(\'-h, --help\', \'Show help information\');';
      } else if (suggestion.type === 'MISSING_VERSION_OPTION') {
        suggestion.code = 'program.option(\'-V, --version\', \'Show version information\');';
      }
      
      return suggestion;
    });
  }
} 