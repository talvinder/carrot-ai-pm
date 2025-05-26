/**
 * Compliance Framework Index
 * 
 * This module registers all compliance checkers and exports the framework
 */

import { ComplianceCheckerFactory } from './base.js';

// Import all compliance checkers
import { UIComponentComplianceChecker } from './ui-checker.js';
import { DatabaseComplianceChecker } from './db-checker.js';
import { CLIComplianceChecker } from './cli-checker.js';

// Register all compliance checkers
ComplianceCheckerFactory.register('ui', () => new UIComponentComplianceChecker());
ComplianceCheckerFactory.register('db', () => new DatabaseComplianceChecker());
ComplianceCheckerFactory.register('cli', () => new CLIComplianceChecker());

// Re-export everything from base
export * from './base.js'; 