# 🥕 Carrot AI PM - Enhanced Compliance with AST Analysis & Storage

## Overview

Carrot AI PM now includes advanced compliance checking with **AST (Abstract Syntax Tree) analysis** and **persistent storage** capabilities. This enhancement addresses the critical need for:

- **Detailed compliance results storage** with audit trails
- **Hallucination detection** in AI-generated code
- **AST-based code analysis** with compliance badges
- **Historical tracking** of compliance improvements

## 🌟 Key Features

### 1. AST Analysis with Compliance Badges

The new AST analyzer provides deep code understanding with visual compliance indicators:

```
Module
  ├── FunctionDef: get_user_data          [✅ COMPLIANT]
  │     ├── args: (user_id)              [✅]
  │     └── Return                       [❌ HALLUCINATED - 'user_cache' not defined]
  │           └── Call: get_from_cache() [❌ Unknown function]
  └── Import: os                         [✅ ALLOWED]
```

**Compliance Badges:**
- ✅ `COMPLIANT` - Code meets all requirements
- ❌ `NON-COMPLIANT` - Critical issues found
- ⚠️ `WARNING` - Minor issues or improvements needed
- 🔍 `HALLUCINATED` - Potential AI hallucinations detected

### 2. Hallucination Detection

The system automatically detects potential AI hallucinations:

- **Undefined references** - Variables/functions not defined
- **Missing imports** - Referenced modules not imported
- **Unknown functions** - Function calls to non-existent functions
- **Invalid properties** - Property access on undefined objects

### 3. Persistent Storage System

All compliance results are automatically saved with:

- **Unique result IDs** for tracking
- **Complete AST information** with compliance annotations
- **Audit trails** for project-wide compliance tracking
- **Historical data** for trend analysis
- **Metadata** including timestamps, versions, and environment info

### 4. Comprehensive Reporting

Generate detailed reports including:

- **Current compliance status** with scores and issues
- **AST tree visualization** with compliance badges
- **Hallucination analysis** with specific suggestions
- **Compliance trends** over time
- **Actionable recommendations** for improvements

## 🚀 Usage

### Basic Compliance Check with Storage

```javascript
// The compliance check now automatically includes AST analysis and storage
await checkSpecCompliance({
  type: 'ui',
  identifier: 'UserCard',
  specPath: 'specs/ui/user-card.yaml',
  implementationPath: 'src/components/UserCard.tsx'
});
```

### Response Format

The enhanced compliance check returns:

```json
{
  "type": "ui_compliance_enhanced",
  "result": {
    "isCompliant": false,
    "score": 0.65,
    "issues": [...],
    "suggestions": [...],
    "dimensions": {...}
  },
  "astAnalysis": {
    "summary": {
      "totalNodes": 87,
      "compliantNodes": 69,
      "nonCompliantNodes": 16,
      "warningNodes": 2,
      "hallucinationCount": 16
    },
    "indentedTree": "...",
    "complianceBreakdown": {...}
  },
  "storage": {
    "resultId": "ui-abc123-2024-01-01T12-00-00-000Z",
    "saved": true,
    "storageLocation": ".carrot/compliance"
  },
  "astVisualization": {
    "tree": "Module\n  ├── FunctionDef...",
    "summary": "AST Analysis: 69/87 nodes compliant",
    "hallucinations": "⚠️ 16 potential hallucinations detected"
  },
  "detailedReport": "# Compliance Report...",
  "metadata": {...}
}
```

### Storage API

#### Save Compliance Results

```javascript
const storage = new ComplianceStorage({
  storageDir: '.carrot/compliance',
  enableAuditTrail: true,
  maxHistoryEntries: 50
});

const resultId = await storage.saveComplianceResult(
  complianceResult,
  astResult,
  {
    projectPath: process.cwd(),
    artifactType: 'ui',
    identifier: 'UserCard',
    specPath: 'specs/ui/user-card.yaml',
    implementationPath: 'src/components/UserCard.tsx'
  }
);
```

#### Retrieve Compliance History

```javascript
const history = await storage.getComplianceHistory('ui', 'UserCard', 10);
console.log(`Found ${history.length} historical records`);
```

#### Generate Detailed Reports

```javascript
const report = await storage.generateComplianceReport('ui', 'UserCard', true);
console.log(report); // Markdown-formatted report with AST visualization
```

#### Export Data

```javascript
// Export as JSON
const jsonData = await storage.exportComplianceData('ui', 'UserCard', 'json');

// Export as CSV
const csvData = await storage.exportComplianceData('ui', 'UserCard', 'csv');
```

### AST Analysis API

#### Analyze Code Files

```javascript
const astAnalyzer = new ASTAnalyzer();
const result = await astAnalyzer.analyzeFile('src/components/UserCard.tsx');

console.log(`Total nodes: ${result.summary.totalNodes}`);
console.log(`Hallucinations: ${result.summary.hallucinationCount}`);
console.log(result.indentedTree); // Visual tree representation
```

#### Analyze Code Content

```javascript
const result = await astAnalyzer.analyzeCode(codeContent, 'virtual.tsx');
```

## 📊 Storage Structure

The compliance storage system organizes data as follows:

```
.carrot/
└── compliance/
    ├── results/           # Individual compliance results
    │   └── ui-abc123-2024-01-01T12-00-00-000Z.json
    ├── history/           # Historical data by artifact
    │   └── ui/
    │       └── usercard/
    │           ├── result1.json
    │           └── result2.json
    └── audit/             # Project-wide audit trails
        └── project-hash.json
```

## 🔍 Hallucination Detection Examples

### Undefined Reference Detection

```typescript
// ❌ Detected: 'userData' not defined
const result = userData.process();

// ✅ Suggestion: Define 'userData' or import from module
import { userData } from './userData';
const result = userData.process();
```

### Missing Import Detection

```typescript
// ❌ Detected: 'React' not imported
export function Component() {
  return <div>Hello</div>;
}

// ✅ Suggestion: Add React import
import React from 'react';
export function Component() {
  return <div>Hello</div>;
}
```

### Unknown Function Detection

```typescript
// ❌ Detected: 'processData' function not defined
const result = processData(input);

// ✅ Suggestion: Define or import 'processData'
function processData(data) { /* implementation */ }
const result = processData(input);
```

## 📈 Compliance Trends

The system tracks compliance trends over time:

- **Improving** - Recent scores are higher than historical average
- **Declining** - Recent scores are lower than historical average  
- **Stable** - Scores remain consistent over time

## 🛠️ Configuration

### Storage Options

```javascript
const storage = new ComplianceStorage({
  storageDir: '.carrot/compliance',     // Storage directory
  maxHistoryEntries: 100,               // Max historical records
  enableAuditTrail: true,               // Enable project audit trail
  compressionEnabled: false             // Enable data compression
});
```

### AST Analysis Options

The AST analyzer automatically detects:

- **TypeScript/JavaScript** files (.ts, .tsx, .js, .jsx)
- **Function compliance** (documentation, validation, error handling)
- **Variable compliance** (type annotations, naming conventions)
- **Import compliance** (file existence, proper imports)
- **Call expression compliance** (error handling, async patterns)

## 🎯 Benefits

### For Developers

- **Confidence** - Know exactly what issues exist in AI-generated code
- **Learning** - Understand best practices through detailed suggestions
- **Tracking** - Monitor compliance improvements over time
- **Debugging** - Quickly identify hallucinations and undefined references

### For Teams

- **Standards** - Maintain consistent code quality across projects
- **Auditing** - Track compliance history for regulatory requirements
- **Trends** - Identify patterns in code quality over time
- **Reporting** - Generate compliance reports for stakeholders

### For AI Safety

- **Hallucination Prevention** - Catch AI mistakes before they reach production
- **Validation** - Verify that AI-generated code actually works
- **Trust** - Build confidence in AI-assisted development
- **Accountability** - Maintain detailed records of AI code generation

## 🔧 Integration

The enhanced compliance system integrates seamlessly with:

- **Cursor IDE** - Real-time compliance checking
- **GitHub Actions** - Automated compliance validation
- **VS Code** - Compliance status in editor
- **CI/CD Pipelines** - Compliance gates for deployments

## 📚 Examples

See the complete working example in `test-compliance-storage.js` which demonstrates:

- AST analysis with hallucination detection
- Compliance result storage and retrieval
- Report generation with visual tree representation
- Historical tracking and trend analysis
- Data export capabilities

## 🚦 Next Steps

1. **Run the test**: `node test-compliance-storage.js`
2. **Check your compliance**: Use the enhanced `check_spec_compliance` tool
3. **Review reports**: Examine the generated compliance reports
4. **Track trends**: Monitor your compliance improvements over time
5. **Export data**: Use compliance data for external analysis

The enhanced compliance system ensures that AI-generated code is not only functional but also maintainable, secure, and free from hallucinations. 