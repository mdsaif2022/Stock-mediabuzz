/**
 * Utility to detect if we're in a build context
 * Used to skip database initialization and other runtime operations during build
 */
export function isBuildTime(): boolean {
  // Check if no PORT is set and we're not on a hosting platform
  const noRuntimeEnv = !process.env.PORT && 
                        !process.env.RENDER && 
                        !process.env.VERCEL;
  
  // Check if vite build is in process.argv
  const hasViteBuild = process.argv.some(arg => 
    arg.includes('vite') || arg.includes('build')
  );
  
  // Check environment variable
  if (process.env.VITE_BUILD === 'true') return true;
  
  return noRuntimeEnv && hasViteBuild;
}

