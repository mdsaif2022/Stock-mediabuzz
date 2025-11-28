import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

/**
 * Get the persistent data directory path that works in both development and production.
 * 
 * This ensures data files are stored in a fixed location relative to the project root,
 * not relative to the compiled code location, so data persists across builds.
 */
export function getDataDirectory(): string {
  // Get the project root directory
  // In development: __dirname of this file = server/utils/
  // In production: __dirname of this file = dist/server/utils/
  const __filename = fileURLToPath(import.meta.url);
  const currentDir = dirname(__filename);
  
  // Determine if we're in compiled code (dist/) or source code
  // If path includes 'dist', we need to go up more levels to reach project root
  if (currentDir.includes('dist')) {
    // In production: dist/server/utils/ -> go up 3 levels to project root
    return join(currentDir, "../../../server/data");
  } else {
    // In development: server/utils/ -> go up 1 level to server/, then into data
    return join(currentDir, "../data");
  }
}

/**
 * Alternative method using process.cwd() for absolute project root path
 * This is more reliable across different deployment scenarios
 */
export function getDataDirectoryAbsolute(): string {
  // Use process.cwd() which always returns the working directory (project root)
  // This is the most reliable method
  const projectRoot = process.cwd();
  return join(projectRoot, "server", "data");
}

// Use the absolute method for maximum reliability
export const DATA_DIR = getDataDirectoryAbsolute();

