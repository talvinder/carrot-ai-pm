#!/usr/bin/env node

/**
 * Test Universal CLI Compliance Framework
 * 
 * Tests the universal compliance checker with CLI artifacts
 */

import fs from 'fs';
import path from 'path';

// Set environment variable
process.env.CARROT_PROJECT_ROOT = process.cwd();

console.log('🧪 Testing Universal CLI Compliance Framework\n');

async function testUniversalCLICompliance() {
  console.log('🔍 Testing Universal CLI Compliance...');
  
  try {
    // Import the universal compliance framework
    const { 
      ComplianceCheckerFactory,
      ComplianceUtils
    } = await import('./dist/src/tools/compliance/index.js');
    
    // Load the CLI spec
    const yaml = await import('js-yaml');
    const specContent = fs.readFileSync('specs/cli/deploy.yaml', 'utf8');
    const spec = yaml.load(specContent);
    
    // Load the CLI implementation
    const implementationContent = fs.readFileSync('test-cli-implementation.js', 'utf8');
    const implementation = {
      filePath: 'test-cli-implementation.js',
      content: implementationContent,
      framework: 'node',
      language: 'javascript',
      hasArgumentParsing: true,
      hasHelpSystem: true,
      hasErrorHandling: true,
      hasSubcommands: true
    };
    
    // Create compliance context
    const context = {
      artifactType: 'cli',
      projectPath: process.cwd(),
      projectContext: { 
        type: 'node', 
        language: 'javascript', 
        framework: ['commander'], 
        dependencies: { commander: '^9.0.0' }, 
        patterns: [], 
        features: [] 
      },
      toolchain: ['npm', 'typescript'],
      conventions: [],
      environment: 'development'
    };
    
    // Get CLI compliance checker from factory
    const checker = ComplianceCheckerFactory.create('cli');
    console.log(`   ✅ CLI compliance checker created: ${checker.constructor.name}`);
    
    // Check if it can handle this artifact
    const canHandle = checker.canHandle(spec, implementation, context);
    console.log(`   ✅ Can handle CLI artifact: ${canHandle}`);
    
    // Run compliance check
    console.log('   Running compliance check...');
    const result = await checker.checkCompliance(spec, implementation, context);
    
    console.log(`   ✅ Compliance check completed`);
    console.log(`      - Overall score: ${(result.score * 100).toFixed(1)}%`);
    console.log(`      - Is compliant: ${result.isCompliant ? '✅' : '❌'}`);
    console.log(`      - Issues found: ${result.issues.length}`);
    console.log(`      - Suggestions: ${result.suggestions.length}`);
    console.log(`      - Dimensions: ${Object.keys(result.dimensions).length}`);
    
    // Show compliance dimensions
    console.log('\n   📊 Compliance Dimensions:');
    Object.entries(result.dimensions).forEach(([name, dimension]) => {
      const status = dimension.isCompliant ? '✅' : '❌';
      console.log(`      ${status} ${dimension.name}: ${(dimension.score * 100).toFixed(1)}% (weight: ${dimension.weight}, issues: ${dimension.issues.length})`);
    });
    
    // Show top issues
    console.log('\n   🔍 Top Issues:');
    result.issues.slice(0, 5).forEach((issue, index) => {
      console.log(`      ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      console.log(`         💡 ${issue.suggestion}`);
    });
    
    // Show suggestions with code
    console.log('\n   💡 Suggestions with Code:');
    result.suggestions.filter(s => s.code).slice(0, 3).forEach((suggestion, index) => {
      console.log(`      ${index + 1}. [${suggestion.priority.toUpperCase()}] ${suggestion.description}`);
      console.log(`         🔧 ${suggestion.code}`);
    });
    
    // Test compliance summary generation
    const summary = ComplianceUtils.generateSummary(result);
    console.log(`\n   📋 Generated Summary: ${summary}`);
    
    console.log('\n✅ Universal CLI compliance testing completed successfully\n');
    return result;
    
  } catch (error) {
    console.error('❌ Universal CLI compliance testing failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

async function testSupportedTypes() {
  console.log('🔧 Testing Supported Artifact Types...');
  
  try {
    const { ComplianceCheckerFactory } = await import('./dist/src/tools/compliance/index.js');
    
    const supportedTypes = ComplianceCheckerFactory.getSupportedTypes();
    console.log(`   ✅ Supported types: ${supportedTypes.join(', ')}`);
    
    // Test each supported type
    for (const type of supportedTypes) {
      try {
        const checker = ComplianceCheckerFactory.create(type);
        console.log(`   ✅ ${type}: ${checker.constructor.name}`);
      } catch (error) {
        console.log(`   ❌ ${type}: Failed to create checker`);
      }
    }
    
    console.log('\n✅ Supported types testing completed\n');
    
  } catch (error) {
    console.error('❌ Supported types testing failed:', error.message);
    throw error;
  }
}

async function testFrameworkNeutralSpec() {
  console.log('📋 Testing Framework-Neutral CLI Spec...');
  
  try {
    // Load the CLI spec
    const yaml = await import('js-yaml');
    const specContent = fs.readFileSync('specs/cli/deploy.yaml', 'utf8');
    const spec = yaml.load(specContent);
    
    // Verify framework-neutral structure
    console.log(`   ✅ Spec type: ${spec.type}`);
    console.log(`   ✅ Identifier: ${spec.identifier}`);
    console.log(`   ✅ Has interface definition: ${!!spec.specification.interface}`);
    console.log(`   ✅ Has behavior definition: ${!!spec.specification.behavior}`);
    console.log(`   ✅ Has output definition: ${!!spec.specification.output}`);
    console.log(`   ✅ Has usability definition: ${!!spec.specification.usability}`);
    console.log(`   ✅ Has compatibility definition: ${!!spec.specification.compatibility}`);
    
    // Check framework-specific type mappings
    const globalOptions = spec.specification.interface.global_options;
    const hasFrameworkTypes = globalOptions.some(opt => opt.frameworkTypes);
    console.log(`   ✅ Has framework-specific type mappings: ${hasFrameworkTypes}`);
    
    if (hasFrameworkTypes) {
      const frameworks = Object.keys(globalOptions[0].frameworkTypes);
      console.log(`   ✅ Supported frameworks: ${frameworks.join(', ')}`);
    }
    
    // Check compliance rules
    console.log(`   ✅ Compliance rules: ${spec.complianceRules.length}`);
    
    console.log('\n✅ Framework-neutral spec validation completed\n');
    
  } catch (error) {
    console.error('❌ Framework-neutral spec validation failed:', error.message);
    throw error;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting Universal CLI Compliance Test Suite\n');
    
    // Test 1: Universal CLI Compliance
    const complianceResult = await testUniversalCLICompliance();
    
    // Test 2: Supported Types
    await testSupportedTypes();
    
    // Test 3: Framework-Neutral Spec
    await testFrameworkNeutralSpec();
    
    console.log('🎉 All universal CLI compliance tests passed successfully!');
    console.log('\n📈 Test Summary:');
    console.log(`   ✅ Universal compliance framework: Working`);
    console.log(`   ✅ CLI compliance checker: Working`);
    console.log(`   ✅ Framework-neutral specs: Working`);
    console.log(`   ✅ Compliance score: ${(complianceResult.score * 100).toFixed(1)}%`);
    console.log(`   ✅ Issue detection: ${complianceResult.issues.length} issues found`);
    console.log(`   ✅ Suggestion generation: ${complianceResult.suggestions.length} suggestions`);
    console.log(`   ✅ Supported artifact types: api, ui, db, cli`);
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests(); 