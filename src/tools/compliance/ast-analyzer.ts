/**
 * AST Analyzer for Compliance Checking
 * 
 * This module provides AST parsing and analysis capabilities for compliance checking.
 * It creates detailed tree representations of code with compliance annotations.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { ComplianceIssue } from './base.js';

export interface ASTNode {
  type: string;
  name?: string;
  children: ASTNode[];
  location: {
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
  };
  compliance: NodeCompliance;
  metadata: {
    [key: string]: any;
  };
}

export interface NodeCompliance {
  status: 'compliant' | 'non-compliant' | 'warning' | 'unknown';
  badge: string; // ✅, ❌, ⚠️, ❓
  issues: ComplianceIssue[];
  suggestions: string[];
  hallucinations: HallucinationCheck[];
}

export interface HallucinationCheck {
  type: 'undefined_reference' | 'missing_import' | 'unknown_function' | 'invalid_property';
  description: string;
  severity: 'error' | 'warning';
  suggestion: string;
}

export interface ASTComplianceResult {
  tree: ASTNode;
  summary: {
    totalNodes: number;
    compliantNodes: number;
    nonCompliantNodes: number;
    warningNodes: number;
    unknownNodes: number;
    hallucinationCount: number;
  };
  indentedTree: string;
  timestamp: Date;
  filePath: string;
}

export class ASTAnalyzer {
  private sourceFile: ts.SourceFile | null = null;
  private typeChecker: ts.TypeChecker | null = null;

  /**
   * Analyze a TypeScript/JavaScript file and return AST with compliance annotations
   */
  async analyzeFile(filePath: string, spec?: any): Promise<ASTComplianceResult> {
    const content = fs.readFileSync(filePath, 'utf8');
    return this.analyzeCode(content, filePath, spec);
  }

  /**
   * Analyze code content and return AST with compliance annotations
   */
  async analyzeCode(content: string, filePath: string, spec?: any): Promise<ASTComplianceResult> {
    // Create TypeScript program for type checking
    const program = ts.createProgram([filePath], {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.CommonJS,
      allowJs: true,
      checkJs: false,
      noEmit: true
    });

    this.sourceFile = program.getSourceFile(filePath) || 
                     ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
    this.typeChecker = program.getTypeChecker();

    // Build AST tree with compliance annotations
    const tree = this.buildASTTree(this.sourceFile, spec);
    
    // Generate summary
    const summary = this.generateSummary(tree);
    
    // Generate indented tree representation
    const indentedTree = this.generateIndentedTree(tree);

    return {
      tree,
      summary,
      indentedTree,
      timestamp: new Date(),
      filePath
    };
  }

  /**
   * Build AST tree with compliance annotations
   */
  private buildASTTree(node: ts.Node, spec?: any, depth: number = 0): ASTNode {
    const location = this.getNodeLocation(node);
    const compliance = this.analyzeNodeCompliance(node, spec);
    const metadata = this.extractNodeMetadata(node);

    const astNode: ASTNode = {
      type: ts.SyntaxKind[node.kind],
      name: this.getNodeName(node),
      children: [],
      location,
      compliance,
      metadata
    };

    // Recursively process children
    ts.forEachChild(node, (child) => {
      astNode.children.push(this.buildASTTree(child, spec, depth + 1));
    });

    return astNode;
  }

  /**
   * Analyze compliance for a specific AST node
   */
  private analyzeNodeCompliance(node: ts.Node, spec?: any): NodeCompliance {
    const issues: ComplianceIssue[] = [];
    const suggestions: string[] = [];
    const hallucinations: HallucinationCheck[] = [];

    // Check for hallucinations (undefined references, missing imports, etc.)
    this.checkForHallucinations(node, hallucinations);

    // Check node-specific compliance based on type
    switch (node.kind) {
      case ts.SyntaxKind.FunctionDeclaration:
        this.checkFunctionCompliance(node as ts.FunctionDeclaration, issues, suggestions, spec);
        break;
      case ts.SyntaxKind.VariableDeclaration:
        this.checkVariableCompliance(node as ts.VariableDeclaration, issues, suggestions);
        break;
      case ts.SyntaxKind.CallExpression:
        this.checkCallExpressionCompliance(node as ts.CallExpression, issues, suggestions, hallucinations);
        break;
      case ts.SyntaxKind.ImportDeclaration:
        this.checkImportCompliance(node as ts.ImportDeclaration, issues, suggestions);
        break;
    }

    // Determine overall compliance status
    let status: NodeCompliance['status'] = 'compliant';
    let badge = '✅';

    if (hallucinations.length > 0 || issues.some(i => i.severity === 'error')) {
      status = 'non-compliant';
      badge = '❌';
    } else if (issues.some(i => i.severity === 'warning')) {
      status = 'warning';
      badge = '⚠️';
    } else if (issues.length === 0 && hallucinations.length === 0) {
      status = 'compliant';
      badge = '✅';
    } else {
      status = 'unknown';
      badge = '❓';
    }

    return {
      status,
      badge,
      issues,
      suggestions,
      hallucinations
    };
  }

  /**
   * Check for potential hallucinations in the code
   */
  private checkForHallucinations(node: ts.Node, hallucinations: HallucinationCheck[]): void {
    if (ts.isIdentifier(node) && this.typeChecker) {
      const symbol = this.typeChecker.getSymbolAtLocation(node);
      
      if (!symbol && node.text && !this.isBuiltInIdentifier(node.text)) {
        // Check if this is an undefined reference
        hallucinations.push({
          type: 'undefined_reference',
          description: `'${node.text}' is not defined`,
          severity: 'error',
          suggestion: `Define '${node.text}' or import it from the appropriate module`
        });
      }
    }

    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isIdentifier(expression) && this.typeChecker) {
        const symbol = this.typeChecker.getSymbolAtLocation(expression);
        
        if (!symbol && !this.isBuiltInFunction(expression.text)) {
          hallucinations.push({
            type: 'unknown_function',
            description: `Function '${expression.text}' is not defined`,
            severity: 'error',
            suggestion: `Import or define function '${expression.text}'`
          });
        }
      }
    }

    if (ts.isPropertyAccessExpression(node)) {
      const propertyName = node.name.text;
      if (this.typeChecker) {
        const type = this.typeChecker.getTypeAtLocation(node.expression);
        const property = type.getProperty(propertyName);
        
        if (!property && !this.isBuiltInProperty(propertyName)) {
          hallucinations.push({
            type: 'invalid_property',
            description: `Property '${propertyName}' does not exist`,
            severity: 'warning',
            suggestion: `Check if property '${propertyName}' exists or use a different property`
          });
        }
      }
    }
  }

  /**
   * Check function declaration compliance
   */
  private checkFunctionCompliance(
    node: ts.FunctionDeclaration, 
    issues: ComplianceIssue[], 
    suggestions: string[], 
    spec?: any
  ): void {
    const functionName = node.name?.text;
    
    // Check if function has documentation
    const hasJSDoc = ts.getJSDocCommentsAndTags(node).length > 0;
    if (!hasJSDoc) {
      issues.push({
        type: 'MISSING_DOCUMENTATION' as any,
        severity: 'warning',
        message: `Function '${functionName}' lacks documentation`,
        suggestion: 'Add JSDoc comments to document the function'
      });
      suggestions.push(`Add JSDoc documentation for function '${functionName}'`);
    }

    // Check parameter validation
    if (node.parameters.length > 0) {
      const hasParameterValidation = this.hasParameterValidation(node);
      if (!hasParameterValidation) {
        issues.push({
          type: 'MISSING_VALIDATION' as any,
          severity: 'warning',
          message: `Function '${functionName}' parameters lack validation`,
          suggestion: 'Add parameter validation to ensure type safety'
        });
      }
    }

    // Check return type annotation
    if (!node.type) {
      issues.push({
        type: 'MISSING_TYPE_ANNOTATION' as any,
        severity: 'info',
        message: `Function '${functionName}' lacks return type annotation`,
        suggestion: 'Add explicit return type annotation'
      });
    }
  }

  /**
   * Check variable declaration compliance
   */
  private checkVariableCompliance(
    node: ts.VariableDeclaration, 
    issues: ComplianceIssue[], 
    suggestions: string[]
  ): void {
    const variableName = ts.isIdentifier(node.name) ? node.name.text : 'unknown';
    
    // Check if variable has type annotation
    if (!node.type && !node.initializer) {
      issues.push({
        type: 'MISSING_TYPE_ANNOTATION' as any,
        severity: 'warning',
        message: `Variable '${variableName}' lacks type annotation`,
        suggestion: 'Add explicit type annotation or initializer'
      });
    }

    // Check naming convention
    if (!this.followsNamingConvention(variableName)) {
      issues.push({
        type: 'NAMING_CONVENTION' as any,
        severity: 'info',
        message: `Variable '${variableName}' doesn't follow naming convention`,
        suggestion: 'Use camelCase for variable names'
      });
    }
  }

  /**
   * Check call expression compliance
   */
  private checkCallExpressionCompliance(
    node: ts.CallExpression, 
    issues: ComplianceIssue[], 
    suggestions: string[],
    hallucinations: HallucinationCheck[]
  ): void {
    // Check for error handling around async calls
    if (this.isAsyncCall(node)) {
      const hasErrorHandling = this.hasErrorHandling(node);
      if (!hasErrorHandling) {
        issues.push({
          type: 'MISSING_ERROR_HANDLING' as any,
          severity: 'warning',
          message: 'Async call lacks error handling',
          suggestion: 'Wrap async calls in try-catch blocks'
        });
      }
    }
  }

  /**
   * Check import declaration compliance
   */
  private checkImportCompliance(
    node: ts.ImportDeclaration, 
    issues: ComplianceIssue[], 
    suggestions: string[]
  ): void {
    const moduleSpecifier = node.moduleSpecifier;
    if (ts.isStringLiteral(moduleSpecifier)) {
      const moduleName = moduleSpecifier.text;
      
      // Check if import is from a relative path
      if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
        // Check if the imported file exists
        const currentDir = path.dirname(this.sourceFile?.fileName || '');
        const importPath = path.resolve(currentDir, moduleName);
        const possibleExtensions = ['.ts', '.js', '.tsx', '.jsx'];
        
        let fileExists = false;
        for (const ext of possibleExtensions) {
          if (fs.existsSync(importPath + ext)) {
            fileExists = true;
            break;
          }
        }
        
        if (!fileExists && fs.existsSync(importPath) && fs.statSync(importPath).isDirectory()) {
          // Check for index file
          for (const ext of possibleExtensions) {
            if (fs.existsSync(path.join(importPath, 'index' + ext))) {
              fileExists = true;
              break;
            }
          }
        }
        
        if (!fileExists) {
          issues.push({
            type: 'MISSING_FILE' as any,
            severity: 'error',
            message: `Imported file '${moduleName}' does not exist`,
            suggestion: `Create the file '${moduleName}' or fix the import path`
          });
        }
      }
    }
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(tree: ASTNode): ASTComplianceResult['summary'] {
    const stats = {
      totalNodes: 0,
      compliantNodes: 0,
      nonCompliantNodes: 0,
      warningNodes: 0,
      unknownNodes: 0,
      hallucinationCount: 0
    };

    const traverse = (node: ASTNode) => {
      stats.totalNodes++;
      stats.hallucinationCount += node.compliance.hallucinations.length;
      
      switch (node.compliance.status) {
        case 'compliant':
          stats.compliantNodes++;
          break;
        case 'non-compliant':
          stats.nonCompliantNodes++;
          break;
        case 'warning':
          stats.warningNodes++;
          break;
        case 'unknown':
          stats.unknownNodes++;
          break;
      }

      node.children.forEach(traverse);
    };

    traverse(tree);
    return stats;
  }

  /**
   * Generate indented tree representation with compliance badges
   */
  private generateIndentedTree(tree: ASTNode, depth: number = 0): string {
    const indent = '  '.repeat(depth);
    const prefix = depth > 0 ? (depth === 1 ? '├── ' : '│   ├── ') : '';
    
    let line = `${indent}${prefix}${tree.type}`;
    
    if (tree.name) {
      line += `: ${tree.name}`;
    }
    
    // Add compliance badge
    line += ` [${tree.compliance.badge} ${tree.compliance.status.toUpperCase()}]`;
    
    // Add hallucination indicators
    if (tree.compliance.hallucinations.length > 0) {
      const hallucinationTypes = tree.compliance.hallucinations.map(h => h.type).join(', ');
      line += ` [🔍 HALLUCINATED - ${hallucinationTypes}]`;
    }
    
    // Add issue details for non-compliant nodes
    if (tree.compliance.issues.length > 0) {
      const mainIssue = tree.compliance.issues[0];
      line += `\n${indent}${depth > 0 ? '│   ' : ''}    └── ${mainIssue.message}`;
    }

    let result = line;
    
    // Process children
    tree.children.forEach((child, index) => {
      const isLast = index === tree.children.length - 1;
      const childIndent = depth > 0 ? (isLast ? '    ' : '│   ') : '';
      result += '\n' + this.generateIndentedTree(child, depth + 1);
    });

    return result;
  }

  /**
   * Helper methods
   */
  private getNodeLocation(node: ts.Node): ASTNode['location'] {
    if (!this.sourceFile) {
      return { line: 0, column: 0, endLine: 0, endColumn: 0 };
    }

    const start = this.sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = this.sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    
    return {
      line: start.line + 1,
      column: start.character + 1,
      endLine: end.line + 1,
      endColumn: end.character + 1
    };
  }

  private getNodeName(node: ts.Node): string | undefined {
    if (ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node) || ts.isClassDeclaration(node)) {
      return node.name?.getText();
    }
    if (ts.isIdentifier(node)) {
      return node.text;
    }
    return undefined;
  }

  private extractNodeMetadata(node: ts.Node): { [key: string]: any } {
    const metadata: { [key: string]: any } = {};
    
    if (ts.isFunctionDeclaration(node)) {
      metadata.parameterCount = node.parameters.length;
      metadata.isAsync = !!(node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword));
      metadata.isExported = !!(node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword));
    }
    
    if (ts.isVariableDeclaration(node)) {
      metadata.hasInitializer = !!node.initializer;
      metadata.hasTypeAnnotation = !!node.type;
    }
    
    return metadata;
  }

  private isBuiltInIdentifier(name: string): boolean {
    const builtIns = ['console', 'process', 'Buffer', 'global', 'window', 'document', 'undefined', 'null'];
    return builtIns.includes(name);
  }

  private isBuiltInFunction(name: string): boolean {
    const builtInFunctions = ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'parseInt', 'parseFloat', 'isNaN', 'isFinite'];
    return builtInFunctions.includes(name);
  }

  private isBuiltInProperty(name: string): boolean {
    const builtInProperties = ['length', 'prototype', 'constructor', 'toString', 'valueOf'];
    return builtInProperties.includes(name);
  }

  private hasParameterValidation(node: ts.FunctionDeclaration): boolean {
    // Simple heuristic: check if function body contains validation keywords
    const bodyText = node.body?.getText() || '';
    return /validate|check|assert|throw|error/i.test(bodyText);
  }

  private followsNamingConvention(name: string): boolean {
    // Check camelCase convention
    return /^[a-z][a-zA-Z0-9]*$/.test(name);
  }

  private isAsyncCall(node: ts.CallExpression): boolean {
    const text = node.getText();
    return /await|\.then\(|\.catch\(|Promise/.test(text);
  }

  private hasErrorHandling(node: ts.CallExpression): boolean {
    // Check if the call is wrapped in try-catch or has .catch()
    const parent = node.parent;
    if (ts.isTryStatement(parent)) {
      return true;
    }
    
    const text = node.getText();
    return /\.catch\(/.test(text);
  }
} 