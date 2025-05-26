# UI Component Compliance Demo

This demo showcases the universal spec compliance framework's ability to check React/Vue components against their specifications.

## Example 1: Add to Cart Button Component

### 1. Component Specification

**File: `specs/ui/add-to-cart-button-2025-01-15.yaml`**

```yaml
type: ui
identifier: AddToCartButton
summary: "Primary action button for adding products to shopping cart"
specification:
  component:
    type: "functional-component"
    framework: "react"
    
  props:
    required:
      productId: 
        type: "string"
        description: "Unique product identifier"
      onAddToCart: 
        type: "function"
        description: "Callback when user adds item to cart"
        signature: "(productId: string) => Promise<void>"
    optional:
      disabled: 
        type: "boolean"
        default: false
        description: "Whether button is disabled"
      variant: 
        type: "enum"
        values: ["primary", "secondary"]
        default: "primary"
        description: "Button style variant"
      size: 
        type: "enum"
        values: ["small", "medium", "large"]
        default: "medium"
        description: "Button size"
  
  events:
    - name: "onAddToCart"
      description: "Triggered when user clicks the button"
      payload: 
        productId: "string"
      required: true
    - name: "onError"
      description: "Triggered when add to cart fails"
      payload: 
        error: "Error"
        productId: "string"
      required: false
  
  accessibility:
    required:
      aria-label: "Add {productName} to cart"
      role: "button"
      keyboard-navigation: true
    wcag_level: "AA"
    
  design_system:
    tokens:
      - "var(--color-primary)"
      - "var(--spacing-md)"
      - "var(--font-button)"
    variants: ["primary", "secondary"]
    sizes: ["small", "medium", "large"]
    
  states:
    - name: "default"
      description: "Ready to add to cart"
    - name: "loading"
      description: "Adding to cart..."
    - name: "disabled"
      description: "Cannot add to cart"
    - name: "error"
      description: "Failed to add to cart"

complianceRules:
  - "All required props must be defined with correct types"
  - "Optional props must have default values"
  - "Must have proper ARIA labels for accessibility"
  - "Must support keyboard navigation"
  - "Must use design system tokens"
  - "Must implement all required variants"
```

### 2. Good Implementation (Compliant)

**File: `src/components/AddToCartButton.tsx`**

```tsx
import React, { useState } from 'react';
import styled from 'styled-components';

interface Props {
  productId: string;
  onAddToCart: (productId: string) => Promise<void>;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  productName?: string;
}

const StyledButton = styled.button<{ variant: string; size: string; disabled: boolean }>`
  background-color: ${props => 
    props.variant === 'primary' ? 'var(--color-primary)' : 'var(--color-secondary)'
  };
  padding: ${props => {
    switch (props.size) {
      case 'small': return 'var(--spacing-sm)';
      case 'large': return 'var(--spacing-lg)';
      default: return 'var(--spacing-md)';
    }
  }};
  font-family: var(--font-button);
  border: none;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  
  &:focus {
    outline: 2px solid var(--color-focus);
  }
`;

const AddToCartButton: React.FC<Props> = ({ 
  productId, 
  onAddToCart, 
  disabled = false, 
  variant = 'primary', 
  size = 'medium',
  productName = 'item'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      await onAddToCart(productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
      // Trigger onError event if provided
      console.error('Add to cart failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Adding...';
    if (error) return 'Try Again';
    return `Add ${productName} to Cart`;
  };

  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Add ${productName} to cart`}
      role="button"
      tabIndex={0}
    >
      {getButtonText()}
    </StyledButton>
  );
};

export default React.memo(AddToCartButton);
```

### 3. Bad Implementation (Non-Compliant)

**File: `src/components/AddToCartButtonBad.tsx`**

```tsx
import React from 'react';

// Missing Props interface
const AddToCartButtonBad = ({ productId, onClick, disabled, variant }) => {
  return (
    <div 
      style={{
        backgroundColor: '#007bff', // Hardcoded color
        padding: '10px 20px',       // Hardcoded spacing
        color: 'white',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      onClick={() => onClick(productId)}
      // Missing accessibility attributes
      // Missing keyboard support
      // Missing proper semantic HTML
    >
      Add to Cart
    </div>
  );
};

export default AddToCartButtonBad;
```

## Running Compliance Checks

### Check Good Implementation

```bash
# Using the universal compliance tool
{
  "tool": "check_spec_compliance",
  "parameters": {
    "type": "ui",
    "identifier": "AddToCartButton",
    "implementationPath": "src/components/AddToCartButton.tsx",
    "specPath": "specs/ui/add-to-cart-button-2025-01-15.yaml"
  }
}
```

**Expected Result:**
```json
{
  "type": "ui_compliance",
  "result": {
    "isCompliant": true,
    "score": 0.95,
    "issues": [
      {
        "type": "MISSING_ERROR_EVENT",
        "severity": "info",
        "message": "Optional onError event handler not implemented",
        "suggestion": "Add onError prop for better error handling"
      }
    ],
    "suggestions": [
      {
        "type": "MISSING_ERROR_EVENT",
        "description": "Add onError prop for better error handling",
        "autoFixable": true,
        "priority": "low",
        "category": "structure"
      }
    ],
    "metadata": {
      "artifactType": "ui",
      "identifier": "AddToCartButton",
      "checkedAt": "2025-01-15T10:30:00Z",
      "checkDuration": 150,
      "version": "1.0.0"
    },
    "dimensions": {
      "props_compliance": {
        "name": "Props Compliance",
        "score": 1.0,
        "isCompliant": true,
        "issues": [],
        "weight": 2.0
      },
      "accessibility_compliance": {
        "name": "Accessibility Compliance", 
        "score": 1.0,
        "isCompliant": true,
        "issues": [],
        "weight": 2.0
      },
      "design_system_compliance": {
        "name": "Design System Compliance",
        "score": 1.0,
        "isCompliant": true,
        "issues": [],
        "weight": 1.5
      },
      "event_handling_compliance": {
        "name": "Event Handling Compliance",
        "score": 0.9,
        "isCompliant": true,
        "issues": [
          {
            "type": "MISSING_ERROR_EVENT",
            "severity": "info",
            "message": "Optional onError event handler not implemented"
          }
        ],
        "weight": 1.0
      },
      "performance_compliance": {
        "name": "Performance Compliance",
        "score": 1.0,
        "isCompliant": true,
        "issues": [],
        "weight": 0.5
      }
    }
  },
  "summary": "✅ COMPLIANT (95.0%) - 1 issue found",
  "actionableSteps": [
    "Review and apply suggested fixes:",
    "  1. 🟢 Add onError prop for better error handling"
  ],
  "dimensions": [
    {
      "name": "Props Compliance",
      "score": "100.0%",
      "status": "✅",
      "issues": 0
    },
    {
      "name": "Accessibility Compliance",
      "score": "100.0%", 
      "status": "✅",
      "issues": 0
    },
    {
      "name": "Design System Compliance",
      "score": "100.0%",
      "status": "✅", 
      "issues": 0
    },
    {
      "name": "Event Handling Compliance",
      "score": "90.0%",
      "status": "✅",
      "issues": 1
    },
    {
      "name": "Performance Compliance",
      "score": "100.0%",
      "status": "✅",
      "issues": 0
    }
  ]
}
```

### Check Bad Implementation

```bash
{
  "tool": "check_spec_compliance",
  "parameters": {
    "type": "ui",
    "identifier": "AddToCartButton",
    "implementationPath": "src/components/AddToCartButtonBad.tsx",
    "specPath": "specs/ui/add-to-cart-button-2025-01-15.yaml"
  }
}
```

**Expected Result:**
```json
{
  "type": "ui_compliance",
  "result": {
    "isCompliant": false,
    "score": 0.25,
    "issues": [
      {
        "type": "MISSING_PROPS_INTERFACE",
        "severity": "error",
        "message": "Component missing TypeScript props interface",
        "suggestion": "Define a props interface with all required and optional properties",
        "location": { "file": "src/components/AddToCartButtonBad.tsx" }
      },
      {
        "type": "MISSING_REQUIRED_PROP",
        "severity": "error", 
        "message": "Missing required prop: onAddToCart",
        "suggestion": "Add onAddToCart prop with type function",
        "location": { "file": "src/components/AddToCartButtonBad.tsx" }
      },
      {
        "type": "MISSING_ARIA_ATTRIBUTE",
        "severity": "error",
        "message": "Missing ARIA attribute: aria-label",
        "suggestion": "Add aria-label=\"Add {productName} to cart\" to component",
        "location": { "file": "src/components/AddToCartButtonBad.tsx" }
      },
      {
        "type": "NON_SEMANTIC_HTML",
        "severity": "warning",
        "message": "Component should use semantic HTML elements",
        "suggestion": "Replace div/span with semantic elements like button, nav, main, etc.",
        "location": { "file": "src/components/AddToCartButtonBad.tsx" }
      },
      {
        "type": "MISSING_KEYBOARD_SUPPORT",
        "severity": "error",
        "message": "Interactive component missing keyboard navigation",
        "suggestion": "Add onKeyDown handler for Enter and Space keys",
        "location": { "file": "src/components/AddToCartButtonBad.tsx" }
      },
      {
        "type": "HARDCODED_STYLES",
        "severity": "warning",
        "message": "Component contains hardcoded style values",
        "suggestion": "Replace hardcoded values with design system tokens",
        "location": { "file": "src/components/AddToCartButtonBad.tsx" }
      },
      {
        "type": "MISSING_VARIANTS",
        "severity": "error",
        "message": "Component missing required variants",
        "suggestion": "Implement variants: primary, secondary",
        "location": { "file": "src/components/AddToCartButtonBad.tsx" }
      },
      {
        "type": "NOT_MEMOIZED",
        "severity": "info",
        "message": "Component could benefit from memoization",
        "suggestion": "Wrap component with React.memo() for better performance",
        "location": { "file": "src/components/AddToCartButtonBad.tsx" }
      }
    ],
    "suggestions": [
      {
        "type": "MISSING_PROPS_INTERFACE",
        "description": "Define a props interface with all required and optional properties",
        "code": "interface Props {\n  // Add your prop definitions here\n  // Example:\n  // title: string;\n  // onClick?: () => void;\n  // disabled?: boolean;\n}",
        "autoFixable": false,
        "priority": "high",
        "category": "structure"
      },
      {
        "type": "MISSING_ARIA_ATTRIBUTE",
        "description": "Add aria-label=\"Add {productName} to cart\" to component",
        "code": "aria-label=\"Add {productName} to cart\"",
        "autoFixable": true,
        "priority": "high",
        "category": "accessibility"
      },
      {
        "type": "NOT_MEMOIZED",
        "description": "Wrap component with React.memo() for better performance",
        "code": "export default React.memo(YourComponent);",
        "autoFixable": true,
        "priority": "low",
        "category": "performance"
      }
    ]
  },
  "summary": "❌ NON-COMPLIANT (25.0%) - 8 issues found (5 critical)",
  "actionableSteps": [
    "Review and apply suggested fixes:",
    "  1. 🔴 Define a props interface with all required and optional properties",
    "     Code: interface Props {\n  // Add your prop definitions here\n  // Example:\n  // title: string;\n  // onClick?: () => void;\n  // disabled?: boolean;\n}",
    "  2. 🔴 Add aria-label=\"Add {productName} to cart\" to component",
    "     Code: aria-label=\"Add {productName} to cart\"",
    "  3. 🟢 Wrap component with React.memo() for better performance",
    "     Code: export default React.memo(YourComponent);",
    "Fix 5 critical error(s) first",
    "Re-run compliance check after making changes",
    "Focus on improving these areas:",
    "  - Props Compliance: 3 issue(s)",
    "  - Accessibility Compliance: 3 issue(s)",
    "  - Design System Compliance: 2 issue(s)",
    "  - Event Handling Compliance: 0 issue(s)",
    "  - Performance Compliance: 1 issue(s)"
  ],
  "dimensions": [
    {
      "name": "Props Compliance",
      "score": "10.0%",
      "status": "❌",
      "issues": 3
    },
    {
      "name": "Accessibility Compliance",
      "score": "10.0%",
      "status": "❌", 
      "issues": 3
    },
    {
      "name": "Design System Compliance",
      "score": "40.0%",
      "status": "❌",
      "issues": 2
    },
    {
      "name": "Event Handling Compliance",
      "score": "100.0%",
      "status": "✅",
      "issues": 0
    },
    {
      "name": "Performance Compliance",
      "score": "70.0%",
      "status": "❌",
      "issues": 1
    }
  ]
}
```

## Example 2: Auto-Detection Demo

### Auto-detect spec and implementation files

```bash
# The tool can auto-detect files based on naming conventions
{
  "tool": "check_spec_compliance",
  "parameters": {
    "type": "ui",
    "identifier": "AddToCartButton"
    // specPath and implementationPath will be auto-detected
  }
}
```

**Auto-detection logic:**
- **Spec file**: Looks in `specs/ui/` for files containing `add-to-cart-button` or `addtocartbutton`
- **Implementation**: Searches in `src/components/`, `components/`, etc. for files containing `AddToCartButton`

## Example 3: Unsupported Artifact Types

```bash
{
  "tool": "check_spec_compliance", 
  "parameters": {
    "type": "db",
    "identifier": "users_table"
  }
}
```

**Result:**
```json
{
  "error": "Artifact type 'db' is not yet implemented",
  "supportedTypes": ["api", "ui"],
  "message": "The db compliance checker is under development. Currently supported: api, ui",
  "roadmap": {
    "ui": "Available - React/Vue component compliance",
    "db": "Coming soon - Database schema compliance", 
    "cli": "Coming soon - CLI tool compliance",
    "job": "Coming soon - Background job compliance",
    "page": "Coming soon - Web page compliance",
    "lib": "Coming soon - Library compliance"
  }
}
```

## Benefits Demonstrated

### 1. **Comprehensive Compliance Checking**
- **Props**: Type safety, required/optional validation, defaults
- **Accessibility**: ARIA attributes, keyboard navigation, semantic HTML
- **Design System**: Token usage, variant implementation, hardcoded style detection
- **Events**: Handler presence, payload structure validation
- **Performance**: Memoization, re-render optimization, bundle size

### 2. **Actionable Feedback**
- Prioritized suggestions (🔴 high, 🟡 medium, 🟢 low)
- Auto-fixable code snippets
- Specific file locations
- Dimension-based scoring

### 3. **Developer Experience**
- Auto-detection of spec and implementation files
- Backward compatibility with existing API compliance
- Clear error messages with troubleshooting steps
- Progressive disclosure of compliance information

### 4. **Extensibility**
- Easy to add new artifact types (db, cli, job, etc.)
- Pluggable compliance checker architecture
- Customizable compliance rules and weights
- Framework-agnostic design

This demonstrates how the universal compliance framework transforms spec compliance checking from API-only to a comprehensive development quality assurance platform that can validate any type of software artifact against its specification. 