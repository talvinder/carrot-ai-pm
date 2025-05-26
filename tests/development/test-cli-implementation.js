#!/usr/bin/env node

/**
 * Sample CLI Implementation for Testing
 * This is a basic implementation of the deploy CLI tool
 */

import { program } from 'commander';

// Configure main command
program
  .name('deploy')
  .description('A deployment CLI tool that manages application deployments')
  .version('1.0.0');

// Add global options
program.option('-h, --help', 'Show help information');
program.option('-V, --version', 'Show version information');
program.option('-v, --verbose', 'Enable verbose output');
program.option('-q, --quiet', 'Suppress output');

// Add subcommands
program
  .command('staging')
  .description('Deploy to staging environment')
  .option('--dry-run', 'Show what would be deployed without actually deploying')
  .action((options) => {
    console.log('Executing staging command with options:', options);
    if (options.dryRun) {
      console.log('This is a dry run - no actual deployment');
    }
    process.exit(0);
  });

program
  .command('production')
  .description('Deploy to production environment')
  .option('--confirm', 'Skip confirmation prompt')
  .action((options) => {
    if (!options.confirm) {
      console.log('Are you sure you want to deploy to production? (y/N): ');
      // In real implementation, would wait for user input
    }
    console.log('Executing production command with options:', options);
    process.exit(0);
  });

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (err) {
  console.error('Error:', err.message);
  process.exit(err.exitCode || 1);
} 