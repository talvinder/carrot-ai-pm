# Spec Compliance Checking - Hypothesis-Driven Development

## Overview

The Spec Compliance Checker is a hypothesis-driven, TDD-built capability that validates whether your implementation follows the generated OpenAPI specifications. This tool bridges the gap between specification and implementation, providing real-time feedback and actionable suggestions.

## Hypothesis

**Primary Hypothesis**: Developers need real-time feedback on whether their implementation matches the generated specifications, with actionable insights on deviations and suggestions for alignment.

**Supporting Hypotheses**:
1. **Early Detection**: Catching spec deviations early reduces debugging time and improves code quality
2. **Actionable Feedback**: Specific, code-level suggestions are more valuable than generic compliance scores
3. **Continuous Monitoring**: Real-time compliance checking maintains alignment throughout development
4. **Progressive Enhancement**: Compliance checking should integrate seamlessly with existing workflows

## TDD Implementation Approach

This tool was built using Test-Driven Development with Gherkin-style scenarios:

### Test Scenarios Implemented

```gherkin
Feature: Real-time Spec Compliance Validation
  As a developer using Carrot AI PM
  I want to validate my implementation against specs
  So that I can ensure consistency and catch issues early

  Scenario: Route implementation matches OpenAPI spec
    Given I have an OpenAPI spec for a user endpoint
    And I have a route implementation
    When I check compliance
    Then The compliance should be validated
    And Issues should be identified with actionable suggestions

  Scenario: Missing validation detection
    Given Spec requires request validation
    And Implementation lacks validation middleware
    When I check compliance
    Then Missing validation should be flagged
    And Specific validation code should be suggested
```

## Usage Patterns

### 1. Basic Endpoint Compliance Check

Check if a specific endpoint implementation matches its spec:

```bash
# Via MCP tool call
{
  "tool": "check_spec_compliance",
  "parameters": {
    "implementationPath": "routes/users.js",
    "endpoint": "/api/users",
    "method": "GET"
  }
}
```

**Expected Output**:
```json
{
  "type": "endpoint_compliance",
  "result": {
    "isCompliant": false,
    "score": 0.7,
    "issues": [
      {
        "type": "MISSING_VALIDATION",
        "severity": "error",
        "message": "Request validation is missing but required by spec",
        "suggestion": "Add request validation middleware"
      }
    ],
    "suggestions": [
      {
        "type": "ADD_VALIDATION",
        "description": "Add request validation middleware",
        "code": "[\n    body('name').notEmpty(),\n    body('email').isEmail()\n  ]",
        "autoFixable": true,
        "priority": "high"
      }
    ]
  },
  "summary": "❌ NON-COMPLIANT (70.0%) - 1 issues found",
  "actionableSteps": [
    "Review and apply suggested fixes:",
    "  1. Add request validation middleware",
    "Fix critical errors first (marked as severity: error)",
    "Re-run compliance check after making changes"
  ]
}
```

### 2. Project-Wide Compliance Scan

Scan entire project for compliance issues:

```bash
{
  "tool": "check_spec_compliance",
  "parameters": {
    "projectPath": "."
  }
}
```

### 3. Comprehensive Compliance Report

Generate detailed project compliance report:

```bash
{
  "tool": "check_spec_compliance",
  "parameters": {
    "generateReport": true
  }
}
```

### 4. Continuous Monitoring (Watch Mode)

Enable real-time compliance monitoring:

```bash
{
  "tool": "check_spec_compliance",
  "parameters": {
    "watchMode": true,
    "implementationPath": "routes/users.js"
  }
}
```

## Compliance Dimensions

The tool checks compliance across multiple dimensions:

### 1. Response Schema Compliance
- **Validates**: Response structure matches OpenAPI schema
- **Detects**: Missing required fields, wrong data types, extra fields
- **Suggests**: Schema updates, response format fixes

### 2. Request Validation Compliance
- **Validates**: Request validation middleware presence
- **Detects**: Missing validation for required fields
- **Suggests**: Specific validation code (express-validator, Joi, Zod)

### 3. Error Handling Compliance
- **Validates**: Error responses match spec definitions
- **Detects**: Missing error status codes (404, 400, 500)
- **Suggests**: Error handling code snippets

### 4. Route Pattern Compliance
- **Validates**: Route patterns match OpenAPI paths
- **Detects**: Parameter mismatches, path inconsistencies
- **Suggests**: Route corrections

## Scoring Algorithm

Compliance score is calculated using weighted deductions:

```typescript
const totalChecks = 10; // Base compliance checks
const errorWeight = 3;   // Critical issues
const warningWeight = 1; // Minor issues

const score = Math.max(0, (totalChecks - deductions) / totalChecks);
const isCompliant = score >= 0.8 && errorCount === 0;
```

**Score Interpretation**:
- **90-100%**: Excellent compliance
- **80-89%**: Good compliance (compliant)
- **60-79%**: Needs improvement
- **Below 60%**: Significant issues

## Integration with Development Workflow

### 1. Pre-Commit Hooks
```bash
# Add to .git/hooks/pre-commit
npm run check-compliance
```

### 2. CI/CD Pipeline
```yaml
# .github/workflows/compliance.yml
- name: Check Spec Compliance
  run: |
    node -e "
      const { checkSpecCompliance } = require('./dist/tools/check_spec_compliance.js');
      // Run compliance checks
    "
```

### 3. IDE Integration
The tool provides structured output that can be integrated with:
- VS Code extensions
- ESLint custom rules
- Custom development tools

## Advanced Features

### 1. Auto-Fix Suggestions

Many compliance issues include auto-fixable suggestions:

```json
{
  "type": "ADD_VALIDATION",
  "autoFixable": true,
  "code": "[\n    body('name').isLength({ min: 2 }),\n    body('email').isEmail()\n  ]"
}
```

### 2. Library Detection

The tool detects and adapts to different validation libraries:
- **express-validator**: `body('field').validation()`
- **Joi**: `Joi.object().keys()`
- **Zod**: `z.object()`
- **Custom**: Pattern-based detection

### 3. Progressive Disclosure

Compliance information is presented with progressive detail:
1. **Summary**: Quick pass/fail with score
2. **Issues**: Specific problems with severity
3. **Suggestions**: Actionable fixes with code
4. **Deep Analysis**: Detailed compliance breakdown

## Error Handling and Edge Cases

### 1. Missing Spec File
```json
{
  "error": "Spec file not found: /path/to/vibe.yaml",
  "suggestions": [
    "Run grow_spec tool to generate OpenAPI specification",
    "Ensure vibe.yaml exists in your project root"
  ]
}
```

### 2. Invalid Implementation File
```json
{
  "error": "Implementation file not found: /path/to/route.js",
  "troubleshooting": [
    "Check file path is correct",
    "Ensure file exists and is readable"
  ]
}
```

### 3. Spec Parsing Errors
```json
{
  "error": "Failed to parse spec file: Invalid YAML",
  "troubleshooting": [
    "Validate YAML syntax",
    "Check for indentation issues",
    "Ensure spec follows OpenAPI 3.0 format"
  ]
}
```

## Future Enhancements

Based on the TDD approach, planned enhancements include:

### 1. Enhanced Schema Validation
- JSON Schema validation against actual responses
- Runtime response monitoring
- Schema evolution tracking

### 2. Performance Monitoring
- Response time compliance
- Resource usage validation
- Load testing integration

### 3. Security Compliance
- Authentication/authorization checks
- Input sanitization validation
- Security header compliance

### 4. Documentation Sync
- README.md updates based on spec changes
- API documentation generation
- Example code synchronization

## Best Practices

### 1. Spec-First Development
1. Generate spec with `grow_spec`
2. Implement route following spec
3. Check compliance continuously
4. Iterate based on feedback

### 2. Compliance-Driven Refactoring
1. Run project-wide compliance scan
2. Prioritize high-severity issues
3. Apply auto-fixable suggestions first
4. Manual review for complex issues

### 3. Team Workflow Integration
1. Include compliance checks in code reviews
2. Set compliance thresholds for merging
3. Monitor compliance trends over time
4. Share compliance reports with team

## Troubleshooting

### Common Issues

**Issue**: "Endpoint not found in spec"
**Solution**: Ensure endpoint path exactly matches spec definition, including parameter syntax

**Issue**: "No validation detected but validation exists"
**Solution**: Check if validation library is supported; add custom patterns if needed

**Issue**: "False positive compliance issues"
**Solution**: Review spec accuracy; update spec if implementation is correct

### Debug Mode

Enable verbose logging for detailed analysis:
```bash
DEBUG=carrot:compliance npm run check-compliance
```

## Contributing

The compliance checker follows TDD principles. To add new features:

1. Write Gherkin scenarios first
2. Implement failing tests
3. Build minimal implementation
4. Refactor for quality
5. Update documentation

See `src/tools/check_spec_compliance.test.ts` for test patterns. 