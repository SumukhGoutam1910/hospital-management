// client/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// CommonJS modules can't use top-level await, so we use dynamic import in a function
export default defineConfig(async () => {
  const isReplitDev = process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined;

  const plugins = [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
  ];

  if (isReplitDev) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@shared": path.resolve(__dirname, "../shared"),
        "@assets": path.resolve(__dirname, "../attached_assets"),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
