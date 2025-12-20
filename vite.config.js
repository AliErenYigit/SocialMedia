import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080", // ✅ gateway
        changeOrigin: true,
      },
      "/files": {
        target: "http://localhost:8087", // ✅ image-service files
        changeOrigin: true,
      },
    },
  },
});
