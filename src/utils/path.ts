import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Gets the repository root directory by running git commands
 */
export function getRepoRoot(): string {
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', { 
      encoding: 'utf-8', 
      stdio: ['ignore', 'pipe', 'ignore'] 
    }).trim();
    
    return gitRoot;
  } catch (error) {
    // If git command fails, use the current directory
    console.warn('Could not determine git repository root, using current directory');
    return process.cwd();
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