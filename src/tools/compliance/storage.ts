/**
 * Compliance Storage System
 * 
 * This module handles saving, loading, and managing compliance results with AST information.
 * It provides audit trails and prevents hallucinations by maintaining detailed records.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ComplianceResult } from './base.js';
import { ASTComplianceResult } from './ast-analyzer.js';

export interface StoredComplianceResult {
  id: string;
  timestamp: Date;
  projectPath: string;
  artifactType: string;
  identifier: string;
  specPath?: string;
  implementationPath?: string;
  complianceResult: ComplianceResult;
  astResult?: ASTComplianceResult;
  metadata: {
    version: string;
    carrotVersion: string;
    environment: string;
    userAgent?: string;
  };
}

export interface ComplianceAuditTrail {
  results: StoredComplianceResult[];
  summary: {
    totalRuns: number;
    averageScore: number;
    trendDirection: 'improving' | 'declining' | 'stable';
    lastRun: Date;
    firstRun: Date;
  };
}

export interface ComplianceStorageOptions {
  storageDir?: string;
  maxHistoryEntries?: number;
  enableAuditTrail?: boolean;
  compressionEnabled?: boolean;
}

export class ComplianceStorage {
  private storageDir: string;
  private maxHistoryEntries: number;
  private enableAuditTrail: boolean;
  private compressionEnabled: boolean;

  constructor(options: ComplianceStorageOptions = {}) {
    this.storageDir = options.storageDir || path.join(process.cwd(), '.carrot', 'compliance');
    this.maxHistoryEntries = options.maxHistoryEntries || 100;
    this.enableAuditTrail = options.enableAuditTrail ?? true;
    this.compressionEnabled = options.compressionEnabled ?? false;
    
    this.ensureStorageDirectory();
  }

  /**
   * Save compliance result with AST information
   */
  async saveComplianceResult(
    complianceResult: ComplianceResult,
    astResult: ASTComplianceResult | undefined,
    context: {
      projectPath: string;
      artifactType: string;
      identifier: string;
      specPath?: string;
      implementationPath?: string;
    }
  ): Promise<string> {
    const id = this.generateResultId(context);
    
    const storedResult: StoredComplianceResult = {
      id,
      timestamp: new Date(),
      projectPath: context.projectPath,
      artifactType: context.artifactType,
      identifier: context.identifier,
      specPath: context.specPath,
      implementationPath: context.implementationPath,
      complianceResult,
      astResult,
      metadata: {
        version: '1.0.0',
        carrotVersion: this.getCarrotVersion(),
        environment: process.env.NODE_ENV || 'development',
        userAgent: process.env.USER_AGENT
      }
    };

    // Save individual result
    const resultPath = this.getResultPath(id);
    await this.writeJsonFile(resultPath, storedResult);

    // Update audit trail
    if (this.enableAuditTrail) {
      await this.updateAuditTrail(storedResult);
    }

    // Clean up old results if needed
    await this.cleanupOldResults(context.artifactType, context.identifier);

    return id;
  }

  /**
   * Load compliance result by ID
   */
  async loadComplianceResult(id: string): Promise<StoredComplianceResult | null> {
    const resultPath = this.getResultPath(id);
    
    if (!fs.existsSync(resultPath)) {
      return null;
    }

    try {
      const content = await this.readJsonFile(resultPath);
      return content as StoredComplianceResult;
    } catch (error) {
      console.warn(`Failed to load compliance result ${id}:`, error);
      return null;
    }
  }

  /**
   * Get compliance history for a specific artifact
   */
  async getComplianceHistory(
    artifactType: string, 
    identifier: string, 
    limit: number = 10
  ): Promise<StoredComplianceResult[]> {
    const historyDir = this.getHistoryDir(artifactType, identifier);
    
    if (!fs.existsSync(historyDir)) {
      return [];
    }

    const files = fs.readdirSync(historyDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        const aTime = fs.statSync(path.join(historyDir, a)).mtime;
        const bTime = fs.statSync(path.join(historyDir, b)).mtime;
        return bTime.getTime() - aTime.getTime(); // Most recent first
      })
      .slice(0, limit);

    const results: StoredComplianceResult[] = [];
    
    for (const file of files) {
      try {
        const content = await this.readJsonFile(path.join(historyDir, file));
        results.push(content as StoredComplianceResult);
      } catch (error) {
        console.warn(`Failed to load history file ${file}:`, error);
      }
    }

    return results;
  }

  /**
   * Get audit trail for project
   */
  async getAuditTrail(projectPath: string): Promise<ComplianceAuditTrail> {
    const auditPath = this.getAuditTrailPath(projectPath);
    
    if (!fs.existsSync(auditPath)) {
      return {
        results: [],
        summary: {
          totalRuns: 0,
          averageScore: 0,
          trendDirection: 'stable',
          lastRun: new Date(),
          firstRun: new Date()
        }
      };
    }

    try {
      const content = await this.readJsonFile(auditPath);
      return content as ComplianceAuditTrail;
    } catch (error) {
      console.warn('Failed to load audit trail:', error);
      return {
        results: [],
        summary: {
          totalRuns: 0,
          averageScore: 0,
          trendDirection: 'stable',
          lastRun: new Date(),
          firstRun: new Date()
        }
      };
    }
  }

  /**
   * Generate compliance report with AST visualization
   */
  async generateComplianceReport(
    artifactType: string,
    identifier: string,
    includeAST: boolean = true
  ): Promise<string> {
    const history = await this.getComplianceHistory(artifactType, identifier, 5);
    
    if (history.length === 0) {
      return 'No compliance history found for this artifact.';
    }

    const latest = history[0];
    const report: string[] = [];

    // Header
    report.push('# 🥕 Carrot AI PM - Compliance Report');
    report.push('');
    report.push(`**Artifact:** ${artifactType} - ${identifier}`);
    report.push(`**Generated:** ${new Date().toISOString()}`);
    report.push(`**Latest Check:** ${latest.timestamp.toISOString()}`);
    report.push('');

    // Current Status
    const status = latest.complianceResult.isCompliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT';
    const score = `${(latest.complianceResult.score * 100).toFixed(1)}%`;
    
    report.push('## 📊 Current Status');
    report.push('');
    report.push(`**Status:** ${status}`);
    report.push(`**Score:** ${score}`);
    report.push(`**Issues:** ${latest.complianceResult.issues.length}`);
    report.push(`**Critical Issues:** ${latest.complianceResult.issues.filter(i => i.severity === 'error').length}`);
    report.push('');

    // AST Visualization
    if (includeAST && latest.astResult) {
      report.push('## 🌳 AST Structure with Compliance Badges');
      report.push('');
      report.push('```');
      report.push(latest.astResult.indentedTree);
      report.push('```');
      report.push('');

      // AST Summary
      report.push('### AST Analysis Summary');
      report.push('');
      report.push(`- **Total Nodes:** ${latest.astResult.summary.totalNodes}`);
      report.push(`- **Compliant Nodes:** ${latest.astResult.summary.compliantNodes} ✅`);
      report.push(`- **Non-Compliant Nodes:** ${latest.astResult.summary.nonCompliantNodes} ❌`);
      report.push(`- **Warning Nodes:** ${latest.astResult.summary.warningNodes} ⚠️`);
      report.push(`- **Hallucinations Detected:** ${latest.astResult.summary.hallucinationCount} 🔍`);
      report.push('');
    }

    // Issues and Suggestions
    if (latest.complianceResult.issues.length > 0) {
      report.push('## 🔍 Issues Found');
      report.push('');
      
      latest.complianceResult.issues.forEach((issue, index) => {
        const severity = issue.severity === 'error' ? '🔴' : 
                        issue.severity === 'warning' ? '🟡' : '🔵';
        report.push(`${index + 1}. ${severity} **${issue.type}**`);
        report.push(`   - ${issue.message}`);
        if (issue.suggestion) {
          report.push(`   - 💡 *${issue.suggestion}*`);
        }
        report.push('');
      });
    }

    // Suggestions
    if (latest.complianceResult.suggestions.length > 0) {
      report.push('## 💡 Suggestions');
      report.push('');
      
      latest.complianceResult.suggestions.forEach((suggestion, index) => {
        const priority = suggestion.priority === 'high' ? '🔴' : 
                        suggestion.priority === 'medium' ? '🟡' : '🟢';
        report.push(`${index + 1}. ${priority} **${suggestion.description}**`);
        if (suggestion.code) {
          report.push('   ```typescript');
          report.push(`   ${suggestion.code}`);
          report.push('   ```');
        }
        report.push('');
      });
    }

    // Compliance Dimensions
    if ('dimensions' in latest.complianceResult && latest.complianceResult.dimensions) {
      report.push('## 📏 Compliance Dimensions');
      report.push('');
      
      Object.entries(latest.complianceResult.dimensions).forEach(([name, dimension]) => {
        const status = dimension.isCompliant ? '✅' : '❌';
        const score = `${(dimension.score * 100).toFixed(1)}%`;
        report.push(`- ${status} **${dimension.name}:** ${score} (weight: ${dimension.weight})`);
        
        if (dimension.issues.length > 0) {
          dimension.issues.forEach(issue => {
            report.push(`  - ${issue.message}`);
          });
        }
      });
      report.push('');
    }

    // History Trend
    if (history.length > 1) {
      report.push('## 📈 Compliance Trend');
      report.push('');
      
      const scores = history.map(h => h.complianceResult.score * 100);
      const trend = this.calculateTrend(scores);
      const trendIcon = trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️';
      
      report.push(`**Trend:** ${trendIcon} ${trend.toUpperCase()}`);
      report.push('');
      
      report.push('| Date | Score | Status | Issues |');
      report.push('|------|-------|--------|--------|');
      
      history.forEach(h => {
        const date = h.timestamp.toISOString().split('T')[0];
        const score = `${(h.complianceResult.score * 100).toFixed(1)}%`;
        const status = h.complianceResult.isCompliant ? '✅' : '❌';
        const issues = h.complianceResult.issues.length;
        report.push(`| ${date} | ${score} | ${status} | ${issues} |`);
      });
      report.push('');
    }

    // Hallucination Detection
    if (latest.astResult && latest.astResult.summary.hallucinationCount > 0) {
      report.push('## 🔍 Hallucination Detection');
      report.push('');
      report.push('The following potential hallucinations were detected in the code:');
      report.push('');

      const collectHallucinations = (node: any): any[] => {
        let hallucinations = [...(node.compliance?.hallucinations || [])];
        if (node.children) {
          node.children.forEach((child: any) => {
            hallucinations = hallucinations.concat(collectHallucinations(child));
          });
        }
        return hallucinations;
      };

      const allHallucinations = collectHallucinations(latest.astResult.tree);
      
      allHallucinations.forEach((hallucination, index) => {
        const severity = hallucination.severity === 'error' ? '🔴' : '🟡';
        report.push(`${index + 1}. ${severity} **${hallucination.type}**`);
        report.push(`   - ${hallucination.description}`);
        report.push(`   - 💡 *${hallucination.suggestion}*`);
        report.push('');
      });
    }

    return report.join('\n');
  }

  /**
   * Export compliance data for external analysis
   */
  async exportComplianceData(
    artifactType: string,
    identifier: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const history = await this.getComplianceHistory(artifactType, identifier, this.maxHistoryEntries);
    
    if (format === 'csv') {
      return this.exportToCSV(history);
    } else {
      return JSON.stringify(history, null, 2);
    }
  }

  /**
   * Private helper methods
   */
  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private generateResultId(context: { artifactType: string; identifier: string }): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hash = this.simpleHash(`${context.artifactType}-${context.identifier}`);
    return `${context.artifactType}-${hash}-${timestamp}`;
  }

  private getResultPath(id: string): string {
    return path.join(this.storageDir, 'results', `${id}.json`);
  }

  private getHistoryDir(artifactType: string, identifier: string): string {
    const hash = this.simpleHash(identifier);
    return path.join(this.storageDir, 'history', artifactType, hash);
  }

  private getAuditTrailPath(projectPath: string): string {
    const hash = this.simpleHash(projectPath);
    return path.join(this.storageDir, 'audit', `${hash}.json`);
  }

  private async writeJsonFile(filePath: string, data: any): Promise<void> {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
  }

  private async readJsonFile(filePath: string): Promise<any> {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  private async updateAuditTrail(result: StoredComplianceResult): Promise<void> {
    const auditPath = this.getAuditTrailPath(result.projectPath);
    let auditTrail: ComplianceAuditTrail;
    
    try {
      auditTrail = await this.readJsonFile(auditPath);
    } catch {
      auditTrail = {
        results: [],
        summary: {
          totalRuns: 0,
          averageScore: 0,
          trendDirection: 'stable',
          lastRun: new Date(),
          firstRun: new Date()
        }
      };
    }

    // Add new result
    auditTrail.results.push(result);
    
    // Update summary
    auditTrail.summary.totalRuns = auditTrail.results.length;
    auditTrail.summary.lastRun = result.timestamp;
    auditTrail.summary.firstRun = auditTrail.results[0]?.timestamp || result.timestamp;
    
    const scores = auditTrail.results.map(r => r.complianceResult.score);
    auditTrail.summary.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    auditTrail.summary.trendDirection = this.calculateTrend(scores);

    // Keep only recent results in audit trail
    if (auditTrail.results.length > this.maxHistoryEntries) {
      auditTrail.results = auditTrail.results.slice(-this.maxHistoryEntries);
    }

    await this.writeJsonFile(auditPath, auditTrail);
  }

  private async cleanupOldResults(artifactType: string, identifier: string): Promise<void> {
    const historyDir = this.getHistoryDir(artifactType, identifier);
    
    if (!fs.existsSync(historyDir)) {
      return;
    }

    const files = fs.readdirSync(historyDir)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(historyDir, file),
        mtime: fs.statSync(path.join(historyDir, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Keep only the most recent entries
    if (files.length > this.maxHistoryEntries) {
      const filesToDelete = files.slice(this.maxHistoryEntries);
      filesToDelete.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.warn(`Failed to delete old result file ${file.name}:`, error);
        }
      });
    }
  }

  private calculateTrend(scores: number[]): 'improving' | 'declining' | 'stable' {
    if (scores.length < 2) return 'stable';
    
    const recent = scores.slice(-3); // Last 3 scores
    const older = scores.slice(-6, -3); // Previous 3 scores
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const threshold = 5; // 5% threshold
    
    if (recentAvg > olderAvg + threshold) return 'improving';
    if (recentAvg < olderAvg - threshold) return 'declining';
    return 'stable';
  }

  private exportToCSV(history: StoredComplianceResult[]): string {
    const headers = [
      'timestamp',
      'artifactType',
      'identifier',
      'isCompliant',
      'score',
      'issueCount',
      'criticalIssues',
      'hallucinationCount'
    ];

    const rows = history.map(h => [
      h.timestamp.toISOString(),
      h.artifactType,
      h.identifier,
      h.complianceResult.isCompliant,
      h.complianceResult.score,
      h.complianceResult.issues.length,
      h.complianceResult.issues.filter(i => i.severity === 'error').length,
      h.astResult?.summary.hallucinationCount || 0
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private getCarrotVersion(): string {
    try {
      const packageJsonPath = path.join(__dirname, '../../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }
} 