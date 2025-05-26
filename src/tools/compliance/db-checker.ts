/**
 * Database Compliance Checker
 * 
 * Validates database implementations against their specifications, checking:
 * - Schema compliance (tables, columns, constraints)
 * - Index optimization and performance
 * - Data integrity and validation rules
 * - Security and access control
 * - Migration safety and reversibility
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
import { DatabaseSpec } from '../grow_db_spec.js';

export interface DatabaseImplementation {
  filePath: string;
  content: string;
  dbType: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';
  language: 'sql' | 'javascript' | 'python';
  hasSchema: boolean;
  hasMigrations: boolean;
}

export class DatabaseComplianceChecker extends BaseComplianceChecker<DatabaseSpec, DatabaseImplementation> {
  readonly artifactType: ArtifactType = 'db';
  readonly supportedFrameworks = ['postgresql', 'mysql', 'sqlite', 'mongodb'];
  readonly supportedDatabases = ['postgresql', 'mysql', 'sqlite', 'mongodb'];

  getComplianceDimensions(): string[] {
    return [
      'schema_compliance',
      'performance_compliance',
      'security_compliance',
      'data_integrity_compliance',
      'migration_compliance'
    ];
  }

  protected async evaluateComplianceDimensions(
    spec: DatabaseSpec, 
    implementation: DatabaseImplementation, 
    context: ComplianceContext
  ): Promise<Record<string, ComplianceDimension>> {
    
    const dimensions: Record<string, ComplianceDimension> = {};

    // Schema compliance (high weight - critical for data structure)
    const schemaIssues = await this.checkSchemaCompliance(spec, implementation);
    dimensions.schema_compliance = this.createDimension('Schema Compliance', schemaIssues, 2.5);

    // Performance compliance (high weight - critical for scalability)
    const performanceIssues = await this.checkPerformanceCompliance(spec, implementation);
    dimensions.performance_compliance = this.createDimension('Performance Compliance', performanceIssues, 2.0);

    // Security compliance (high weight - critical for data protection)
    const securityIssues = await this.checkSecurityCompliance(spec, implementation);
    dimensions.security_compliance = this.createDimension('Security Compliance', securityIssues, 2.0);

    // Data integrity compliance (medium weight - important for consistency)
    const integrityIssues = await this.checkDataIntegrityCompliance(spec, implementation);
    dimensions.data_integrity_compliance = this.createDimension('Data Integrity Compliance', integrityIssues, 1.5);

    // Migration compliance (medium weight - important for deployment)
    const migrationIssues = await this.checkMigrationCompliance(spec, implementation);
    dimensions.migration_compliance = this.createDimension('Migration Compliance', migrationIssues, 1.0);

    return dimensions;
  }

  protected extractIdentifier(spec: DatabaseSpec): string {
    return spec.identifier;
  }

  canHandle(spec: any, implementation: any, context: ComplianceContext): boolean {
    return context.artifactType === 'db' && 
           this.supportedDatabases.includes(implementation?.dbType);
  }

  private async checkSchemaCompliance(
    spec: DatabaseSpec, 
    implementation: DatabaseImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];
    
    // Check if implementation has schema definition
    if (!implementation.hasSchema) {
      issues.push({
        type: 'MISSING_SCHEMA_DEFINITION',
        severity: 'error',
        message: 'Database implementation missing schema definition',
        suggestion: 'Create schema definition file with table structures',
        location: { file: implementation.filePath }
      });
      return issues; // Can't check further without schema
    }

    // Check each table in the specification
    for (const [tableName, tableSpec] of Object.entries(spec.specification.schema.tables)) {
      if (!this.hasTable(implementation, tableName)) {
        issues.push({
          type: 'MISSING_TABLE',
          severity: 'error',
          message: `Missing table: ${tableName}`,
          suggestion: `Create table ${tableName} with specified columns`,
          location: { file: implementation.filePath }
        });
        continue;
      }

      // Check primary key
      if (!this.hasPrimaryKey(implementation, tableName, tableSpec.primary_key)) {
        issues.push({
          type: 'MISSING_PRIMARY_KEY',
          severity: 'error',
          message: `Table ${tableName} missing primary key`,
          suggestion: `Add primary key constraint on columns: ${tableSpec.primary_key.join(', ')}`,
          location: { file: implementation.filePath }
        });
      }

      // Check columns
      for (const [columnName, columnSpec] of Object.entries(tableSpec.columns)) {
        if (!this.hasColumn(implementation, tableName, columnName)) {
          issues.push({
            type: 'MISSING_COLUMN',
            severity: 'error',
            message: `Table ${tableName} missing column: ${columnName}`,
            suggestion: `Add column ${columnName} with type ${this.getDbSpecificType(columnSpec, implementation.dbType)}`,
            location: { file: implementation.filePath }
          });
        } else if (!this.hasCorrectColumnType(implementation, tableName, columnName, columnSpec, implementation.dbType)) {
          issues.push({
            type: 'INCORRECT_COLUMN_TYPE',
            severity: 'error',
            message: `Column ${tableName}.${columnName} has incorrect type`,
            suggestion: `Change column type to ${this.getDbSpecificType(columnSpec, implementation.dbType)}`,
            location: { file: implementation.filePath }
          });
        }

        // Check nullable constraints
        if (!columnSpec.nullable && this.isColumnNullable(implementation, tableName, columnName)) {
          issues.push({
            type: 'MISSING_NOT_NULL_CONSTRAINT',
            severity: 'error',
            message: `Column ${tableName}.${columnName} should be NOT NULL`,
            suggestion: `Add NOT NULL constraint to ${columnName}`,
            location: { file: implementation.filePath }
          });
        }

        // Check unique constraints
        if (columnSpec.unique && !this.hasUniqueConstraint(implementation, tableName, columnName)) {
          issues.push({
            type: 'MISSING_UNIQUE_CONSTRAINT',
            severity: 'warning',
            message: `Column ${tableName}.${columnName} should be unique`,
            suggestion: `Add unique constraint to ${columnName}`,
            location: { file: implementation.filePath }
          });
        }
      }

      // Check foreign keys
      if (tableSpec.foreign_keys) {
        for (const fk of tableSpec.foreign_keys) {
          if (!this.hasForeignKey(implementation, tableName, fk)) {
            issues.push({
              type: 'MISSING_FOREIGN_KEY',
              severity: 'error',
              message: `Table ${tableName} missing foreign key constraint`,
              suggestion: `Add foreign key constraint: ${fk.columns.join(', ')} -> ${fk.references.table}(${fk.references.columns.join(', ')})`,
              location: { file: implementation.filePath }
            });
          }
        }
      }

      // Check check constraints
      if (tableSpec.check_constraints) {
        for (const check of tableSpec.check_constraints) {
          if (!this.hasCheckConstraint(implementation, tableName, check)) {
            issues.push({
              type: 'MISSING_CHECK_CONSTRAINT',
              severity: 'warning',
              message: `Table ${tableName} missing check constraint: ${check.name}`,
              suggestion: `Add check constraint: ${check.condition}`,
              location: { file: implementation.filePath }
            });
          }
        }
      }
    }

    return issues;
  }

  private async checkPerformanceCompliance(
    spec: DatabaseSpec, 
    implementation: DatabaseImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Check indexes
    for (const indexSpec of spec.specification.schema.indexes) {
      if (!this.hasIndex(implementation, indexSpec)) {
        issues.push({
          type: 'MISSING_INDEX',
          severity: 'warning',
          message: `Missing index: ${indexSpec.name}`,
          suggestion: `Create ${indexSpec.type} index on ${indexSpec.table}(${indexSpec.columns.join(', ')})`,
          location: { file: implementation.filePath }
        });
      }
    }

    // Check for missing indexes on foreign keys
    for (const [tableName, tableSpec] of Object.entries(spec.specification.schema.tables)) {
      if (tableSpec.foreign_keys) {
        for (const fk of tableSpec.foreign_keys) {
          if (!this.hasIndexOnColumns(implementation, tableName, fk.columns)) {
            issues.push({
              type: 'MISSING_FOREIGN_KEY_INDEX',
              severity: 'warning',
              message: `Missing index on foreign key columns in ${tableName}`,
              suggestion: `Create index on ${fk.columns.join(', ')} for better join performance`,
              location: { file: implementation.filePath }
            });
          }
        }
      }
    }

    // Check for SELECT * usage in queries
    if (this.hasSelectStar(implementation)) {
      issues.push({
        type: 'SELECT_STAR_USAGE',
        severity: 'info',
        message: 'Found SELECT * usage in queries',
        suggestion: 'Replace SELECT * with specific column names for better performance',
        location: { file: implementation.filePath }
      });
    }

    // Check connection pooling configuration
    if (!this.hasConnectionPooling(implementation)) {
      issues.push({
        type: 'MISSING_CONNECTION_POOLING',
        severity: 'warning',
        message: 'No connection pooling configuration found',
        suggestion: 'Configure connection pooling for better resource management',
        location: { file: implementation.filePath }
      });
    }

    return issues;
  }

  private async checkSecurityCompliance(
    spec: DatabaseSpec, 
    implementation: DatabaseImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Check access control
    for (const accessControl of spec.specification.security.access_control) {
      if (!this.hasRole(implementation, accessControl.role)) {
        issues.push({
          type: 'MISSING_ROLE',
          severity: 'error',
          message: `Missing database role: ${accessControl.role}`,
          suggestion: `Create role ${accessControl.role} with permissions: ${accessControl.permissions.join(', ')}`,
          location: { file: implementation.filePath }
        });
      }
    }

    // Check for SQL injection vulnerabilities
    if (this.hasSqlInjectionRisk(implementation)) {
      issues.push({
        type: 'SQL_INJECTION_RISK',
        severity: 'error',
        message: 'Potential SQL injection vulnerability detected',
        suggestion: 'Use parameterized queries instead of string concatenation',
        location: { file: implementation.filePath }
      });
    }

    // Check for hardcoded credentials
    if (this.hasHardcodedCredentials(implementation)) {
      issues.push({
        type: 'HARDCODED_CREDENTIALS',
        severity: 'error',
        message: 'Hardcoded database credentials found',
        suggestion: 'Use environment variables or secure credential management',
        location: { file: implementation.filePath }
      });
    }

    // Check encryption requirements
    if (spec.specification.security.data_encryption) {
      for (const encryption of spec.specification.security.data_encryption) {
        if (!this.hasColumnEncryption(implementation, encryption.table, encryption.columns)) {
          issues.push({
            type: 'MISSING_ENCRYPTION',
            severity: 'error',
            message: `Missing encryption on sensitive columns in ${encryption.table}`,
            suggestion: `Implement ${encryption.method} for columns: ${encryption.columns.join(', ')}`,
            location: { file: implementation.filePath }
          });
        }
      }
    }

    return issues;
  }

  private async checkDataIntegrityCompliance(
    spec: DatabaseSpec, 
    implementation: DatabaseImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Check validation rules
    for (const rule of spec.specification.data_integrity.validation_rules) {
      if (!this.hasValidationRule(implementation, rule)) {
        issues.push({
          type: 'MISSING_VALIDATION_RULE',
          severity: 'warning',
          message: `Missing validation rule for ${rule.table}.${rule.column}`,
          suggestion: `Implement ${rule.rule} validation: ${rule.description}`,
          location: { file: implementation.filePath }
        });
      }
    }

    // Check referential integrity
    for (const integrity of spec.specification.data_integrity.referential_integrity) {
      if (!this.hasReferentialIntegrity(implementation, integrity)) {
        issues.push({
          type: 'MISSING_REFERENTIAL_INTEGRITY',
          severity: 'error',
          message: `Referential integrity not enforced: ${integrity.name}`,
          suggestion: `Enable ${integrity.enforcement} referential integrity enforcement`,
          location: { file: implementation.filePath }
        });
      }
    }

    // Check for orphaned records potential
    if (this.hasOrphanedRecordsRisk(implementation)) {
      issues.push({
        type: 'ORPHANED_RECORDS_RISK',
        severity: 'warning',
        message: 'Potential for orphaned records due to missing cascade rules',
        suggestion: 'Review foreign key cascade options (CASCADE, RESTRICT, SET NULL)',
        location: { file: implementation.filePath }
      });
    }

    return issues;
  }

  private async checkMigrationCompliance(
    spec: DatabaseSpec, 
    implementation: DatabaseImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    if (!implementation.hasMigrations) {
      issues.push({
        type: 'MISSING_MIGRATIONS',
        severity: 'warning',
        message: 'No migration files found',
        suggestion: 'Create migration files for database schema changes',
        location: { file: implementation.filePath }
      });
      return issues;
    }

    // Check migration reversibility
    for (const migration of spec.specification.behavior.migrations) {
      if (!this.hasMigrationDownScript(implementation, migration.version)) {
        issues.push({
          type: 'MISSING_MIGRATION_DOWN',
          severity: 'error',
          message: `Migration ${migration.version} missing down script`,
          suggestion: 'Add rollback script for safe migration reversal',
          location: { file: implementation.filePath }
        });
      }

      if (!migration.rollback_safe) {
        issues.push({
          type: 'UNSAFE_MIGRATION',
          severity: 'warning',
          message: `Migration ${migration.version} marked as not rollback safe`,
          suggestion: 'Review migration for data loss risks and add safety checks',
          location: { file: implementation.filePath }
        });
      }
    }

    // Check for destructive operations without backups
    if (this.hasDestructiveOperations(implementation)) {
      issues.push({
        type: 'DESTRUCTIVE_OPERATIONS',
        severity: 'error',
        message: 'Destructive operations found without backup procedures',
        suggestion: 'Add backup procedures before destructive operations (DROP, ALTER)',
        location: { file: implementation.filePath }
      });
    }

    return issues;
  }

  // Helper methods for implementation analysis
  private hasTable(implementation: DatabaseImplementation, tableName: string): boolean {
    const tablePattern = new RegExp(`CREATE\\s+TABLE\\s+${tableName}`, 'i');
    return tablePattern.test(implementation.content);
  }

  private hasPrimaryKey(implementation: DatabaseImplementation, tableName: string, primaryKey: string[]): boolean {
    const pkPattern = new RegExp(`PRIMARY\\s+KEY\\s*\\([^)]*${primaryKey.join('|')}[^)]*\\)`, 'i');
    return pkPattern.test(implementation.content);
  }

  private hasColumn(implementation: DatabaseImplementation, tableName: string, columnName: string): boolean {
    // Look for column definition in CREATE TABLE or ALTER TABLE statements
    const columnPattern = new RegExp(`${columnName}\\s+\\w+`, 'i');
    return columnPattern.test(implementation.content);
  }

  private hasCorrectColumnType(
    implementation: DatabaseImplementation, 
    tableName: string, 
    columnName: string, 
    columnSpec: any, 
    dbType: string
  ): boolean {
    const expectedType = this.getDbSpecificType(columnSpec, dbType);
    const typePattern = new RegExp(`${columnName}\\s+${expectedType}`, 'i');
    return typePattern.test(implementation.content);
  }

  private getDbSpecificType(columnSpec: any, dbType: string): string {
    if (columnSpec.dbTypes && columnSpec.dbTypes[dbType]) {
      return columnSpec.dbTypes[dbType];
    }
    return columnSpec.type;
  }

  private isColumnNullable(implementation: DatabaseImplementation, tableName: string, columnName: string): boolean {
    const notNullPattern = new RegExp(`${columnName}\\s+\\w+[^,]*NOT\\s+NULL`, 'i');
    return !notNullPattern.test(implementation.content);
  }

  private hasUniqueConstraint(implementation: DatabaseImplementation, tableName: string, columnName: string): boolean {
    const uniquePattern = new RegExp(`${columnName}\\s+\\w+[^,]*UNIQUE|UNIQUE\\s*\\([^)]*${columnName}[^)]*\\)`, 'i');
    return uniquePattern.test(implementation.content);
  }

  private hasForeignKey(implementation: DatabaseImplementation, tableName: string, fk: any): boolean {
    const fkPattern = new RegExp(`FOREIGN\\s+KEY\\s*\\([^)]*${fk.columns.join('|')}[^)]*\\)`, 'i');
    return fkPattern.test(implementation.content);
  }

  private hasCheckConstraint(implementation: DatabaseImplementation, tableName: string, check: any): boolean {
    const checkPattern = new RegExp(`CHECK\\s*\\([^)]*${check.condition}[^)]*\\)`, 'i');
    return checkPattern.test(implementation.content);
  }

  private hasIndex(implementation: DatabaseImplementation, indexSpec: any): boolean {
    const indexPattern = new RegExp(`CREATE\\s+.*INDEX\\s+${indexSpec.name}`, 'i');
    return indexPattern.test(implementation.content);
  }

  private hasIndexOnColumns(implementation: DatabaseImplementation, tableName: string, columns: string[]): boolean {
    const indexPattern = new RegExp(`CREATE\\s+.*INDEX.*ON\\s+${tableName}\\s*\\([^)]*${columns.join('|')}[^)]*\\)`, 'i');
    return indexPattern.test(implementation.content);
  }

  private hasSelectStar(implementation: DatabaseImplementation): boolean {
    return /SELECT\s+\*\s+FROM/i.test(implementation.content);
  }

  private hasConnectionPooling(implementation: DatabaseImplementation): boolean {
    const poolPatterns = [
      /pool/i,
      /connection.*pool/i,
      /max.*connection/i,
      /min.*connection/i
    ];
    return poolPatterns.some(pattern => pattern.test(implementation.content));
  }

  private hasRole(implementation: DatabaseImplementation, role: string): boolean {
    const rolePattern = new RegExp(`CREATE\\s+ROLE\\s+${role}|GRANT.*TO\\s+${role}`, 'i');
    return rolePattern.test(implementation.content);
  }

  private hasSqlInjectionRisk(implementation: DatabaseImplementation): boolean {
    // Look for string concatenation in SQL queries
    const injectionPatterns = [
      /\+.*["'].*SELECT|UPDATE|DELETE|INSERT/i,
      /\$\{.*\}.*SELECT|UPDATE|DELETE|INSERT/i,
      /format.*SELECT|UPDATE|DELETE|INSERT/i
    ];
    return injectionPatterns.some(pattern => pattern.test(implementation.content));
  }

  private hasHardcodedCredentials(implementation: DatabaseImplementation): boolean {
    const credentialPatterns = [
      /password\s*=\s*["'][^"']+["']/i,
      /user\s*=\s*["'][^"']+["']/i,
      /host\s*=\s*["'][^"']+["']/i
    ];
    return credentialPatterns.some(pattern => pattern.test(implementation.content));
  }

  private hasColumnEncryption(implementation: DatabaseImplementation, table: string, columns: string[]): boolean {
    const encryptionPatterns = [
      /ENCRYPT/i,
      /AES_ENCRYPT/i,
      /pgp_sym_encrypt/i
    ];
    return encryptionPatterns.some(pattern => pattern.test(implementation.content));
  }

  private hasValidationRule(implementation: DatabaseImplementation, rule: any): boolean {
    // Check for validation in triggers, constraints, or application code
    const validationPatterns = [
      new RegExp(rule.rule, 'i'),
      new RegExp(`CHECK.*${rule.column}`, 'i'),
      new RegExp(`TRIGGER.*${rule.table}`, 'i')
    ];
    return validationPatterns.some(pattern => pattern.test(implementation.content));
  }

  private hasReferentialIntegrity(implementation: DatabaseImplementation, integrity: any): boolean {
    if (integrity.enforcement === 'strict') {
      return /FOREIGN\s+KEY.*REFERENCES/i.test(implementation.content);
    }
    return true; // Assume compliance for non-strict enforcement
  }

  private hasOrphanedRecordsRisk(implementation: DatabaseImplementation): boolean {
    // Check if foreign keys have appropriate cascade rules
    const cascadePattern = /ON\s+(DELETE|UPDATE)\s+(CASCADE|RESTRICT|SET\s+NULL)/i;
    const fkPattern = /FOREIGN\s+KEY/i;
    
    return fkPattern.test(implementation.content) && !cascadePattern.test(implementation.content);
  }

  private hasMigrationDownScript(implementation: DatabaseImplementation, version: string): boolean {
    const downPattern = new RegExp(`down.*${version}|rollback.*${version}`, 'i');
    return downPattern.test(implementation.content);
  }

  private hasDestructiveOperations(implementation: DatabaseImplementation): boolean {
    const destructivePatterns = [
      /DROP\s+TABLE/i,
      /DROP\s+COLUMN/i,
      /ALTER\s+TABLE.*DROP/i,
      /DELETE\s+FROM.*WHERE/i
    ];
    return destructivePatterns.some(pattern => pattern.test(implementation.content));
  }

  protected isAutoFixable(issueType: string): boolean {
    const autoFixableTypes = [
      'MISSING_INDEX',
      'MISSING_NOT_NULL_CONSTRAINT',
      'MISSING_UNIQUE_CONSTRAINT',
      'SELECT_STAR_USAGE'
    ];
    return autoFixableTypes.includes(issueType);
  }

  generateSuggestions(issues: ComplianceIssue[], context: ComplianceContext): ComplianceSuggestion[] {
    const suggestions = super.generateSuggestions(issues, context);
    
    // Add database-specific code suggestions
    return suggestions.map(suggestion => {
      if (suggestion.type === 'MISSING_INDEX') {
        suggestion.code = this.generateIndexCode(suggestion.description);
      } else if (suggestion.type === 'MISSING_NOT_NULL_CONSTRAINT') {
        suggestion.code = this.generateNotNullCode(suggestion.description);
      } else if (suggestion.type === 'MISSING_FOREIGN_KEY') {
        suggestion.code = this.generateForeignKeyCode(suggestion.description);
      }
      
      return suggestion;
    });
  }

  private generateIndexCode(description: string): string {
    // Extract index details from description
    const match = description.match(/CREATE (\w+) index on (\w+)\(([^)]+)\)/i);
    if (match) {
      const [, indexType, table, columns] = match;
      return `CREATE ${indexType.toUpperCase()} INDEX idx_${table}_${columns.replace(/,\s*/g, '_')} ON ${table}(${columns});`;
    }
    return '-- Add appropriate index';
  }

  private generateNotNullCode(description: string): string {
    const match = description.match(/Add NOT NULL constraint to (\w+)/);
    if (match) {
      return `ALTER TABLE table_name ALTER COLUMN ${match[1]} SET NOT NULL;`;
    }
    return '-- Add NOT NULL constraint';
  }

  private generateForeignKeyCode(description: string): string {
    const match = description.match(/Add foreign key constraint: ([^-]+) -> (\w+)\(([^)]+)\)/);
    if (match) {
      const [, columns, refTable, refColumns] = match;
      return `ALTER TABLE table_name ADD CONSTRAINT fk_constraint_name FOREIGN KEY (${columns}) REFERENCES ${refTable}(${refColumns});`;
    }
    return '-- Add foreign key constraint';
  }
} 