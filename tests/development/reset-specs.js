// Simple utility to reset the specs file (for testing purposes)
import * as fs from 'fs';
import * as path from 'path';

// Get repo root (assumes script is run from project root)
const repoRoot = process.cwd();
const specPath = path.join(repoRoot, 'carrot-spec.json');

// Create empty array for specs
fs.writeFileSync(specPath, JSON.stringify([], null, 2));
console.log(`Reset specs file at ${specPath} to empty array`); 