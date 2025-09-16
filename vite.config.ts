import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist", // where production build goes
    emptyOutDir: true,
  },
  server: {
    port: 3000,        // ✅ run frontend on same port as backend
    strictPort: true,  // fail if port is taken
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:3000",
        ws: true,
      },
    },
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
});
