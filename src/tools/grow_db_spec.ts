/**
 * Database Spec Generation Tool
 * 
 * Generates framework-neutral database specifications for:
 * - Tables and schemas
 * - Relationships and constraints
 * - Indexes and performance optimization
 * - Migration patterns
 * - Data validation rules
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface DatabaseSpec {
  type: 'db';
  identifier: string;
  summary: string;
  specification: {
    schema: {
      tables: Record<string, TableDefinition>;
      views?: Record<string, ViewDefinition>;
      indexes: IndexDefinition[];
      constraints: ConstraintDefinition[];
    };
    behavior: {
      migrations: MigrationDefinition[];
      triggers?: TriggerDefinition[];
      procedures?: ProcedureDefinition[];
    };
    performance: {
      indexing_strategy: string[];
      query_optimization: string[];
      connection_pooling?: ConnectionPoolConfig;
    };
    security: {
      access_control: AccessControlDefinition[];
      data_encryption?: EncryptionDefinition[];
      audit_logging?: AuditConfig;
    };
    data_integrity: {
      validation_rules: ValidationRule[];
      referential_integrity: ReferentialIntegrityRule[];
    };
  };
  complianceRules: string[];
}

export interface TableDefinition {
  description: string;
  columns: Record<string, ColumnDefinition>;
  primary_key: string[];
  foreign_keys?: ForeignKeyDefinition[];
  unique_constraints?: string[][];
  check_constraints?: CheckConstraintDefinition[];
}

export interface ColumnDefinition {
  type: string;
  description: string;
  nullable?: boolean;
  default?: any;
  auto_increment?: boolean;
  unique?: boolean;
  dbTypes?: Record<string, string>; // Database-specific type mappings
}

export interface ViewDefinition {
  description: string;
  query: string;
  materialized?: boolean;
  refresh_strategy?: 'manual' | 'automatic' | 'scheduled';
}

export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist' | 'unique' | 'partial';
  description: string;
  condition?: string; // For partial indexes
}

export interface ConstraintDefinition {
  name: string;
  type: 'check' | 'unique' | 'foreign_key' | 'primary_key';
  table: string;
  columns: string[];
  description: string;
  condition?: string;
  references?: {
    table: string;
    columns: string[];
    on_delete?: 'cascade' | 'restrict' | 'set_null' | 'set_default';
    on_update?: 'cascade' | 'restrict' | 'set_null' | 'set_default';
  };
}

export interface ForeignKeyDefinition {
  columns: string[];
  references: {
    table: string;
    columns: string[];
  };
  on_delete?: 'cascade' | 'restrict' | 'set_null' | 'set_default';
  on_update?: 'cascade' | 'restrict' | 'set_null' | 'set_default';
}

export interface CheckConstraintDefinition {
  name: string;
  condition: string;
  description: string;
}

export interface MigrationDefinition {
  version: string;
  description: string;
  up: string[];
  down: string[];
  dependencies?: string[];
  rollback_safe: boolean;
}

export interface TriggerDefinition {
  name: string;
  table: string;
  event: 'insert' | 'update' | 'delete';
  timing: 'before' | 'after' | 'instead_of';
  function: string;
  description: string;
}

export interface ProcedureDefinition {
  name: string;
  parameters: Record<string, string>;
  returns: string;
  body: string;
  description: string;
}

export interface ConnectionPoolConfig {
  min_connections: number;
  max_connections: number;
  idle_timeout: number;
  connection_timeout: number;
}

export interface AccessControlDefinition {
  role: string;
  permissions: string[];
  tables: string[];
  description: string;
}

export interface EncryptionDefinition {
  table: string;
  columns: string[];
  method: 'column_level' | 'transparent_data_encryption';
  key_management: string;
}

export interface AuditConfig {
  tables: string[];
  operations: ('insert' | 'update' | 'delete')[];
  retention_period: string;
}

export interface ValidationRule {
  table: string;
  column: string;
  rule: string;
  description: string;
  error_message: string;
}

export interface ReferentialIntegrityRule {
  name: string;
  description: string;
  enforcement: 'strict' | 'deferred' | 'disabled';
}

export function growDBSpecTool(server: McpServer, repoRoot: string): void {
  console.log('Initializing grow_db_spec tool with repo root:', repoRoot);
  
  server.tool(
    'grow_db_spec',
    {
      tableName: z.string().describe('Name of the database table or schema'),
      summary: z.string().describe('Brief description of the table/schema purpose'),
      generateMigrations: z.boolean().optional().default(true).describe('Generate migration examples'),
      databaseTypes: z.array(z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb'])).optional().default(['postgresql']).describe('Target database types for examples')
    },
    async ({ tableName, summary, generateMigrations = true, databaseTypes = ['postgresql'] }) => {
      try {
        console.log('Generating database spec for:', tableName);
        
        // Generate the database specification
        const spec = await generateDatabaseSpec(tableName, summary, { generateMigrations, databaseTypes });
        
        // Create specs directory structure
        const specsDir = path.join(repoRoot, 'specs', 'db');
        const examplesDir = path.join(specsDir, 'examples');
        
        if (!fs.existsSync(specsDir)) {
          fs.mkdirSync(specsDir, { recursive: true });
        }
        
        if (!fs.existsSync(examplesDir)) {
          fs.mkdirSync(examplesDir, { recursive: true });
        }
        
        // Write the spec file
        const specFileName = `${tableName.toLowerCase()}.yaml`;
        const specPath = path.join(specsDir, specFileName);
        const specYaml = yaml.dump(spec, { 
          indent: 2, 
          lineWidth: 120,
          noRefs: true 
        });
        
        fs.writeFileSync(specPath, specYaml);
        
        // Generate database-specific examples if requested
        const examples: string[] = [];
        if (generateMigrations) {
          for (const dbType of databaseTypes) {
            const migrationExample = generateMigrationExample(spec, dbType);
            const exampleFileName = `${tableName.toLowerCase()}.${dbType}.sql`;
            const examplePath = path.join(examplesDir, exampleFileName);
            
            fs.writeFileSync(examplePath, migrationExample);
            examples.push(exampleFileName);
          }
        }
        
        const result = {
          spec_file: specFileName,
          spec_path: specPath,
          examples: examples,
          summary: `Generated database specification for ${tableName}`,
          compliance_check: `Run: check_spec_compliance --type=db --identifier=${tableName}`
        };
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }],
          isError: false
        };
        
      } catch (error: any) {
        console.error('Error generating database spec:', error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Failed to generate database spec: ${error.message}`,
              troubleshooting: [
                'Ensure table name is valid',
                'Check file permissions in specs directory',
                'Verify database type is supported'
              ]
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );
}

export async function generateDatabaseSpec(
  tableName: string, 
  summary: string, 
  options: { generateMigrations: boolean; databaseTypes: string[] }
): Promise<DatabaseSpec> {
  
  // Analyze table name to infer structure
  const tableType = inferTableType(tableName);
  const columns = generateColumns(tableName, tableType);
  const relationships = generateRelationships(tableName, tableType);
  
  const spec: DatabaseSpec = {
    type: 'db',
    identifier: tableName,
    summary,
    specification: {
      schema: {
        tables: {
          [tableName]: {
            description: summary,
            columns,
            primary_key: ['id'],
            foreign_keys: relationships.foreign_keys,
            unique_constraints: relationships.unique_constraints,
            check_constraints: relationships.check_constraints
          }
        },
        indexes: generateIndexes(tableName, columns),
        constraints: generateConstraints(tableName, columns)
      },
      behavior: {
        migrations: options.generateMigrations ? generateMigrations(tableName) : []
      },
      performance: {
        indexing_strategy: [
          'Primary key on id column for fast lookups',
          'Index on frequently queried columns',
          'Composite indexes for multi-column queries'
        ],
        query_optimization: [
          'Use EXPLAIN ANALYZE to identify slow queries',
          'Avoid SELECT * in production queries',
          'Use appropriate JOIN types for relationships'
        ],
        connection_pooling: {
          min_connections: 5,
          max_connections: 20,
          idle_timeout: 300,
          connection_timeout: 30
        }
      },
      security: {
        access_control: [
          {
            role: 'read_only',
            permissions: ['SELECT'],
            tables: [tableName],
            description: 'Read-only access for reporting'
          },
          {
            role: 'app_user',
            permissions: ['SELECT', 'INSERT', 'UPDATE'],
            tables: [tableName],
            description: 'Application user with CRUD access'
          }
        ]
      },
      data_integrity: {
        validation_rules: generateValidationRules(tableName, columns),
        referential_integrity: [
          {
            name: 'enforce_foreign_keys',
            description: 'All foreign key constraints must be enforced',
            enforcement: 'strict'
          }
        ]
      }
    },
    complianceRules: [
      'All tables must have a primary key',
      'Foreign key constraints must be properly defined',
      'Indexes must be created for frequently queried columns',
      'Column types must be appropriate for data being stored',
      'Migrations must be reversible and safe',
      'Access control must follow principle of least privilege',
      'Data validation rules must be enforced at database level'
    ]
  };
  
  return spec;
}

function inferTableType(tableName: string): 'entity' | 'junction' | 'lookup' | 'audit' {
  const name = tableName.toLowerCase();
  
  if (name.includes('_') && name.split('_').length === 2) {
    return 'junction'; // user_roles, post_tags
  }
  
  if (name.endsWith('_log') || name.endsWith('_audit') || name.endsWith('_history')) {
    return 'audit';
  }
  
  if (name.endsWith('_type') || name.endsWith('_status') || name.endsWith('_category')) {
    return 'lookup';
  }
  
  return 'entity';
}

function generateColumns(tableName: string, tableType: string): Record<string, ColumnDefinition> {
  const baseColumns: Record<string, ColumnDefinition> = {
    id: {
      type: 'integer',
      description: 'Primary key identifier',
      nullable: false,
      auto_increment: true,
      unique: true,
      dbTypes: {
        postgresql: 'SERIAL PRIMARY KEY',
        mysql: 'INT AUTO_INCREMENT PRIMARY KEY',
        sqlite: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        mongodb: 'ObjectId'
      }
    }
  };
  
  // Add common columns based on table type
  if (tableType === 'entity') {
    baseColumns.created_at = {
      type: 'timestamp',
      description: 'Record creation timestamp',
      nullable: false,
      default: 'CURRENT_TIMESTAMP',
      dbTypes: {
        postgresql: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
        mysql: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        sqlite: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
        mongodb: 'Date'
      }
    };
    
    baseColumns.updated_at = {
      type: 'timestamp',
      description: 'Record last update timestamp',
      nullable: false,
      default: 'CURRENT_TIMESTAMP',
      dbTypes: {
        postgresql: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
        mysql: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        sqlite: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
        mongodb: 'Date'
      }
    };
  }
  
  // Add table-specific columns based on name patterns
  const name = tableName.toLowerCase();
  
  if (name.includes('user')) {
    baseColumns.email = {
      type: 'string',
      description: 'User email address',
      nullable: false,
      unique: true,
      dbTypes: {
        postgresql: 'VARCHAR(255) UNIQUE NOT NULL',
        mysql: 'VARCHAR(255) UNIQUE NOT NULL',
        sqlite: 'TEXT UNIQUE NOT NULL',
        mongodb: 'String'
      }
    };
    
    baseColumns.name = {
      type: 'string',
      description: 'User full name',
      nullable: false,
      dbTypes: {
        postgresql: 'VARCHAR(255) NOT NULL',
        mysql: 'VARCHAR(255) NOT NULL',
        sqlite: 'TEXT NOT NULL',
        mongodb: 'String'
      }
    };
  }
  
  if (name.includes('product')) {
    baseColumns.name = {
      type: 'string',
      description: 'Product name',
      nullable: false,
      dbTypes: {
        postgresql: 'VARCHAR(255) NOT NULL',
        mysql: 'VARCHAR(255) NOT NULL',
        sqlite: 'TEXT NOT NULL',
        mongodb: 'String'
      }
    };
    
    baseColumns.price = {
      type: 'decimal',
      description: 'Product price',
      nullable: false,
      dbTypes: {
        postgresql: 'DECIMAL(10,2) NOT NULL',
        mysql: 'DECIMAL(10,2) NOT NULL',
        sqlite: 'REAL NOT NULL',
        mongodb: 'Decimal128'
      }
    };
  }
  
  return baseColumns;
}

function generateRelationships(tableName: string, tableType: string): {
  foreign_keys?: ForeignKeyDefinition[];
  unique_constraints?: string[][];
  check_constraints?: CheckConstraintDefinition[];
} {
  const relationships: any = {};
  
  if (tableType === 'junction') {
    // Junction tables typically have foreign keys to two other tables
    const parts = tableName.toLowerCase().split('_');
    relationships.foreign_keys = [
      {
        columns: [`${parts[0]}_id`],
        references: {
          table: parts[0],
          columns: ['id']
        },
        on_delete: 'cascade'
      },
      {
        columns: [`${parts[1]}_id`],
        references: {
          table: parts[1],
          columns: ['id']
        },
        on_delete: 'cascade'
      }
    ];
    
    relationships.unique_constraints = [
      [`${parts[0]}_id`, `${parts[1]}_id`]
    ];
  }
  
  // Add check constraints for common patterns
  if (tableName.toLowerCase().includes('user')) {
    relationships.check_constraints = [
      {
        name: 'valid_email',
        condition: "email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'",
        description: 'Ensure email format is valid'
      }
    ];
  }
  
  if (tableName.toLowerCase().includes('product')) {
    relationships.check_constraints = [
      {
        name: 'positive_price',
        condition: 'price > 0',
        description: 'Ensure price is positive'
      }
    ];
  }
  
  return relationships;
}

function generateIndexes(tableName: string, columns: Record<string, ColumnDefinition>): IndexDefinition[] {
  const indexes: IndexDefinition[] = [];
  
  // Add indexes for commonly queried columns
  Object.entries(columns).forEach(([columnName, column]) => {
    if (column.unique && columnName !== 'id') {
      indexes.push({
        name: `idx_${tableName}_${columnName}`,
        table: tableName,
        columns: [columnName],
        type: 'unique',
        description: `Unique index on ${columnName} for fast lookups`
      });
    }
    
    if (columnName.endsWith('_id') && columnName !== 'id') {
      indexes.push({
        name: `idx_${tableName}_${columnName}`,
        table: tableName,
        columns: [columnName],
        type: 'btree',
        description: `Index on foreign key ${columnName} for join performance`
      });
    }
  });
  
  // Add composite indexes for common query patterns
  if (columns.created_at) {
    indexes.push({
      name: `idx_${tableName}_created_at`,
      table: tableName,
      columns: ['created_at'],
      type: 'btree',
      description: 'Index on created_at for time-based queries'
    });
  }
  
  return indexes;
}

function generateConstraints(tableName: string, columns: Record<string, ColumnDefinition>): ConstraintDefinition[] {
  const constraints: ConstraintDefinition[] = [
    {
      name: `pk_${tableName}`,
      type: 'primary_key',
      table: tableName,
      columns: ['id'],
      description: 'Primary key constraint'
    }
  ];
  
  // Add unique constraints
  Object.entries(columns).forEach(([columnName, column]) => {
    if (column.unique && columnName !== 'id') {
      constraints.push({
        name: `uk_${tableName}_${columnName}`,
        type: 'unique',
        table: tableName,
        columns: [columnName],
        description: `Unique constraint on ${columnName}`
      });
    }
  });
  
  return constraints;
}

function generateMigrations(tableName: string): MigrationDefinition[] {
  return [
    {
      version: '001',
      description: `Create ${tableName} table`,
      up: [
        `CREATE TABLE ${tableName} (...)`,
        `CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at)`
      ],
      down: [
        `DROP INDEX IF EXISTS idx_${tableName}_created_at`,
        `DROP TABLE IF EXISTS ${tableName}`
      ],
      rollback_safe: true
    }
  ];
}

function generateValidationRules(tableName: string, columns: Record<string, ColumnDefinition>): ValidationRule[] {
  const rules: ValidationRule[] = [];
  
  Object.entries(columns).forEach(([columnName, column]) => {
    if (!column.nullable) {
      rules.push({
        table: tableName,
        column: columnName,
        rule: 'NOT NULL',
        description: `${columnName} is required`,
        error_message: `${columnName} cannot be null`
      });
    }
    
    if (column.type === 'string' && columnName === 'email') {
      rules.push({
        table: tableName,
        column: columnName,
        rule: 'EMAIL_FORMAT',
        description: 'Email must be in valid format',
        error_message: 'Invalid email format'
      });
    }
  });
  
  return rules;
}

function generateMigrationExample(spec: DatabaseSpec, dbType: string): string {
  const tableName = spec.identifier;
  const table = spec.specification.schema.tables[tableName];
  
  let sql = `-- ${dbType.toUpperCase()} Migration for ${tableName}\n`;
  sql += `-- Generated from database specification\n\n`;
  
  // CREATE TABLE statement
  sql += `CREATE TABLE ${tableName} (\n`;
  
  const columnDefs: string[] = [];
  Object.entries(table.columns).forEach(([columnName, column]) => {
    const dbTypeMapping = column.dbTypes?.[dbType] || column.type;
    columnDefs.push(`  ${columnName} ${dbTypeMapping}`);
  });
  
  sql += columnDefs.join(',\n');
  sql += `\n);\n\n`;
  
  // Add indexes
  spec.specification.schema.indexes.forEach(index => {
    if (index.table === tableName) {
      const indexType = index.type === 'unique' ? 'UNIQUE INDEX' : 'INDEX';
      sql += `CREATE ${indexType} ${index.name} ON ${tableName}(${index.columns.join(', ')});\n`;
    }
  });
  
  sql += `\n-- Add comments\n`;
  sql += `COMMENT ON TABLE ${tableName} IS '${table.description}';\n`;
  
  Object.entries(table.columns).forEach(([columnName, column]) => {
    sql += `COMMENT ON COLUMN ${tableName}.${columnName} IS '${column.description}';\n`;
  });
  
  return sql;
} 