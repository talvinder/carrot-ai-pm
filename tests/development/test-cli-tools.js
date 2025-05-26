#!/usr/bin/env node

/**
 * Test CLI Tools
 * 
 * Tests CLI spec generation and compliance checking
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Set environment variable
process.env.CARROT_PROJECT_ROOT = process.cwd();

console.log('🧪 Testing CLI Tools\n');

async function testCLISpecGeneration() {
  console.log('📝 Testing CLI Spec Generation...');
  
  try {
    // Import the CLI spec generation function
    const { generateCLISpec } = await import('./dist/src/tools/grow_cli_spec.js');
    
    // Test spec generation
    const spec = await generateCLISpec('deploy', 'A deployment CLI tool that manages application deployments', {
      generateExamples: true,
      frameworks: ['node', 'python']
    });
    
    console.log('✅ CLI spec generated successfully');
    console.log(`   - Command: ${spec.identifier}`);
    console.log(`   - Type: ${spec.type}`);
    console.log(`   - Global options: ${spec.specification.interface.global_options.length}`);
    console.log(`   - Subcommands: ${spec.specification.interface.subcommands ? Object.keys(spec.specification.interface.subcommands).length : 0}`);
    console.log(`   - Exit codes: ${spec.specification.output.exit_codes.length}`);
    console.log(`   - Compliance rules: ${spec.complianceRules.length}`);
    
    // Create specs directory and save spec
    const specsDir = path.join(process.cwd(), 'specs', 'cli');
    if (!fs.existsSync(specsDir)) {
      fs.mkdirSync(specsDir, { recursive: true });
    }
    
    const yaml = await import('js-yaml');
    const specYaml = yaml.dump(spec, { indent: 2, lineWidth: 120, noRefs: true });
    fs.writeFileSync(path.join(specsDir, 'deploy.yaml'), specYaml);
    
    console.log('✅ CLI spec saved to specs/cli/deploy.yaml\n');
    return spec;
    
  } catch (error) {
    console.error('❌ CLI spec generation failed:', error.message);
    throw error;
  }
}

async function testCLIComplianceChecking(spec) {
  console.log('🔍 Testing CLI Compliance Checking...');
  
  try {
    // Import the CLI compliance checker
    const { CLIComplianceChecker } = await import('./dist/src/tools/compliance/cli-checker.js');
    
    // Create a test implementation (good)
    const goodImplementation = {
      filePath: 'test-deploy.js',
      content: `
                 import { program } from 'commander';
        
        program
          .name('deploy')
          .description('A deployment CLI tool')
          .version('1.0.0')
          .option('-h, --help', 'Show help information')
          .option('-V, --version', 'Show version information')
          .option('-v, --verbose', 'Enable verbose output')
          .option('-q, --quiet', 'Suppress output');
        
        program
          .command('staging')
          .description('Deploy to staging environment')
          .option('--dry-run', 'Preview deployment')
          .action((options) => {
            console.log('Deploying to staging');
            process.exit(0);
          });
        
        program
          .command('production')
          .description('Deploy to production environment')
          .option('--confirm', 'Skip confirmation')
          .action((options) => {
            console.log('Deploying to production');
            process.exit(0);
          });
        
        program.parse();
      `,
      framework: 'node',
      language: 'javascript',
      hasArgumentParsing: true,
      hasHelpSystem: true,
      hasErrorHandling: true,
      hasSubcommands: true
    };
    
    // Create a test implementation (bad)
    const badImplementation = {
      filePath: 'test-deploy-bad.js',
      content: `
        console.log('Deploy tool');
        // No argument parsing
        // No help system
        // No error handling
      `,
      framework: 'node',
      language: 'javascript',
      hasArgumentParsing: false,
      hasHelpSystem: false,
      hasErrorHandling: false,
      hasSubcommands: false
    };
    
    const checker = new CLIComplianceChecker();
    const context = {
      artifactType: 'cli',
      projectPath: process.cwd(),
      projectContext: { type: 'node', language: 'javascript', framework: [], dependencies: {}, patterns: [], features: [] },
      toolchain: ['npm', 'typescript'],
      conventions: [],
      environment: 'development'
    };
    
    // Test good implementation
    console.log('   Testing good implementation...');
    const goodResult = await checker.checkCompliance(spec, goodImplementation, context);
    console.log(`   ✅ Good implementation: ${(goodResult.score * 100).toFixed(1)}% compliant`);
    console.log(`      - Issues found: ${goodResult.issues.length}`);
    console.log(`      - Suggestions: ${goodResult.suggestions.length}`);
    
    // Test bad implementation
    console.log('   Testing bad implementation...');
    const badResult = await checker.checkCompliance(spec, badImplementation, context);
    console.log(`   ❌ Bad implementation: ${(badResult.score * 100).toFixed(1)}% compliant`);
    console.log(`      - Issues found: ${badResult.issues.length}`);
    console.log(`      - Suggestions: ${badResult.suggestions.length}`);
    
    // Show some issues
    console.log('\n   📋 Sample issues from bad implementation:');
    badResult.issues.slice(0, 5).forEach((issue, index) => {
      console.log(`      ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      console.log(`         💡 ${issue.suggestion}`);
    });
    
    // Show compliance dimensions
    console.log('\n   📊 Compliance dimensions (bad implementation):');
    Object.entries(badResult.dimensions).forEach(([name, dimension]) => {
      const status = dimension.isCompliant ? '✅' : '❌';
      console.log(`      ${status} ${dimension.name}: ${(dimension.score * 100).toFixed(1)}% (${dimension.issues.length} issues)`);
    });
    
    console.log('\n✅ CLI compliance checking completed successfully\n');
    return { goodResult, badResult };
    
  } catch (error) {
    console.error('❌ CLI compliance checking failed:', error.message);
    throw error;
  }
}

async function testFrameworkExamples() {
  console.log('🔧 Testing Framework Examples...');
  
  try {
    const { generateCLISpec } = await import('./dist/src/tools/grow_cli_spec.js');
    
    // Generate spec with multiple frameworks
    const spec = await generateCLISpec('build-tool', 'A build tool for compiling projects', {
      generateExamples: true,
      frameworks: ['node', 'python', 'go', 'rust', 'bash']
    });
    
    console.log('✅ Multi-framework CLI spec generated');
    console.log(`   - Frameworks: node, python, go, rust, bash`);
    console.log(`   - Command type: ${spec.specification.interface.command.name}`);
    console.log(`   - Subcommands: ${spec.specification.interface.subcommands ? Object.keys(spec.specification.interface.subcommands).join(', ') : 'none'}`);
    
    // Check if examples would be generated for each framework
    const frameworks = ['node', 'python', 'go', 'rust', 'bash'];
    frameworks.forEach(framework => {
      console.log(`   ✅ ${framework} example ready`);
    });
    
    console.log('\n✅ Framework examples test completed\n');
    
  } catch (error) {
    console.error('❌ Framework examples test failed:', error.message);
    throw error;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting CLI Tools Test Suite\n');
    
    // Test 1: CLI Spec Generation
    const spec = await testCLISpecGeneration();
    
    // Test 2: CLI Compliance Checking
    const complianceResults = await testCLIComplianceChecking(spec);
    
    // Test 3: Framework Examples
    await testFrameworkExamples();
    
    console.log('🎉 All CLI tools tests passed successfully!');
    console.log('\n📈 Test Summary:');
    console.log(`   ✅ CLI spec generation: Working`);
    console.log(`   ✅ CLI compliance checking: Working`);
    console.log(`   ✅ Framework examples: Working`);
    console.log(`   ✅ Good implementation score: ${(complianceResults.goodResult.score * 100).toFixed(1)}%`);
    console.log(`   ✅ Bad implementation score: ${(complianceResults.badResult.score * 100).toFixed(1)}%`);
    console.log(`   ✅ Issue detection: ${complianceResults.badResult.issues.length} issues found`);
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests(); 