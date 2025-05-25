import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Helper to get the directory name, equivalent to __dirname in CommonJS
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Gets the project root directory from explicit configuration only.
 * Requires either CARROT_PROJECT_ROOT environment variable or --project-root CLI argument.
 * Throws an error if neither is provided or if the path is invalid.
 */
export function getProjectRoot(): string {
  // First, check for CARROT_PROJECT_ROOT environment variable
  const envProjectRoot = process.env.CARROT_PROJECT_ROOT;
  if (envProjectRoot) {
    const resolvedPath = path.resolve(envProjectRoot);
    try {
      // Validate that the path exists and is a directory
      const stats = fs.statSync(resolvedPath);
      if (stats.isDirectory()) {
        console.error(`[CarrotMCP] Using project root from CARROT_PROJECT_ROOT: ${resolvedPath}`);
        return resolvedPath;
      } else {
        console.error(`[CarrotMCP Error] CARROT_PROJECT_ROOT path is not a directory: ${resolvedPath}`);
      }
    } catch (error) {
      console.error(`[CarrotMCP Error] CARROT_PROJECT_ROOT path does not exist or is not accessible: ${resolvedPath}`);
    }
  }

  // Second, check for --project-root CLI argument
  const args = process.argv;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Check for --project-root=<path> format
    if (arg.startsWith('--project-root=')) {
      const cliPath = arg.substring('--project-root='.length);
      const resolvedPath = path.resolve(cliPath);
      try {
        const stats = fs.statSync(resolvedPath);
        if (stats.isDirectory()) {
          console.error(`[CarrotMCP] Using project root from CLI argument: ${resolvedPath}`);
          return resolvedPath;
        } else {
          console.error(`[CarrotMCP Error] CLI --project-root path is not a directory: ${resolvedPath}`);
        }
      } catch (error) {
        console.error(`[CarrotMCP Error] CLI --project-root path does not exist or is not accessible: ${resolvedPath}`);
      }
    }
    
    // Check for --project-root <path> format (space-separated)
    if (arg === '--project-root' && i + 1 < args.length) {
      const cliPath = args[i + 1];
      const resolvedPath = path.resolve(cliPath);
      try {
        const stats = fs.statSync(resolvedPath);
        if (stats.isDirectory()) {
          console.error(`[CarrotMCP] Using project root from CLI argument: ${resolvedPath}`);
          return resolvedPath;
        } else {
          console.error(`[CarrotMCP Error] CLI --project-root path is not a directory: ${resolvedPath}`);
        }
      } catch (error) {
        console.error(`[CarrotMCP Error] CLI --project-root path does not exist or is not accessible: ${resolvedPath}`);
      }
    }
  }

  // No valid project root found - throw error
  const errorMessage = "[CarrotMCP Critical Error] Project root not configured or invalid. Please set the 'CARROT_PROJECT_ROOT' environment variable OR use the '--project-root <absolute_path>' command-line argument in your MCP client's server configuration to specify the absolute path to your project.";
  console.error(errorMessage);
  throw new Error(errorMessage);
}

/**
 * Alias for getProjectRoot to maintain backward compatibility
 * @deprecated Use getProjectRoot instead
 */
export const getRepoRoot = getProjectRoot;

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