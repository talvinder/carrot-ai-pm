/**
 * UI Component Compliance Checker
 * 
 * Validates React/Vue components against their specifications, checking:
 * - Props compliance (types, required/optional, defaults)
 * - Accessibility compliance (ARIA, keyboard navigation, semantic HTML)
 * - Design system compliance (tokens, variants, states)
 * - Event handling compliance
 * - Performance considerations
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

export interface UIComponentSpec {
  type: 'ui';
  identifier: string;
  summary: string;
  specification: {
    component: {
      type: 'functional-component' | 'class-component';
      framework: 'react' | 'vue' | 'angular';
    };
    props: {
      required: Record<string, PropDefinition>;
      optional: Record<string, PropDefinition>;
    };
    events: EventDefinition[];
    accessibility: AccessibilityRequirements;
    design_system: DesignSystemRequirements;
    states: StateDefinition[];
  };
  complianceRules: string[];
}

export interface PropDefinition {
  type: string;
  description: string;
  default?: any;
  validation?: string;
  examples?: any[];
}

export interface EventDefinition {
  name: string;
  description: string;
  payload: Record<string, string>;
  required?: boolean;
}

export interface AccessibilityRequirements {
  required: Record<string, string | boolean>;
  recommended?: Record<string, string | boolean>;
  wcag_level: 'A' | 'AA' | 'AAA';
}

export interface DesignSystemRequirements {
  tokens: string[];
  variants?: string[];
  sizes?: string[];
  themes?: string[];
}

export interface StateDefinition {
  name: string;
  description: string;
  triggers?: string[];
  visual_changes?: string[];
}

export interface ComponentImplementation {
  filePath: string;
  content: string;
  framework: 'react' | 'vue' | 'angular';
  language: 'typescript' | 'javascript';
  hasTypeDefinitions: boolean;
}

export class UIComponentComplianceChecker extends BaseComplianceChecker<UIComponentSpec, ComponentImplementation> {
  readonly artifactType: ArtifactType = 'ui';
  readonly supportedFrameworks = ['react', 'vue', 'angular'];

  getComplianceDimensions(): string[] {
    return [
      'props_compliance',
      'accessibility_compliance', 
      'design_system_compliance',
      'event_handling_compliance',
      'performance_compliance'
    ];
  }

  protected async evaluateComplianceDimensions(
    spec: UIComponentSpec, 
    implementation: ComponentImplementation, 
    context: ComplianceContext
  ): Promise<Record<string, ComplianceDimension>> {
    
    const dimensions: Record<string, ComplianceDimension> = {};

    // Props compliance (high weight - critical for component API)
    const propsIssues = await this.checkPropsCompliance(spec, implementation);
    dimensions.props_compliance = this.createDimension('Props Compliance', propsIssues, 2.0);

    // Accessibility compliance (high weight - critical for usability)
    const a11yIssues = await this.checkAccessibilityCompliance(spec, implementation);
    dimensions.accessibility_compliance = this.createDimension('Accessibility Compliance', a11yIssues, 2.0);

    // Design system compliance (medium weight - important for consistency)
    const designIssues = await this.checkDesignSystemCompliance(spec, implementation);
    dimensions.design_system_compliance = this.createDimension('Design System Compliance', designIssues, 1.5);

    // Event handling compliance (medium weight)
    const eventIssues = await this.checkEventHandlingCompliance(spec, implementation);
    dimensions.event_handling_compliance = this.createDimension('Event Handling Compliance', eventIssues, 1.0);

    // Performance compliance (lower weight - optimization)
    const performanceIssues = await this.checkPerformanceCompliance(spec, implementation);
    dimensions.performance_compliance = this.createDimension('Performance Compliance', performanceIssues, 0.5);

    return dimensions;
  }

  protected extractIdentifier(spec: UIComponentSpec): string {
    return spec.identifier;
  }

  canHandle(spec: any, implementation: any, context: ComplianceContext): boolean {
    return context.artifactType === 'ui' && 
           this.supportedFrameworks.includes(implementation?.framework);
  }

  private async checkPropsCompliance(
    spec: UIComponentSpec, 
    implementation: ComponentImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];
    
    // Check if component has TypeScript prop definitions
    if (implementation.language === 'typescript' && !this.hasPropsInterface(implementation)) {
      issues.push({
        type: 'MISSING_PROPS_INTERFACE',
        severity: 'error',
        message: 'Component missing TypeScript props interface',
        suggestion: 'Define a props interface with all required and optional properties',
        location: { file: implementation.filePath }
      });
    }

    // Check required props
    for (const [propName, propDef] of Object.entries(spec.specification.props.required)) {
      if (!this.hasPropDefinition(implementation, propName)) {
        issues.push({
          type: 'MISSING_REQUIRED_PROP',
          severity: 'error',
          message: `Missing required prop: ${propName}`,
          suggestion: `Add ${propName} prop with type ${propDef.type}`,
          location: { file: implementation.filePath }
        });
      } else if (!this.hasCorrectPropType(implementation, propName, propDef.type)) {
        issues.push({
          type: 'INCORRECT_PROP_TYPE',
          severity: 'error',
          message: `Prop ${propName} has incorrect type`,
          suggestion: `Change ${propName} prop type to ${propDef.type}`,
          location: { file: implementation.filePath }
        });
      }
    }

    // Check optional props have defaults
    for (const [propName, propDef] of Object.entries(spec.specification.props.optional)) {
      if (propDef.default !== undefined && !this.hasDefaultValue(implementation, propName)) {
        issues.push({
          type: 'MISSING_DEFAULT_VALUE',
          severity: 'warning',
          message: `Optional prop ${propName} missing default value`,
          suggestion: `Add default value: ${JSON.stringify(propDef.default)}`,
          location: { file: implementation.filePath }
        });
      }
    }

    return issues;
  }

  private async checkAccessibilityCompliance(
    spec: UIComponentSpec, 
    implementation: ComponentImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];
    const a11yReqs = spec.specification.accessibility;

    // Check required accessibility attributes
    for (const [attr, value] of Object.entries(a11yReqs.required)) {
      if (typeof value === 'boolean' && value) {
        if (!this.hasAccessibilityFeature(implementation, attr)) {
          issues.push({
            type: 'MISSING_ACCESSIBILITY_FEATURE',
            severity: 'error',
            message: `Missing required accessibility feature: ${attr}`,
            suggestion: this.getAccessibilitySuggestion(attr),
            location: { file: implementation.filePath }
          });
        }
      } else if (typeof value === 'string') {
        if (!this.hasAriaAttribute(implementation, attr, value)) {
          issues.push({
            type: 'MISSING_ARIA_ATTRIBUTE',
            severity: 'error',
            message: `Missing ARIA attribute: ${attr}`,
            suggestion: `Add ${attr}="${value}" to component`,
            location: { file: implementation.filePath }
          });
        }
      }
    }

    // Check for semantic HTML usage
    if (!this.usesSemanticHTML(implementation)) {
      issues.push({
        type: 'NON_SEMANTIC_HTML',
        severity: 'warning',
        message: 'Component should use semantic HTML elements',
        suggestion: 'Replace div/span with semantic elements like button, nav, main, etc.',
        location: { file: implementation.filePath }
      });
    }

    // Check for keyboard navigation support
    if (this.isInteractiveComponent(spec) && !this.hasKeyboardSupport(implementation)) {
      issues.push({
        type: 'MISSING_KEYBOARD_SUPPORT',
        severity: 'error',
        message: 'Interactive component missing keyboard navigation',
        suggestion: 'Add onKeyDown handler for Enter and Space keys',
        location: { file: implementation.filePath }
      });
    }

    return issues;
  }

  private async checkDesignSystemCompliance(
    spec: UIComponentSpec, 
    implementation: ComponentImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];
    const designReqs = spec.specification.design_system;

    // Check for design token usage
    for (const token of designReqs.tokens) {
      if (!this.usesDesignToken(implementation, token)) {
        issues.push({
          type: 'MISSING_DESIGN_TOKEN',
          severity: 'warning',
          message: `Component should use design token: ${token}`,
          suggestion: `Replace hardcoded values with ${token}`,
          location: { file: implementation.filePath }
        });
      }
    }

    // Check for hardcoded styles
    if (this.hasHardcodedStyles(implementation)) {
      issues.push({
        type: 'HARDCODED_STYLES',
        severity: 'warning',
        message: 'Component contains hardcoded style values',
        suggestion: 'Replace hardcoded values with design system tokens',
        location: { file: implementation.filePath }
      });
    }

    // Check variant implementation
    if (designReqs.variants && !this.implementsVariants(implementation, designReqs.variants)) {
      issues.push({
        type: 'MISSING_VARIANTS',
        severity: 'error',
        message: 'Component missing required variants',
        suggestion: `Implement variants: ${designReqs.variants.join(', ')}`,
        location: { file: implementation.filePath }
      });
    }

    return issues;
  }

  private async checkEventHandlingCompliance(
    spec: UIComponentSpec, 
    implementation: ComponentImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    for (const event of spec.specification.events) {
      if (event.required !== false && !this.hasEventHandler(implementation, event.name)) {
        issues.push({
          type: 'MISSING_EVENT_HANDLER',
          severity: event.required ? 'error' : 'warning',
          message: `Missing event handler: ${event.name}`,
          suggestion: `Add ${event.name} prop and call it when appropriate`,
          location: { file: implementation.filePath }
        });
      }

      // Check event payload structure
      if (this.hasEventHandler(implementation, event.name) && 
          !this.hasCorrectEventPayload(implementation, event.name, event.payload)) {
        issues.push({
          type: 'INCORRECT_EVENT_PAYLOAD',
          severity: 'warning',
          message: `Event ${event.name} has incorrect payload structure`,
          suggestion: `Ensure event payload matches: ${JSON.stringify(event.payload)}`,
          location: { file: implementation.filePath }
        });
      }
    }

    return issues;
  }

  private async checkPerformanceCompliance(
    spec: UIComponentSpec, 
    implementation: ComponentImplementation
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Check for React.memo usage (React components)
    if (implementation.framework === 'react' && !this.isMemoized(implementation)) {
      issues.push({
        type: 'NOT_MEMOIZED',
        severity: 'info',
        message: 'Component could benefit from memoization',
        suggestion: 'Wrap component with React.memo() for better performance',
        location: { file: implementation.filePath }
      });
    }

    // Check for unnecessary re-renders
    if (this.hasInlineObjectProps(implementation)) {
      issues.push({
        type: 'INLINE_OBJECT_PROPS',
        severity: 'warning',
        message: 'Component has inline object props that cause re-renders',
        suggestion: 'Move object props outside render or use useMemo',
        location: { file: implementation.filePath }
      });
    }

    // Check for large bundle impact
    if (this.hasLargeImports(implementation)) {
      issues.push({
        type: 'LARGE_IMPORTS',
        severity: 'info',
        message: 'Component imports large libraries',
        suggestion: 'Consider code splitting or lighter alternatives',
        location: { file: implementation.filePath }
      });
    }

    return issues;
  }

  // Helper methods for code analysis
  private hasPropsInterface(implementation: ComponentImplementation): boolean {
    return implementation.content.includes('interface') && 
           implementation.content.includes('Props');
  }

  private hasPropDefinition(implementation: ComponentImplementation, propName: string): boolean {
    // Simple regex check - in production, use AST parsing
    const propPattern = new RegExp(`\\b${propName}\\b.*:`, 'g');
    return propPattern.test(implementation.content);
  }

  private hasCorrectPropType(implementation: ComponentImplementation, propName: string, expectedType: string): boolean {
    // Simplified type checking - use TypeScript compiler API in production
    const typePattern = new RegExp(`${propName}\\s*:\\s*${expectedType}`, 'g');
    return typePattern.test(implementation.content);
  }

  private hasDefaultValue(implementation: ComponentImplementation, propName: string): boolean {
    const defaultPattern = new RegExp(`${propName}\\s*=`, 'g');
    return defaultPattern.test(implementation.content);
  }

  private hasAccessibilityFeature(implementation: ComponentImplementation, feature: string): boolean {
    switch (feature) {
      case 'keyboard-navigation':
        return implementation.content.includes('onKeyDown') || 
               implementation.content.includes('onKeyPress');
      case 'focus-management':
        return implementation.content.includes('focus') || 
               implementation.content.includes('tabIndex');
      default:
        return implementation.content.includes(feature);
    }
  }

  private hasAriaAttribute(implementation: ComponentImplementation, attr: string, value: string): boolean {
    const ariaPattern = new RegExp(`${attr}=["']${value}["']`, 'g');
    return ariaPattern.test(implementation.content);
  }

  private usesSemanticHTML(implementation: ComponentImplementation): boolean {
    const semanticElements = ['button', 'nav', 'main', 'section', 'article', 'header', 'footer'];
    return semanticElements.some(element => 
      implementation.content.includes(`<${element}`) || 
      implementation.content.includes(`"${element}"`)
    );
  }

  private isInteractiveComponent(spec: UIComponentSpec): boolean {
    return spec.specification.events.some(event => 
      event.name.includes('click') || 
      event.name.includes('change') || 
      event.name.includes('submit')
    );
  }

  private hasKeyboardSupport(implementation: ComponentImplementation): boolean {
    return implementation.content.includes('onKeyDown') || 
           implementation.content.includes('onKeyPress') ||
           implementation.content.includes('onKeyUp');
  }

  private usesDesignToken(implementation: ComponentImplementation, token: string): boolean {
    return implementation.content.includes(token);
  }

  private hasHardcodedStyles(implementation: ComponentImplementation): boolean {
    // Look for hardcoded colors, sizes, etc.
    const hardcodedPatterns = [
      /#[0-9a-fA-F]{3,6}/, // hex colors
      /rgb\(/, // rgb colors
      /\d+px/, // pixel values
      /\d+rem/, // rem values without variables
    ];
    
    return hardcodedPatterns.some(pattern => pattern.test(implementation.content));
  }

  private implementsVariants(implementation: ComponentImplementation, variants: string[]): boolean {
    return variants.every(variant => 
      implementation.content.includes(variant) || 
      implementation.content.includes(`variant="${variant}"`)
    );
  }

  private hasEventHandler(implementation: ComponentImplementation, eventName: string): boolean {
    return implementation.content.includes(eventName);
  }

  private hasCorrectEventPayload(implementation: ComponentImplementation, eventName: string, payload: Record<string, string>): boolean {
    // Simplified check - in production, analyze the actual event call
    return Object.keys(payload).every(key => 
      implementation.content.includes(key)
    );
  }

  private isMemoized(implementation: ComponentImplementation): boolean {
    return implementation.content.includes('React.memo') || 
           implementation.content.includes('memo(');
  }

  private hasInlineObjectProps(implementation: ComponentImplementation): boolean {
    // Look for inline objects in JSX
    return /\w+\s*=\s*\{/.test(implementation.content);
  }

  private hasLargeImports(implementation: ComponentImplementation): boolean {
    const largeLibraries = ['lodash', 'moment', 'antd'];
    return largeLibraries.some(lib => 
      implementation.content.includes(`from '${lib}'`) ||
      implementation.content.includes(`import '${lib}'`)
    );
  }

  private getAccessibilitySuggestion(feature: string): string {
    const suggestions: Record<string, string> = {
      'keyboard-navigation': 'Add onKeyDown handler to support Enter and Space keys',
      'focus-management': 'Add tabIndex and focus management for keyboard users',
      'aria-label': 'Add descriptive aria-label for screen readers',
      'role': 'Add appropriate ARIA role attribute',
    };
    
    return suggestions[feature] || `Implement accessibility feature: ${feature}`;
  }

  protected isAutoFixable(issueType: string): boolean {
    const autoFixableTypes = [
      'MISSING_DEFAULT_VALUE',
      'MISSING_ARIA_ATTRIBUTE',
      'NOT_MEMOIZED'
    ];
    return autoFixableTypes.includes(issueType);
  }

  generateSuggestions(issues: ComplianceIssue[], context: ComplianceContext): ComplianceSuggestion[] {
    const suggestions = super.generateSuggestions(issues, context);
    
    // Add UI-specific code suggestions
    return suggestions.map(suggestion => {
      if (suggestion.type === 'MISSING_PROPS_INTERFACE') {
        suggestion.code = this.generatePropsInterfaceCode(context);
      } else if (suggestion.type === 'MISSING_ARIA_ATTRIBUTE') {
        suggestion.code = this.generateAriaAttributeCode(suggestion.description);
      } else if (suggestion.type === 'NOT_MEMOIZED') {
        suggestion.code = 'export default React.memo(YourComponent);';
      }
      
      return suggestion;
    });
  }

  private generatePropsInterfaceCode(context: ComplianceContext): string {
    return `interface Props {
  // Add your prop definitions here
  // Example:
  // title: string;
  // onClick?: () => void;
  // disabled?: boolean;
}`;
  }

  private generateAriaAttributeCode(description: string): string {
    // Extract attribute from description
    const match = description.match(/Add (\w+)="([^"]+)"/);
    if (match) {
      return `${match[1]}="${match[2]}"`;
    }
    return '// Add appropriate ARIA attribute';
  }
} 