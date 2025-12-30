// Server loader - loads the TypeScript server with tsx support
// This file is .mjs to ensure it's treated as ESM

// Export a function that loads the server
export async function loadServer() {
  // Import tsx to enable TypeScript support (must be done inside async function)
  try {
    await import("tsx");
    console.log("[server-loader] ✅ tsx imported successfully");
  } catch (tsxError) {
    console.error("[server-loader] ❌ Failed to import tsx:", tsxError);
    throw tsxError;
  }
  try {
    console.log("[server-loader] 🚀 Starting server load...");
    
    // Use file URL to properly resolve the server path
    const { pathToFileURL } = await import("url");
    const { resolve } = await import("path");
    const { fileURLToPath } = await import("url");
    
    // Get the directory of this loader file
    const loaderDir = fileURLToPath(new URL(".", import.meta.url));
    const serverPath = resolve(loaderDir, "server/index.ts");
    const serverUrl = pathToFileURL(serverPath).href;
    
    console.log(`[server-loader] 📂 Server path: ${serverPath}`);
    console.log(`[server-loader] 🔗 Server URL: ${serverUrl}`);
    
    console.log(`[server-loader] 📥 Importing server module...`);
    const serverModule = await import(serverUrl);
    console.log(`[server-loader] ✅ Server module imported`);
    
    if (!serverModule) {
      throw new Error("Server module is null or undefined");
    }
    
    if (!serverModule.createServer) {
      console.error("[server-loader] Available exports:", Object.keys(serverModule));
      throw new Error("Server module does not export createServer function");
    }
    
    console.log(`[server-loader] 🏗️  Creating server...`);
    const app = serverModule.createServer();
    
    if (!app) {
      throw new Error("createServer() returned null or undefined");
    }
    
    console.log(`[server-loader] ✅ Server created successfully`);
    return app;
  } catch (error) {
    console.error("[server-loader] ❌ Error loading server:");
    console.error("   Message:", error.message);
    if (error.stack) {
      console.error("   Stack:", error.stack);
    }
    throw error;
  }
}
