# Spec Compliance Expansion Plan: Beyond API Contexts

## Executive Summary

The current spec compliance checker successfully validates API implementations against OpenAPI specifications. This document outlines a comprehensive expansion strategy to support multiple artifact types, creating a unified compliance framework for modern software development.

## Vision: Universal Spec Compliance Framework

### Core Principle
**One unified approach to spec compliance across all software artifacts**, from APIs to UI components, database schemas, CLI tools, and background jobs.

### Target Artifact Types

| Type | Description | Spec Format | Compliance Dimensions |
|------|-------------|-------------|----------------------|
| `api` | REST/GraphQL APIs | OpenAPI 3.0+ | Request/Response, Validation, Error Handling |
| `ui` | React/Vue Components | Component Schema | Props, Events, Accessibility, Design System |
| `page` | Web Pages/Routes | Page Schema | SEO, Performance, Accessibility, UX |
| `cli` | Command Line Tools | CLI Schema | Arguments, Options, Help, Exit Codes |
| `job` | Background Jobs | Job Schema | Input/Output, Error Handling, Monitoring |
| `db` | Database Schemas | DB Schema | Tables, Relationships, Constraints, Migrations |
| `lib` | Libraries/Modules | Library Schema | API Surface, Types, Documentation |

## Implementation Phases

### Phase 1: Foundation Enhancement (Current → Universal)

#### 1.1 Abstract the Compliance Framework

```typescript
// Core compliance interfaces
interface SpecComplianceChecker<TSpec, TImplementation> {
  checkCompliance(spec: TSpec, implementation: TImplementation): Promise<ComplianceResult>;
  generateSuggestions(issues: ComplianceIssue[]): ComplianceSuggestion[];
  calculateScore(issues: ComplianceIssue[]): number;
}

interface ArtifactSpec {
  type: 'api' | 'ui' | 'page' | 'cli' | 'job' | 'db' | 'lib';
  identifier: string;
  version: string;
  metadata: Record<string, any>;
  specification: any; // Type-specific spec content
}

interface ComplianceContext {
  artifactType: string;
  projectContext: ProjectContext;
  toolchain: string[];
  conventions: Convention[];
}
```

#### 1.2 Refactor Current API Checker

Extract the current API compliance logic into a specialized checker:

```typescript
class APISpecComplianceChecker implements SpecComplianceChecker<OpenAPISpec, APIImplementation> {
  async checkCompliance(spec: OpenAPISpec, implementation: APIImplementation): Promise<ComplianceResult> {
    // Current implementation logic
  }
}
```

### Phase 2: UI Component Compliance

#### 2.1 UI Component Spec Format

```yaml
# Example: specs/ui/add-to-cart-button-2025-01-15.yaml
type: ui
identifier: AddToCartButton
summary: "Primary action button for adding products to shopping cart"
specification:
  component:
    type: "functional-component"
    framework: "react"
    
  props:
    required:
      - productId: { type: "string", description: "Unique product identifier" }
      - onAddToCart: { type: "function", signature: "(productId: string) => Promise<void>" }
    optional:
      - disabled: { type: "boolean", default: false }
      - variant: { type: "enum", values: ["primary", "secondary"], default: "primary" }
      - size: { type: "enum", values: ["small", "medium", "large"], default: "medium" }
  
  events:
    - name: "onAddToCart"
      description: "Triggered when user clicks the button"
      payload: { productId: "string" }
    - name: "onError"
      description: "Triggered when add to cart fails"
      payload: { error: "Error", productId: "string" }
  
  accessibility:
    required:
      - aria-label: "Add {productName} to cart"
      - role: "button"
      - keyboard-navigation: true
    
  design_system:
    tokens:
      - color: "var(--color-primary)"
      - spacing: "var(--spacing-md)"
      - typography: "var(--font-button)"
    
  states:
    - default: "Ready to add to cart"
    - loading: "Adding to cart..."
    - disabled: "Cannot add to cart"
    - error: "Failed to add to cart"

compliance_rules:
  props:
    - "All required props must be defined with correct types"
    - "Optional props must have default values"
    - "Prop types must match TypeScript interfaces"
  
  accessibility:
    - "Must have proper ARIA labels"
    - "Must support keyboard navigation"
    - "Must have sufficient color contrast"
  
  design_system:
    - "Must use design system tokens"
    - "Must follow component naming conventions"
    - "Must implement all required states"
```

#### 2.2 UI Compliance Checker Implementation

```typescript
class UISpecComplianceChecker implements SpecComplianceChecker<UISpec, ComponentImplementation> {
  async checkCompliance(spec: UISpec, implementation: ComponentImplementation): Promise<ComplianceResult> {
    const issues: ComplianceIssue[] = [];
    
    // Check props compliance
    const propsCompliance = this.checkPropsCompliance(spec.props, implementation);
    issues.push(...propsCompliance.issues);
    
    // Check accessibility compliance
    const a11yCompliance = this.checkAccessibilityCompliance(spec.accessibility, implementation);
    issues.push(...a11yCompliance.issues);
    
    // Check design system compliance
    const designCompliance = this.checkDesignSystemCompliance(spec.design_system, implementation);
    issues.push(...designCompliance.issues);
    
    // Check event handling
    const eventCompliance = this.checkEventCompliance(spec.events, implementation);
    issues.push(...eventCompliance.issues);
    
    return {
      isCompliant: issues.filter(i => i.severity === 'error').length === 0,
      score: this.calculateScore(issues),
      issues,
      suggestions: this.generateSuggestions(issues),
      timestamp: new Date()
    };
  }
  
  private checkPropsCompliance(specProps: any, implementation: ComponentImplementation): any {
    // Analyze TypeScript interfaces, PropTypes, or component code
    // Check for missing required props, incorrect types, missing defaults
  }
  
  private checkAccessibilityCompliance(specA11y: any, implementation: ComponentImplementation): any {
    // Check for ARIA attributes, keyboard handlers, semantic HTML
    // Integrate with axe-core or similar tools
  }
  
  private checkDesignSystemCompliance(specDesign: any, implementation: ComponentImplementation): any {
    // Check CSS/styled-components for design token usage
    // Validate component variants and states
  }
}
```

### Phase 3: Database Schema Compliance

#### 3.1 Database Spec Format

```yaml
# Example: specs/db/user-profile-schema-2025-01-15.yaml
type: db
identifier: user_profiles
summary: "User profile data schema with privacy controls"
specification:
  database:
    type: "postgresql"
    version: ">=14.0"
    
  tables:
    user_profiles:
      columns:
        id:
          type: "uuid"
          primary_key: true
          default: "gen_random_uuid()"
        user_id:
          type: "uuid"
          nullable: false
          references: "users.id"
          on_delete: "CASCADE"
        display_name:
          type: "varchar(100)"
          nullable: false
        bio:
          type: "text"
          nullable: true
        avatar_url:
          type: "varchar(500)"
          nullable: true
        privacy_level:
          type: "enum('public', 'friends', 'private')"
          default: "'public'"
        created_at:
          type: "timestamp"
          default: "CURRENT_TIMESTAMP"
        updated_at:
          type: "timestamp"
          default: "CURRENT_TIMESTAMP"
          
      indexes:
        - name: "idx_user_profiles_user_id"
          columns: ["user_id"]
          unique: true
        - name: "idx_user_profiles_display_name"
          columns: ["display_name"]
          
      constraints:
        - name: "chk_display_name_length"
          check: "LENGTH(display_name) >= 2"
        - name: "chk_bio_length"
          check: "LENGTH(bio) <= 1000"

compliance_rules:
  naming:
    - "Table names must be snake_case and plural"
    - "Column names must be snake_case"
    - "Foreign key columns must end with '_id'"
  
  data_integrity:
    - "All foreign keys must have proper references"
    - "All tables must have primary keys"
    - "Timestamps must have defaults"
  
  performance:
    - "Foreign key columns must be indexed"
    - "Frequently queried columns should be indexed"
  
  security:
    - "Sensitive data must have appropriate constraints"
    - "User data must have privacy controls"
```

#### 3.2 Database Compliance Checker

```typescript
class DatabaseSpecComplianceChecker implements SpecComplianceChecker<DatabaseSpec, DatabaseImplementation> {
  async checkCompliance(spec: DatabaseSpec, implementation: DatabaseImplementation): Promise<ComplianceResult> {
    const issues: ComplianceIssue[] = [];
    
    // Check schema structure
    const schemaCompliance = await this.checkSchemaCompliance(spec, implementation);
    issues.push(...schemaCompliance.issues);
    
    // Check naming conventions
    const namingCompliance = this.checkNamingCompliance(spec, implementation);
    issues.push(...namingCompliance.issues);
    
    // Check data integrity
    const integrityCompliance = this.checkDataIntegrityCompliance(spec, implementation);
    issues.push(...integrityCompliance.issues);
    
    // Check performance considerations
    const performanceCompliance = this.checkPerformanceCompliance(spec, implementation);
    issues.push(...performanceCompliance.issues);
    
    return {
      isCompliant: issues.filter(i => i.severity === 'error').length === 0,
      score: this.calculateScore(issues),
      issues,
      suggestions: this.generateSuggestions(issues),
      timestamp: new Date()
    };
  }
  
  private async checkSchemaCompliance(spec: DatabaseSpec, implementation: DatabaseImplementation): Promise<any> {
    // Connect to database and inspect actual schema
    // Compare with spec requirements
    // Check for missing tables, columns, constraints
  }
}
```

### Phase 4: CLI Tool Compliance

#### 4.1 CLI Spec Format

```yaml
# Example: specs/cli/deploy-tool-2025-01-15.yaml
type: cli
identifier: deploy
summary: "Deployment tool for staging and production environments"
specification:
  command:
    name: "deploy"
    description: "Deploy application to specified environment"
    
  arguments:
    required:
      - name: "environment"
        type: "string"
        description: "Target environment (staging|production)"
        validation: "^(staging|production)$"
    
  options:
    - name: "--config"
      short: "-c"
      type: "string"
      description: "Path to deployment config file"
      default: "./deploy.config.js"
    - name: "--dry-run"
      type: "boolean"
      description: "Show what would be deployed without executing"
    - name: "--verbose"
      short: "-v"
      type: "boolean"
      description: "Enable verbose logging"
    - name: "--help"
      short: "-h"
      type: "boolean"
      description: "Show help information"
      
  exit_codes:
    0: "Success"
    1: "General error"
    2: "Invalid arguments"
    3: "Configuration error"
    4: "Deployment failed"
    
  output:
    format: "structured"
    success:
      - "Deployment summary"
      - "Deployed resources"
      - "Access URLs"
    error:
      - "Error description"
      - "Troubleshooting steps"
      - "Support contact"

compliance_rules:
  arguments:
    - "Required arguments must be validated"
    - "Invalid arguments must show helpful error messages"
  
  options:
    - "All options must have descriptions"
    - "Boolean options must not require values"
    - "Help option must show complete usage"
  
  error_handling:
    - "Must use appropriate exit codes"
    - "Error messages must be actionable"
    - "Must handle SIGINT gracefully"
  
  usability:
    - "Must provide progress indicators for long operations"
    - "Must support --help and --version"
    - "Must follow POSIX conventions"
```

### Phase 5: Background Job Compliance

#### 5.1 Job Spec Format

```yaml
# Example: specs/job/email-notification-job-2025-01-15.yaml
type: job
identifier: email_notification
summary: "Send email notifications to users based on triggers"
specification:
  job:
    name: "EmailNotificationJob"
    queue: "notifications"
    priority: "normal"
    
  input:
    required:
      - user_id: { type: "string", description: "Target user ID" }
      - template: { type: "string", description: "Email template name" }
      - data: { type: "object", description: "Template variables" }
    optional:
      - delay: { type: "number", description: "Delay in seconds", default: 0 }
      - retry_count: { type: "number", description: "Max retries", default: 3 }
      
  output:
    success:
      - message_id: { type: "string", description: "Email provider message ID" }
      - sent_at: { type: "timestamp", description: "When email was sent" }
    failure:
      - error_code: { type: "string", description: "Error classification" }
      - error_message: { type: "string", description: "Human readable error" }
      - retry_after: { type: "number", description: "Seconds until retry" }
      
  monitoring:
    metrics:
      - "job_duration_seconds"
      - "job_success_rate"
      - "job_retry_count"
    alerts:
      - condition: "failure_rate > 5%"
        severity: "warning"
      - condition: "queue_depth > 1000"
        severity: "critical"

compliance_rules:
  input_validation:
    - "All required inputs must be validated"
    - "Invalid inputs must fail fast with clear errors"
  
  error_handling:
    - "Must implement exponential backoff for retries"
    - "Must log errors with sufficient context"
    - "Must handle timeout scenarios"
  
  monitoring:
    - "Must emit required metrics"
    - "Must support health checks"
    - "Must handle graceful shutdown"
```

## Universal Compliance Tool Architecture

### Core Tool Enhancement

```typescript
// Enhanced check_spec_compliance tool
export function checkSpecComplianceTool(server: McpServer, repoRoot: string): void {
  server.tool(
    'check_spec_compliance',
    {
      type: z.enum(['api', 'ui', 'page', 'cli', 'job', 'db', 'lib']).describe('Artifact type to check'),
      identifier: z.string().describe('Artifact identifier (e.g., /api/users, AddToCartButton)'),
      specPath: z.string().optional().describe('Path to spec file (auto-detected if not provided)'),
      implementationPath: z.string().optional().describe('Path to implementation (auto-detected if not provided)'),
      projectPath: z.string().optional().describe('Project directory to scan'),
      watchMode: z.boolean().optional().describe('Enable continuous monitoring'),
      generateReport: z.boolean().optional().describe('Generate comprehensive compliance report')
    },
    async ({ type, identifier, specPath, implementationPath, projectPath, watchMode, generateReport }) => {
      // Route to appropriate compliance checker based on type
      const checker = ComplianceCheckerFactory.create(type);
      const spec = await SpecLoader.load(type, identifier, specPath);
      const implementation = await ImplementationLoader.load(type, identifier, implementationPath);
      
      const result = await checker.checkCompliance(spec, implementation);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            type: `${type}_compliance`,
            result,
            summary: generateComplianceSummary(result),
            actionableSteps: generateActionableSteps(result, type)
          }, null, 2)
        }]
      };
    }
  );
}
```

### Compliance Checker Factory

```typescript
class ComplianceCheckerFactory {
  static create(type: string): SpecComplianceChecker<any, any> {
    switch (type) {
      case 'api':
        return new APISpecComplianceChecker();
      case 'ui':
        return new UISpecComplianceChecker();
      case 'db':
        return new DatabaseSpecComplianceChecker();
      case 'cli':
        return new CLISpecComplianceChecker();
      case 'job':
        return new JobSpecComplianceChecker();
      case 'page':
        return new PageSpecComplianceChecker();
      case 'lib':
        return new LibrarySpecComplianceChecker();
      default:
        throw new Error(`Unsupported artifact type: ${type}`);
    }
  }
}
```

## Integration Examples

### 1. Full-Stack Feature Compliance

```bash
# Check compliance for a complete user registration feature
check_spec_compliance type=api identifier=/api/users/register
check_spec_compliance type=ui identifier=RegistrationForm
check_spec_compliance type=db identifier=users_table
check_spec_compliance type=job identifier=welcome_email_job
```

### 2. Project-Wide Compliance Dashboard

```bash
# Generate comprehensive project compliance report
check_spec_compliance generateReport=true
```

**Output:**
```json
{
  "project_compliance": {
    "overall_score": 0.87,
    "artifact_summary": {
      "api": { "total": 12, "compliant": 10, "score": 0.92 },
      "ui": { "total": 8, "compliant": 6, "score": 0.81 },
      "db": { "total": 5, "compliant": 5, "score": 1.0 },
      "job": { "total": 3, "compliant": 2, "score": 0.75 }
    },
    "critical_issues": [
      {
        "type": "ui",
        "identifier": "UserProfile",
        "issue": "Missing accessibility attributes",
        "severity": "error"
      }
    ],
    "recommendations": [
      "Focus on UI accessibility compliance",
      "Add monitoring to background jobs",
      "Update API error handling patterns"
    ]
  }
}
```

### 3. CI/CD Integration

```yaml
# .github/workflows/compliance.yml
name: Spec Compliance Check
on: [push, pull_request]

jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check API Compliance
        run: |
          carrot check_spec_compliance type=api generateReport=true
      - name: Check UI Compliance
        run: |
          carrot check_spec_compliance type=ui generateReport=true
      - name: Fail on Critical Issues
        run: |
          # Parse compliance report and fail if critical issues found
```

## Benefits of Universal Compliance Framework

### 1. **Consistency Across Artifact Types**
- Unified compliance scoring and reporting
- Consistent developer experience
- Standardized suggestion formats

### 2. **Comprehensive Quality Assurance**
- End-to-end feature compliance checking
- Cross-artifact dependency validation
- Holistic project health monitoring

### 3. **Developer Productivity**
- Early detection of specification drift
- Automated suggestion generation
- Integrated development workflow

### 4. **Team Collaboration**
- Shared understanding of compliance standards
- Consistent code review criteria
- Documentation-driven development

### 5. **Scalability**
- Easy addition of new artifact types
- Pluggable compliance checker architecture
- Extensible specification formats

## Implementation Timeline

### Month 1: Foundation
- [ ] Abstract current API compliance checker
- [ ] Implement universal compliance interfaces
- [ ] Create compliance checker factory
- [ ] Update tool interface

### Month 2: UI Components
- [ ] Define UI component spec format
- [ ] Implement UI compliance checker
- [ ] Add React/Vue component analysis
- [ ] Integrate accessibility checking

### Month 3: Database & CLI
- [ ] Define database spec format
- [ ] Implement database compliance checker
- [ ] Define CLI spec format
- [ ] Implement CLI compliance checker

### Month 4: Jobs & Integration
- [ ] Define background job spec format
- [ ] Implement job compliance checker
- [ ] Create project-wide compliance reporting
- [ ] Add CI/CD integration examples

### Month 5: Advanced Features
- [ ] Implement watch mode for all types
- [ ] Add cross-artifact dependency checking
- [ ] Create compliance dashboard
- [ ] Performance optimization

### Month 6: Polish & Documentation
- [ ] Comprehensive documentation
- [ ] Example projects
- [ ] Community feedback integration
- [ ] Performance benchmarking

## Next Steps

1. **Validate the Approach**: Review this plan with the team and gather feedback
2. **Prototype UI Compliance**: Start with a simple React component compliance checker
3. **Define Spec Formats**: Collaborate on the exact specification formats for each artifact type
4. **Build Incrementally**: Implement one artifact type at a time, learning and refining the approach

This expansion transforms the current API-focused compliance checker into a comprehensive development quality assurance platform that can validate any type of software artifact against its specification. 