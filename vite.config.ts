import { defineConfig } from "vitest/config";

// `vite` serves the playground (index.html at the root); `vite build` builds the library.
export default defineConfig(({ command }) => ({
  build: command === "build" ? {
    lib: { entry: "src/index.ts", formats: ["es"], fileName: "index" },
    sourcemap: true,
    emptyOutDir: false,
  } : undefined,
  define: { __BUILD_ID__: JSON.stringify("dev") },
  test: { include: ["tests/**/*.test.ts"] },
}));
