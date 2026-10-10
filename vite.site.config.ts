import { defineConfig } from "vite";

// Builds the listening pages (the playground and the test pages under site/) as a static site
// into site-dist/, separate from the library build in dist/. `npm run build:site`.
// SITE_BUILD_ID (a commit id, set by a deploy script) is shown in each page's footer.
export default defineConfig({
  build: {
    outDir: "site-dist",
    emptyOutDir: true,
    rollupOptions: { input: { index: "index.html", bench: "site/bench.html", ab: "site/ab.html", comfort: "site/comfort.html", session: "site/session.html" } },
  },
  define: { __BUILD_ID__: JSON.stringify(process.env.SITE_BUILD_ID ?? "dev") },
});
