# Spec Compliance Checking Demo

This demo shows how the hypothesis-driven spec compliance checker works in practice.

## Scenario: User Management API

Let's say you've generated a spec for a user management endpoint and now want to ensure your implementation follows it.

### Step 1: Generated Spec (vibe.yaml)

```yaml
openapi: 3.0.0
info:
  title: User Management API
  version: 1.0.0
paths:
  /api/users:
    get:
      summary: Get all users
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    post:
      summary: Create a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
  /api/users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: User details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - name
        - email
    CreateUserRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 2
        email:
          type: string
          format: email
      required:
        - name
        - email
    Error:
      type: object
      properties:
        error:
          type: string
        status:
          type: integer
```

### Step 2: Implementation Examples

#### ❌ Non-Compliant Implementation

```javascript
// routes/users.js - NON-COMPLIANT VERSION
const express = require('express');
const router = express.Router();

// GET /api/users - Missing proper response format
router.get('/api/users', async (req, res) => {
  const users = await User.findAll();
  // Wrong: wrapping in data object, spec expects array directly
  res.json({ data: users, count: users.length });
});

// POST /api/users - Missing validation
router.post('/api/users', async (req, res) => {
  // No validation middleware - spec requires name and email validation
  const user = await User.create(req.body);
  res.json(user);
});

// GET /api/users/:id - Missing error handling
router.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  // Missing 404 handling - spec requires 404 response
  res.json(user);
});

module.exports = router;
```

#### ✅ Compliant Implementation

```javascript
// routes/users.js - COMPLIANT VERSION
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();

// GET /api/users - Compliant response format
router.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll();
    // Correct: returning array directly as per spec
    res.json(users);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      status: 500
    });
  }
});

// POST /api/users - With proper validation
router.post('/api/users', [
  // Validation middleware matching spec requirements
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Must be a valid email')
], async (req, res) => {
  // Handle validation errors as per spec
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Invalid request',
      status: 400,
      details: errors.array()
    });
  }

  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      status: 500
    });
  }
});

// GET /api/users/:id - With proper error handling
router.get('/api/users/:id', [
  param('id').notEmpty().withMessage('User ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Invalid request',
      status: 400,
      details: errors.array()
    });
  }

  try {
    const user = await User.findById(req.params.id);
    
    // Proper 404 handling as required by spec
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404
      });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      status: 500
    });
  }
});

module.exports = router;
```

### Step 3: Compliance Checking Results

#### Checking Non-Compliant Implementation

```bash
# MCP Tool Call
{
  "tool": "check_spec_compliance",
  "parameters": {
    "implementationPath": "routes/users-bad.js",
    "endpoint": "/api/users",
    "method": "POST"
  }
}
```

**Result**:
```json
{
  "type": "endpoint_compliance",
  "result": {
    "isCompliant": false,
    "score": 0.4,
    "issues": [
      {
        "type": "MISSING_VALIDATION",
        "severity": "error",
        "message": "Request validation is missing but required by spec",
        "suggestion": "Add request validation middleware"
      },
      {
        "type": "MISSING_ERROR_HANDLING",
        "severity": "warning",
        "message": "Missing error handling for HTTP 400",
        "suggestion": "Add error handling for 400 status code"
      }
    ],
    "suggestions": [
      {
        "type": "ADD_VALIDATION",
        "description": "Add request validation middleware",
        "code": "[\n    body('name').isLength({ min: 2 }),\n    body('email').isEmail()\n  ]",
        "autoFixable": true,
        "priority": "high"
      },
      {
        "type": "ADD_ERROR_HANDLING",
        "description": "Add 400 error handling",
        "code": "const errors = validationResult(req);\nif (!errors.isEmpty()) {\n  return res.status(400).json({\n    error: 'Invalid request',\n    status: 400,\n    details: errors.array()\n  });\n}",
        "autoFixable": true,
        "priority": "medium"
      }
    ],
    "validationCompliance": {
      "hasValidation": false,
      "missingValidations": ["request-body"],
      "validationLibrary": "none"
    },
    "errorHandlingCompliance": {
      "handles404": false,
      "handles400": false,
      "handles500": false,
      "errorFormat": "non-compliant",
      "missingErrorCodes": ["400"]
    }
  },
  "summary": "❌ NON-COMPLIANT (40.0%) - 2 issues found",
  "actionableSteps": [
    "Review and apply suggested fixes:",
    "  1. Add request validation middleware",
    "  2. Add 400 error handling",
    "Fix critical errors first (marked as severity: error)",
    "Re-run compliance check after making changes"
  ]
}
```

#### Checking Compliant Implementation

```bash
# MCP Tool Call
{
  "tool": "check_spec_compliance",
  "parameters": {
    "implementationPath": "routes/users-good.js",
    "endpoint": "/api/users",
    "method": "POST"
  }
}
```

**Result**:
```json
{
  "type": "endpoint_compliance",
  "result": {
    "isCompliant": true,
    "score": 0.95,
    "issues": [],
    "suggestions": [],
    "validationCompliance": {
      "hasValidation": true,
      "missingValidations": [],
      "validationLibrary": "express-validator"
    },
    "errorHandlingCompliance": {
      "handles404": false,
      "handles400": true,
      "handles500": true,
      "errorFormat": "compliant",
      "missingErrorCodes": []
    }
  },
  "summary": "✅ COMPLIANT (95.0%) - 0 issues found"
}
```

### Step 4: Project-Wide Compliance Report

```bash
# MCP Tool Call
{
  "tool": "check_spec_compliance",
  "parameters": {
    "generateReport": true
  }
}
```

**Result**:
```json
{
  "type": "project_compliance_report",
  "report": {
    "overallScore": 0.75,
    "endpoints": [
      {
        "endpoint": "/api/users",
        "method": "GET",
        "isCompliant": true,
        "score": 0.9,
        "issues": [],
        "filePath": "routes/users.js"
      },
      {
        "endpoint": "/api/users",
        "method": "POST",
        "isCompliant": false,
        "score": 0.6,
        "issues": [
          {
            "type": "MISSING_VALIDATION",
            "severity": "error",
            "message": "Request validation is missing"
          }
        ],
        "filePath": "routes/users.js"
      },
      {
        "endpoint": "/api/users/{id}",
        "method": "GET",
        "isCompliant": false,
        "score": 0.7,
        "issues": [
          {
            "type": "MISSING_ERROR_HANDLING",
            "severity": "warning",
            "message": "Missing 404 error handling"
          }
        ],
        "filePath": "routes/users.js"
      }
    ],
    "summary": {
      "compliant": 1,
      "nonCompliant": 2,
      "total": 3,
      "criticalIssues": 1
    },
    "recommendations": [
      "Add request validation to POST /api/users",
      "Implement 404 error handling for GET /api/users/{id}",
      "Consider using consistent error response format across all endpoints"
    ]
  },
  "summary": "Project compliance: 75.0% - 1/3 endpoints compliant"
}
```

## Development Workflow Integration

### 1. During Development

```bash
# Check specific endpoint while coding
{
  "tool": "check_spec_compliance",
  "parameters": {
    "implementationPath": "routes/users.js",
    "endpoint": "/api/users",
    "method": "POST"
  }
}
```

### 2. Before Committing

```bash
# Run project-wide scan
{
  "tool": "check_spec_compliance",
  "parameters": {
    "projectPath": "."
  }
}
```

### 3. Continuous Monitoring

```bash
# Enable watch mode for active development
{
  "tool": "check_spec_compliance",
  "parameters": {
    "watchMode": true,
    "implementationPath": "routes/users.js"
  }
}
```

## Key Benefits Demonstrated

1. **Early Detection**: Issues caught during development, not in production
2. **Actionable Feedback**: Specific code suggestions, not just error messages
3. **Progressive Enhancement**: Compliance improves incrementally
4. **Workflow Integration**: Fits naturally into development process

## Hypothesis Validation

The demo validates our core hypothesis:

✅ **Developers need real-time feedback** - Immediate compliance results
✅ **Actionable insights on deviations** - Specific code suggestions provided
✅ **Suggestions for alignment** - Auto-fixable code snippets included

This TDD-driven approach ensures the tool solves real developer problems with practical, actionable solutions. 