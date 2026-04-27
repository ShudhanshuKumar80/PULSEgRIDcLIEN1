import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "0.0.0.0",
    port: 5173,

    // ✅ FIX: allow Render domain
    allowedHosts: ["pulsegridclien1.onrender.com"], 
    // OR use this if you want no restrictions:
    // allowedHosts: "all",

    proxy: {
      "/api": {
        target: "https://pulsegridserver2.onrender.com",
        changeOrigin: true,
        secure: true
      },
      "/ws": {
        target: "wss://pulsegridserver2.onrender.com",
        ws: true,
        changeOrigin: true
      }
    }
  }
});
