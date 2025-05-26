import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * UI Component Spec Generation Tool
 * 
 * Creates comprehensive UI component specifications that can be validated
 * by the UI compliance checker. Supports React, Vue, and Angular components.
 */

export function growUISpecTool(server: McpServer, repoRoot: string): void {
  console.log('Initializing grow_ui_spec tool with repo root:', repoRoot);
  
  server.tool(
    'grow_ui_spec',
    {
      componentName: z.string().min(1).describe('The name of the UI component (e.g., "AddToCartButton", "UserProfile")'),
      summary: z.string().min(1).describe('A brief description of what this component does'),
      generateExamples: z.boolean().optional().describe('Whether to generate framework-specific implementation examples (defaults to true)'),
      exampleFrameworks: z.array(z.enum(['react', 'vue', 'angular', 'svelte', 'web-components'])).optional().describe('Frameworks to generate examples for (defaults to ["react"])'),
      projectDir: z.string().optional().describe('Target project directory where specs should be generated. If not provided, will use current directory.')
    },
    async ({ componentName, summary, generateExamples = true, exampleFrameworks = ['react'], projectDir }) => {
      try {
        console.log(`grow_ui_spec tool called with component: ${componentName}, examples: ${generateExamples ? exampleFrameworks.join(', ') : 'none'}`);
        
        const baseDir = repoRoot;
        const targetDir = projectDir ? 
          (path.isAbsolute(projectDir) ? 
            (projectDir.startsWith('/Users') || projectDir.startsWith('/home') ? projectDir : path.join(baseDir, projectDir)) :
            path.resolve(baseDir, projectDir)
          ) : 
          baseDir;

        // Safety checks
        if (targetDir === '/' || 
            targetDir.startsWith('/usr') || 
            targetDir.startsWith('/etc') || 
            targetDir.startsWith('/var') || 
            targetDir.startsWith('/tmp')) {
          throw new Error(`Cannot write to system directory: ${targetDir}`);
        }

        // Ensure UI specs directory exists
        const uiSpecsDir = path.join(targetDir, 'specs', 'ui');
        if (!fs.existsSync(uiSpecsDir)) {
          console.log(`Creating UI specs directory ${uiSpecsDir}...`);
          fs.mkdirSync(uiSpecsDir, { recursive: true });
        }

        // Generate the framework-neutral UI component specification
        const uiSpec = generateUIComponentSpec(componentName, summary);
        
        // Create filename based on component name
        const filename = `${componentName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}.yaml`;
        const specFilePath = path.join(uiSpecsDir, filename);
        
        // Write the specification file
        const yamlContent = yaml.dump(uiSpec, { 
          indent: 2, 
          lineWidth: 120,
          noRefs: true 
        });
        
        fs.writeFileSync(specFilePath, yamlContent, 'utf8');
        
        const createdFiles = [`Spec: ${path.relative(baseDir, specFilePath)}`];
        
        // Generate framework-specific example implementations if requested
        if (generateExamples) {
          const exampleDir = path.join(uiSpecsDir, 'examples');
          if (!fs.existsSync(exampleDir)) {
            fs.mkdirSync(exampleDir, { recursive: true });
          }
          
          for (const framework of exampleFrameworks) {
            const exampleImplementation = generateExampleImplementation(componentName, framework, uiSpec);
            const exampleExtension = getFileExtension(framework);
            const exampleFilePath = path.join(exampleDir, `${componentName}.${framework}.${exampleExtension}`);
            fs.writeFileSync(exampleFilePath, exampleImplementation, 'utf8');
            createdFiles.push(`${framework} example: ${path.relative(baseDir, exampleFilePath)}`);
          }
        }
        
        return {
          content: [
            { 
              type: 'text', 
              text: `UI component specification created successfully!\n\nFiles created:\n${createdFiles.map(f => `- ${f}`).join('\n')}\n\nComponent: ${componentName}\nSummary: ${summary}` 
            }
          ]
        };
        
      } catch (error: any) {
        console.error('Error in grow_ui_spec tool:', error);
        return {
          content: [
            { 
              type: 'text', 
              text: `Error creating UI component specification: ${error.message}` 
            }
          ],
          isError: true
        };
      }
    }
  );
}

function generateUIComponentSpec(componentName: string, summary: string): any {
  // Analyze component name to infer functionality
  const componentAnalysis = analyzeComponentName(componentName, summary);
  
  return {
    type: 'ui',
    identifier: componentName,
    summary: summary,
    specification: {
      // Framework-neutral component definition
      interface: {
        props: {
          required: componentAnalysis.requiredProps,
          optional: componentAnalysis.optionalProps
        },
        events: componentAnalysis.events,
        slots: componentAnalysis.slots || []
      },
      behavior: {
        states: componentAnalysis.states,
        interactions: componentAnalysis.interactions || []
      },
      accessibility: componentAnalysis.accessibility,
      design_system: componentAnalysis.designSystem,
      performance: componentAnalysis.performance || {}
    },
    complianceRules: [
      'All required props must be defined with appropriate types for the target framework',
      'Component must implement all specified event handlers',
      'Accessibility requirements must be met according to WCAG 2.1 AA standards',
      'Design system tokens must be used instead of hardcoded values',
      'Component must handle all defined states appropriately',
      'Component should follow framework-specific best practices for performance'
    ]
  };
}

function getFileExtension(framework: string): string {
  switch (framework) {
    case 'react': return 'tsx';
    case 'vue': return 'vue';
    case 'angular': return 'ts';
    case 'svelte': return 'svelte';
    case 'web-components': return 'js';
    default: return 'js';
  }
}

function analyzeComponentName(componentName: string, summary: string): any {
  const lowerName = componentName.toLowerCase();
  const lowerSummary = summary.toLowerCase();
  
  // Determine component category
  let category = 'generic';
  if (lowerName.includes('button') || lowerSummary.includes('button') || lowerSummary.includes('click')) {
    category = 'button';
  } else if (lowerName.includes('input') || lowerName.includes('field') || lowerSummary.includes('input')) {
    category = 'input';
  } else if (lowerName.includes('modal') || lowerName.includes('dialog') || lowerSummary.includes('modal')) {
    category = 'modal';
  } else if (lowerName.includes('card') || lowerSummary.includes('card')) {
    category = 'card';
  } else if (lowerName.includes('list') || lowerName.includes('table') || lowerSummary.includes('list')) {
    category = 'list';
  } else if (lowerName.includes('nav') || lowerName.includes('menu') || lowerSummary.includes('navigation')) {
    category = 'navigation';
  }
  
  return generateComponentTemplate(category, componentName, summary);
}

function generateComponentTemplate(category: string, componentName: string, summary: string): any {
  const templates = {
    button: {
      requiredProps: {
        children: {
          type: 'string | Element | Component',
          description: 'Button content (text or elements)',
          examples: ['Save', 'Add to Cart', '<Icon />'],
          frameworkTypes: {
            react: 'React.ReactNode | string',
            vue: 'string | VNode | VNode[]',
            angular: 'string | TemplateRef<any>',
            svelte: 'string | Snippet',
            'web-components': 'string | HTMLElement'
          }
        },
        onClick: {
          type: 'EventHandler<ClickEvent>',
          description: 'Click event handler',
          examples: ['() => handleSave()', '(e) => onSubmit(e)'],
          frameworkTypes: {
            react: '(event: MouseEvent) => void',
            vue: '(event: MouseEvent) => void',
            angular: '(event: MouseEvent) => void',
            svelte: '(event: MouseEvent) => void',
            'web-components': '(event: MouseEvent) => void'
          }
        }
      },
      optionalProps: {
        variant: {
          type: "'primary' | 'secondary' | 'danger' | 'ghost'",
          description: 'Visual style variant',
          default: 'primary',
          examples: ['primary', 'secondary', 'danger']
        },
        size: {
          type: "'small' | 'medium' | 'large'",
          description: 'Button size',
          default: 'medium',
          examples: ['small', 'medium', 'large']
        },
        disabled: {
          type: 'boolean',
          description: 'Whether the button is disabled',
          default: false,
          examples: [true, false]
        },
        loading: {
          type: 'boolean',
          description: 'Whether the button is in loading state',
          default: false,
          examples: [true, false]
        },
        ariaLabel: {
          type: 'string',
          description: 'Accessible label for screen readers',
          examples: ['Save document', 'Add item to shopping cart']
        }
      },
      events: [
        {
          name: 'onClick',
          description: 'Fired when button is clicked',
          payload: {
            event: 'MouseEvent',
            target: 'HTMLButtonElement'
          },
          required: true
        },
        {
          name: 'onFocus',
          description: 'Fired when button receives focus',
          payload: {
            event: 'FocusEvent',
            target: 'HTMLButtonElement'
          },
          required: false
        },
        {
          name: 'onBlur',
          description: 'Fired when button loses focus',
          payload: {
            event: 'FocusEvent',
            target: 'HTMLButtonElement'
          },
          required: false
        }
      ],
      accessibility: {
        required: {
          'aria-label': 'Descriptive label when button content is not self-explanatory',
          'role': 'button',
          'tabindex': '0 for focusable buttons',
          'keyboard-support': 'Enter and Space key activation'
        },
        recommended: {
          'aria-describedby': 'Reference to additional description if needed',
          'aria-pressed': 'For toggle buttons to indicate state'
        },
        wcag_level: 'AA'
      },
      designSystem: {
        tokens: [
          'color.button.primary.background',
          'color.button.primary.text',
          'color.button.primary.border',
          'spacing.button.padding.horizontal',
          'spacing.button.padding.vertical',
          'typography.button.font.size',
          'typography.button.font.weight',
          'border.button.radius',
          'shadow.button.elevation'
        ],
        variants: ['primary', 'secondary', 'danger', 'ghost'],
        sizes: ['small', 'medium', 'large'],
        themes: ['light', 'dark']
      },
      states: [
        {
          name: 'default',
          description: 'Normal interactive state',
          triggers: ['component mount', 'reset'],
          visual_changes: ['default styling applied']
        },
        {
          name: 'hover',
          description: 'Mouse hover state',
          triggers: ['mouseenter'],
          visual_changes: ['background color change', 'elevation increase']
        },
        {
          name: 'active',
          description: 'Pressed/clicked state',
          triggers: ['mousedown', 'keydown (Enter/Space)'],
          visual_changes: ['pressed appearance', 'slight scale reduction']
        },
        {
          name: 'focus',
          description: 'Keyboard focus state',
          triggers: ['tab navigation', 'programmatic focus'],
          visual_changes: ['focus ring visible', 'outline applied']
        },
        {
          name: 'disabled',
          description: 'Non-interactive disabled state',
          triggers: ['disabled prop set to true'],
          visual_changes: ['reduced opacity', 'cursor not-allowed', 'no hover effects']
        },
        {
          name: 'loading',
          description: 'Processing/loading state',
          triggers: ['loading prop set to true'],
          visual_changes: ['spinner visible', 'text hidden or changed', 'disabled interaction']
        }
      ]
    },
    
    input: {
      requiredProps: {
        value: {
          type: 'string',
          description: 'Current input value',
          examples: ['', 'user@example.com', 'John Doe']
        },
        onChange: {
          type: '(value: string, event: ChangeEvent) => void',
          description: 'Value change handler',
          examples: ['(val) => setValue(val)', '(val, e) => handleChange(val, e)']
        }
      },
      optionalProps: {
        placeholder: {
          type: 'string',
          description: 'Placeholder text',
          examples: ['Enter your email', 'Search...']
        },
        type: {
          type: "'text' | 'email' | 'password' | 'number' | 'tel' | 'url'",
          description: 'Input type',
          default: 'text',
          examples: ['text', 'email', 'password']
        },
        disabled: {
          type: 'boolean',
          description: 'Whether input is disabled',
          default: false
        },
        required: {
          type: 'boolean',
          description: 'Whether input is required',
          default: false
        },
        error: {
          type: 'string',
          description: 'Error message to display',
          examples: ['Email is required', 'Invalid format']
        },
        label: {
          type: 'string',
          description: 'Input label',
          examples: ['Email Address', 'Full Name']
        }
      },
      events: [
        {
          name: 'onChange',
          description: 'Fired when input value changes',
          payload: {
            value: 'string',
            event: 'ChangeEvent<HTMLInputElement>'
          },
          required: true
        },
        {
          name: 'onFocus',
          description: 'Fired when input receives focus',
          payload: {
            event: 'FocusEvent<HTMLInputElement>'
          }
        },
        {
          name: 'onBlur',
          description: 'Fired when input loses focus',
          payload: {
            event: 'FocusEvent<HTMLInputElement>'
          }
        }
      ],
      accessibility: {
        required: {
          'aria-label': 'Label when no visible label present',
          'aria-required': 'true for required fields',
          'aria-invalid': 'true when field has validation errors',
          'aria-describedby': 'Reference to error message or help text'
        },
        wcag_level: 'AA'
      },
      designSystem: {
        tokens: [
          'color.input.background',
          'color.input.border',
          'color.input.text',
          'color.input.placeholder',
          'spacing.input.padding',
          'border.input.radius',
          'border.input.width'
        ]
      },
      states: [
        {
          name: 'default',
          description: 'Normal input state'
        },
        {
          name: 'focus',
          description: 'Input has focus',
          visual_changes: ['border color change', 'focus ring']
        },
        {
          name: 'error',
          description: 'Input has validation error',
          visual_changes: ['red border', 'error message visible']
        },
        {
          name: 'disabled',
          description: 'Input is disabled',
          visual_changes: ['reduced opacity', 'no interaction']
        }
      ]
    },
    
    generic: {
      requiredProps: {
        children: {
          type: 'React.ReactNode',
          description: 'Component content',
          examples: ['<div>Content</div>', 'Text content']
        }
      },
      optionalProps: {
        className: {
          type: 'string',
          description: 'Additional CSS classes',
          examples: ['custom-style', 'mb-4 text-center']
        },
        id: {
          type: 'string',
          description: 'Unique identifier',
          examples: ['user-profile', 'main-content']
        }
      },
      events: [],
      accessibility: {
        required: {
          'semantic-html': 'Use appropriate HTML elements',
          'keyboard-navigation': 'Support keyboard interaction where applicable'
        },
        wcag_level: 'AA'
      },
      designSystem: {
        tokens: [
          'color.text.primary',
          'color.background.default',
          'spacing.component.margin',
          'spacing.component.padding'
        ]
      },
      states: [
        {
          name: 'default',
          description: 'Normal component state'
        }
      ]
    }
  };
  
  return templates[category as keyof typeof templates] || templates.generic;
}

function generateExampleImplementation(componentName: string, framework: string, spec: any): string {
  switch (framework) {
    case 'react':
      return generateReactExample(componentName, spec);
    case 'vue':
      return generateVueExample(componentName, spec);
    case 'angular':
      return generateAngularExample(componentName, spec);
    case 'svelte':
      return generateSvelteExample(componentName, spec);
    case 'web-components':
      return generateWebComponentExample(componentName, spec);
    default:
      return generateReactExample(componentName, spec);
  }
}

function generateReactExample(componentName: string, spec: any): string {
  const requiredProps = spec.specification.interface.props.required;
  const optionalProps = spec.specification.interface.props.optional;
  
  // Generate TypeScript interface
  const propsInterface = generatePropsInterface(componentName, requiredProps, optionalProps);
  
  // Generate component implementation
  const componentImpl = generateReactComponent(componentName, requiredProps, optionalProps, spec);
  
  return `${propsInterface}

${componentImpl}

export default ${componentName};`;
}

function generatePropsInterface(componentName: string, requiredProps: any, optionalProps: any): string {
  const interfaceName = `${componentName}Props`;
  let interfaceContent = `interface ${interfaceName} {\n`;
  
  // Add required props
  for (const [propName, propDef] of Object.entries(requiredProps)) {
    const propType = (propDef as any).frameworkTypes?.react || (propDef as any).type;
    interfaceContent += `  ${propName}: ${propType};\n`;
  }
  
  // Add optional props
  for (const [propName, propDef] of Object.entries(optionalProps)) {
    const propType = (propDef as any).frameworkTypes?.react || (propDef as any).type;
    interfaceContent += `  ${propName}?: ${propType};\n`;
  }
  
  interfaceContent += `}`;
  
  return interfaceContent;
}

function generateReactComponent(componentName: string, requiredProps: any, optionalProps: any, spec: any): string {
  const propsInterface = `${componentName}Props`;
  
  // Generate default props
  const defaultProps = Object.entries(optionalProps)
    .filter(([_, propDef]) => (propDef as any).default !== undefined)
    .map(([propName, propDef]) => `  ${propName} = ${JSON.stringify((propDef as any).default)}`)
    .join(',\n');
  
  // Generate component body based on category
  let componentBody = '';
  const lowerName = componentName.toLowerCase();
  
  if (lowerName.includes('button')) {
    componentBody = `  return (
    <button
      className={\`btn btn-\${variant} btn-\${size}\`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      type="button"
    >
      {loading ? <span className="spinner" /> : children}
    </button>
  );`;
  } else if (lowerName.includes('input')) {
    componentBody = `  return (
    <div className="input-wrapper">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value, e)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? \`\${id}-error\` : undefined}
        className={\`input \${error ? 'input-error' : ''}\`}
      />
      {error && <span id={\`\${id}-error\`} className="error-message">{error}</span>}
    </div>
  );`;
  } else {
    componentBody = `  return (
    <div className={className} id={id}>
      {children}
    </div>
  );`;
  }
  
  return `const ${componentName}: React.FC<${propsInterface}> = ({
${Object.keys(requiredProps).concat(Object.keys(optionalProps)).map(prop => `  ${prop}`).join(',\n')}${defaultProps ? ',\n' + defaultProps : ''}
}) => {
${componentBody}
};`;
}

function generateVueExample(componentName: string, spec: any): string {
  // Basic Vue 3 Composition API example
  return `<template>
  <div class="${componentName.toLowerCase()}">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Define props based on spec
}

const props = defineProps<Props>();
const emit = defineEmits<{
  // Define events based on spec
}>();
</script>

<style scoped>
.${componentName.toLowerCase()} {
  /* Component styles using design tokens */
}
</style>`;
}

function generateAngularExample(componentName: string, spec: any): string {
  return `import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-${componentName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}',
  template: \`
    <div class="${componentName.toLowerCase()}">
      <ng-content></ng-content>
    </div>
  \`,
  styleUrls: ['./${componentName.toLowerCase()}.component.css']
})
export class ${componentName}Component {
  // Define inputs and outputs based on spec
}`;
}

function generateSvelteExample(componentName: string, spec: any): string {
  const requiredProps = spec.specification.interface.props.required;
  const optionalProps = spec.specification.interface.props.optional;
  
  // Generate props declarations
  let propsDeclarations = '';
  for (const [propName, propDef] of Object.entries(requiredProps)) {
    const propType = (propDef as any).frameworkTypes?.svelte || (propDef as any).type;
    propsDeclarations += `  export let ${propName}: ${propType};\n`;
  }
  for (const [propName, propDef] of Object.entries(optionalProps)) {
    const propType = (propDef as any).frameworkTypes?.svelte || (propDef as any).type;
    const defaultValue = (propDef as any).default ? JSON.stringify((propDef as any).default) : 'undefined';
    propsDeclarations += `  export let ${propName}: ${propType} = ${defaultValue};\n`;
  }
  
  return `<script lang="ts">
  // Define props based on spec
${propsDeclarations}
</script>

<!-- Component template based on spec -->
<div class="${componentName.toLowerCase()}">
  <slot />
</div>

<style>
  .${componentName.toLowerCase()} {
    /* Component styles using design tokens */
  }
</style>`;
}

function generateWebComponentExample(componentName: string, spec: any): string {
  const tagName = componentName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
  
  return `class ${componentName} extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'size', 'disabled', 'loading', 'aria-label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const variant = this.getAttribute('variant') || 'primary';
    const size = this.getAttribute('size') || 'medium';
    const disabled = this.hasAttribute('disabled');
    const loading = this.hasAttribute('loading');
    const ariaLabel = this.getAttribute('aria-label') || '';

    this.shadowRoot.innerHTML = \`
      <style>
        :host {
          display: inline-block;
        }
        .btn {
          /* Component styles using design tokens */
        }
      </style>
      <button 
        class="btn btn-\${variant} btn-\${size}"
        \${disabled ? 'disabled' : ''}
        aria-label="\${ariaLabel}"
        type="button"
      >
        \${loading ? '<span class="spinner"></span>' : '<slot></slot>'}
      </button>
    \`;

    // Add click event listener
    const button = this.shadowRoot.querySelector('button');
    button.addEventListener('click', (event) => {
      this.dispatchEvent(new CustomEvent('click', { 
        detail: event,
        bubbles: true 
      }));
    });
  }
}

customElements.define('${tagName}', ${componentName});`;
} 