import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { pathToFileURL } from "url";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  ssr: {
    noExternal: [], // Don't bundle any server dependencies
    external: ["nodemailer"], // Treat nodemailer as external - don't try to resolve it
  },
  optimizeDeps: {
    exclude: ["nodemailer", "@types/nodemailer"],
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    // Replace process.env.NODE_ENV with import.meta.env.MODE for client-side code
    'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production'),
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      // Load server using a separate loader file that handles tsx registration
      // This prevents Vite from trying to resolve server dependencies during config evaluation
      const loaderPath = path.resolve(process.cwd(), "server-loader.mjs");
      const loaderUrl = pathToFileURL(loaderPath).href;
      
      try {
        // Use Function constructor to prevent Vite static analysis
        const dynamicImport = new Function('url', 'return import(url)');
        const loaderModule = await dynamicImport(loaderUrl);
        
        if (!loaderModule || !loaderModule.loadServer) {
          throw new Error("Loader module does not export loadServer function");
        }
        
        const app = await loaderModule.loadServer();
        
        if (!app) {
          throw new Error("createServer() returned null or undefined");
        }
        
        // Mount Express app as middleware BEFORE Vite's SPA fallback
        // Express will handle all routes it defines (especially /api/*), Vite handles the rest
        server.middlewares.use(app);
        console.log("✅ Express server loaded successfully");
        console.log("   API routes are now available at /api/*");
        console.log("   Test endpoint: http://localhost:8080/api/ping");
        console.log("   Express app mounted as middleware");
      } catch (error: any) {
        console.error("❌ Failed to load server:", error.message);
        console.error("   Loader path:", loaderPath);
        if (error.stack) {
          console.error("   Stack:", error.stack);
        }
        console.error("   Note: Frontend will work, but API endpoints may not be available");
        console.error("   This will cause 'Unexpected token <' errors when API calls return HTML");
      }
    },
  };
}
