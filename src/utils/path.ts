import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Helper to get the directory name, equivalent to __dirname in CommonJS
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Gets the repository root directory by running git commands
 */
export function getRepoRoot(): string {
  try {
    // Use the directory of the current file as a known point
    // within the project structure to reliably run the git command.
    // path.ts is in src/utils/, so projectDir is two levels up.
    const projectDir = path.resolve(__dirname, '..', '..'); 

    const gitRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      cwd: projectDir // Execute 'git' command from the project directory
    }).trim();
    
    return gitRoot;
  } catch (error) {
    console.error('Error trying to determine git repository root:', error);
    const currentProcessCwd = process.cwd();
    // Note: Using __dirname in the log here will now work because we've defined it above.
    console.warn(`Could not determine git repository root via 'git rev-parse --show-toplevel' from ${path.resolve(__dirname, '..', '..')}. Falling back to current process CWD: ${currentProcessCwd}`);
    return currentProcessCwd;
  }
}

/**
 * Checks if a file path is within the repository
 */
export function isPathInRepo(filePath: string, repoRoot: string): boolean {
  const absolutePath = path.resolve(filePath);
  const normalizedRepoRoot = path.resolve(repoRoot);
  
  return absolutePath.startsWith(normalizedRepoRoot);
}

/**
 * Safely resolves a path within the repository
 */
export function resolveRepoPath(relativePath: string, repoRoot: string): string {
  const resolvedPath = path.resolve(repoRoot, relativePath);
  
  if (!isPathInRepo(resolvedPath, repoRoot)) {
    throw new Error(`Path ${relativePath} resolves outside of repository`);
  }
  
  return resolvedPath;
}

/**
 * Checks if a file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
} 