/**
 * Universal Spec Compliance Framework - Base Interfaces
 * 
 * This module provides the foundational interfaces and types for checking
 * compliance across different artifact types (API, UI, DB, CLI, Job, etc.)
 */

export interface ComplianceIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  location?: {
    file?: string;
    line?: number;
    column?: number;
    path?: string;
  };
  metadata?: Record<string, any>;
}

export interface ComplianceSuggestion {
  type: string;
  description: string;
  code?: string;
  autoFixable: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'structure' | 'validation' | 'accessibility' | 'performance' | 'security' | 'style';
}

export interface ComplianceResult {
  isCompliant: boolean;
  score: number; // 0.0 to 1.0
  issues: ComplianceIssue[];
  suggestions: ComplianceSuggestion[];
  metadata: {
    artifactType: string;
    identifier: string;
    checkedAt: Date;
    checkDuration: number; // milliseconds
    version: string;
  };
  dimensions: Record<string, ComplianceDimension>;
}

export interface ComplianceDimension {
  name: string;
  score: number;
  isCompliant: boolean;
  issues: ComplianceIssue[];
  weight: number; // For overall score calculation
}

export interface ArtifactSpec {
  type: ArtifactType;
  identifier: string;
  version: string;
  summary: string;
  metadata: Record<string, any>;
  specification: any; // Type-specific spec content
  complianceRules: ComplianceRule[];
}

export interface ComplianceRule {
  id: string;
  category: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  condition: string; // Human readable condition
  validator?: (spec: any, implementation: any) => boolean;
}

export interface ComplianceContext {
  artifactType: ArtifactType;
  projectPath: string;
  projectContext: ProjectContext;
  toolchain: string[];
  conventions: Convention[];
  environment: 'development' | 'staging' | 'production';
}

export interface ProjectContext {
  type: 'nextjs' | 'react' | 'vue' | 'express' | 'fastify' | 'unknown';
  language: 'typescript' | 'javascript' | 'python' | 'go' | 'rust';
  framework: string[];
  dependencies: Record<string, string>;
  patterns: string[];
  features: string[];
}

export interface Convention {
  name: string;
  description: string;
  rules: string[];
  examples: string[];
}

export type ArtifactType = 'api' | 'ui' | 'page' | 'cli' | 'job' | 'db' | 'lib';

/**
 * Base interface for all compliance checkers
 */
export interface SpecComplianceChecker<TSpec, TImplementation> {
  readonly artifactType: ArtifactType;
  readonly supportedFrameworks: string[];
  
  /**
   * Check compliance of implementation against specification
   */
  checkCompliance(
    spec: TSpec, 
    implementation: TImplementation, 
    context: ComplianceContext
  ): Promise<ComplianceResult>;
  
  /**
   * Generate actionable suggestions based on issues
   */
  generateSuggestions(issues: ComplianceIssue[], context: ComplianceContext): ComplianceSuggestion[];
  
  /**
   * Calculate compliance score based on issues and weights
   */
  calculateScore(dimensions: Record<string, ComplianceDimension>): number;
  
  /**
   * Validate that the checker can handle the given spec and implementation
   */
  canHandle(spec: any, implementation: any, context: ComplianceContext): boolean;
  
  /**
   * Get compliance dimensions that this checker evaluates
   */
  getComplianceDimensions(): string[];
}

/**
 * Abstract base class for compliance checkers
 */
export abstract class BaseComplianceChecker<TSpec, TImplementation> 
  implements SpecComplianceChecker<TSpec, TImplementation> {
  
  abstract readonly artifactType: ArtifactType;
  abstract readonly supportedFrameworks: string[];
  
  async checkCompliance(
    spec: TSpec, 
    implementation: TImplementation, 
    context: ComplianceContext
  ): Promise<ComplianceResult> {
    const startTime = Date.now();
    
    if (!this.canHandle(spec, implementation, context)) {
      throw new Error(`Cannot handle ${context.artifactType} compliance checking`);
    }
    
    const dimensions = await this.evaluateComplianceDimensions(spec, implementation, context);
    const allIssues = Object.values(dimensions).flatMap(d => d.issues);
    const score = this.calculateScore(dimensions);
    const isCompliant = score >= 0.8 && allIssues.filter(i => i.severity === 'error').length === 0;
    
    return {
      isCompliant,
      score,
      issues: allIssues,
      suggestions: this.generateSuggestions(allIssues, context),
      metadata: {
        artifactType: this.artifactType,
        identifier: this.extractIdentifier(spec),
        checkedAt: new Date(),
        checkDuration: Date.now() - startTime,
        version: '1.0.0'
      },
      dimensions
    };
  }
  
  calculateScore(dimensions: Record<string, ComplianceDimension>): number {
    const totalWeight = Object.values(dimensions).reduce((sum, d) => sum + d.weight, 0);
    if (totalWeight === 0) return 1.0;
    
    const weightedScore = Object.values(dimensions).reduce(
      (sum, d) => sum + (d.score * d.weight), 
      0
    );
    
    return weightedScore / totalWeight;
  }
  
  generateSuggestions(issues: ComplianceIssue[], context: ComplianceContext): ComplianceSuggestion[] {
    return issues
      .filter(issue => issue.suggestion)
      .map(issue => this.createSuggestionFromIssue(issue, context))
      .filter(Boolean) as ComplianceSuggestion[];
  }
  
  canHandle(spec: any, implementation: any, context: ComplianceContext): boolean {
    return context.artifactType === this.artifactType;
  }
  
  abstract getComplianceDimensions(): string[];
  
  /**
   * Evaluate all compliance dimensions for this artifact type
   */
  protected abstract evaluateComplianceDimensions(
    spec: TSpec, 
    implementation: TImplementation, 
    context: ComplianceContext
  ): Promise<Record<string, ComplianceDimension>>;
  
  /**
   * Extract identifier from spec
   */
  protected abstract extractIdentifier(spec: TSpec): string;
  
  /**
   * Create suggestion from issue
   */
  protected createSuggestionFromIssue(issue: ComplianceIssue, context: ComplianceContext): ComplianceSuggestion | null {
    if (!issue.suggestion) return null;
    
    return {
      type: issue.type,
      description: issue.suggestion,
      autoFixable: this.isAutoFixable(issue.type),
      priority: this.getSuggestionPriority(issue.severity),
      category: this.getSuggestionCategory(issue.type)
    };
  }
  
  protected isAutoFixable(issueType: string): boolean {
    // Override in subclasses for specific auto-fixable patterns
    return false;
  }
  
  protected getSuggestionPriority(severity: 'error' | 'warning' | 'info'): 'high' | 'medium' | 'low' {
    switch (severity) {
      case 'error': return 'high';
      case 'warning': return 'medium';
      case 'info': return 'low';
    }
  }
  
  protected getSuggestionCategory(issueType: string): ComplianceSuggestion['category'] {
    // Map issue types to categories - override in subclasses for specificity
    if (issueType.includes('VALIDATION')) return 'validation';
    if (issueType.includes('ACCESSIBILITY')) return 'accessibility';
    if (issueType.includes('PERFORMANCE')) return 'performance';
    if (issueType.includes('SECURITY')) return 'security';
    if (issueType.includes('STYLE')) return 'style';
    return 'structure';
  }
  
  /**
   * Create a compliance dimension
   */
  protected createDimension(
    name: string, 
    issues: ComplianceIssue[], 
    weight: number = 1.0
  ): ComplianceDimension {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    // Calculate score: start at 1.0, deduct for issues
    const errorPenalty = errorCount * 0.3;
    const warningPenalty = warningCount * 0.1;
    const score = Math.max(0, 1.0 - errorPenalty - warningPenalty);
    
    return {
      name,
      score,
      isCompliant: errorCount === 0 && score >= 0.8,
      issues,
      weight
    };
  }
}

/**
 * Factory for creating compliance checkers
 */
export class ComplianceCheckerFactory {
  private static checkers = new Map<ArtifactType, () => SpecComplianceChecker<any, any>>();
  
  static register<TSpec, TImplementation>(
    type: ArtifactType, 
    factory: () => SpecComplianceChecker<TSpec, TImplementation>
  ): void {
    this.checkers.set(type, factory);
  }
  
  static create(type: ArtifactType): SpecComplianceChecker<any, any> {
    const factory = this.checkers.get(type);
    if (!factory) {
      throw new Error(`No compliance checker registered for artifact type: ${type}`);
    }
    return factory();
  }
  
  static getSupportedTypes(): ArtifactType[] {
    return Array.from(this.checkers.keys());
  }
}

/**
 * Utility functions for compliance checking
 */
export class ComplianceUtils {
  /**
   * Merge multiple compliance results
   */
  static mergeResults(results: ComplianceResult[]): ComplianceResult {
    if (results.length === 0) {
      throw new Error('Cannot merge empty results array');
    }
    
    if (results.length === 1) {
      return results[0];
    }
    
    const allIssues = results.flatMap(r => r.issues);
    const allSuggestions = results.flatMap(r => r.suggestions);
    const allDimensions = results.reduce((acc, r) => ({ ...acc, ...r.dimensions }), {});
    
    const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const isCompliant = results.every(r => r.isCompliant);
    
    return {
      isCompliant,
      score: totalScore,
      issues: allIssues,
      suggestions: allSuggestions,
      metadata: {
        artifactType: 'mixed' as any,
        identifier: 'project-wide',
        checkedAt: new Date(),
        checkDuration: results.reduce((sum, r) => sum + r.metadata.checkDuration, 0),
        version: '1.0.0'
      },
      dimensions: allDimensions
    };
  }
  
  /**
   * Filter issues by severity
   */
  static filterIssuesBySeverity(
    issues: ComplianceIssue[], 
    severity: 'error' | 'warning' | 'info'
  ): ComplianceIssue[] {
    return issues.filter(issue => issue.severity === severity);
  }
  
  /**
   * Group issues by type
   */
  static groupIssuesByType(issues: ComplianceIssue[]): Record<string, ComplianceIssue[]> {
    return issues.reduce((groups, issue) => {
      const type = issue.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(issue);
      return groups;
    }, {} as Record<string, ComplianceIssue[]>);
  }
  
  /**
   * Generate compliance summary text
   */
  static generateSummary(result: ComplianceResult): string {
    const status = result.isCompliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT';
    const score = `${(result.score * 100).toFixed(1)}%`;
    const issueCount = result.issues.length;
    const errorCount = this.filterIssuesBySeverity(result.issues, 'error').length;
    
    let summary = `${status} (${score})`;
    
    if (issueCount > 0) {
      summary += ` - ${issueCount} issue${issueCount === 1 ? '' : 's'} found`;
      if (errorCount > 0) {
        summary += ` (${errorCount} critical)`;
      }
    }
    
    return summary;
  }
} 