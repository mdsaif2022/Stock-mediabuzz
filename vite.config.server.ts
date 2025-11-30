import { defineConfig } from "vite";
import path from "path";

// Server build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/node-build.ts"),
      name: "server",
      fileName: "production",
      formats: ["es"],
    },
    outDir: "dist/server",
    target: "node22",
    ssr: true,
    rollupOptions: {
      external: (id) => {
        // Externalize all node_modules packages
        // Packages don't start with . (relative) or / (absolute path)
        if (!id.startsWith('.') && !id.startsWith('/')) {
          // Check if it's a Windows absolute path (C:\ or similar)
          if (path.isAbsolute(id)) {
            return false; // It's an absolute file path, bundle it
          }
          // It's a node_modules package, externalize it
          return true;
        }
        // Relative imports (./ or ../) should be bundled
        return false;
      },
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
      },
    },
    minify: false, // Keep readable for debugging
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
