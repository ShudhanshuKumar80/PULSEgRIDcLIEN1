import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": "https://pulsegridserver2.onrender.com/",
      "/ws": {
        target: "wss://pulsegridserver2.onrender.com/",
        ws: true
      }
    }
  }
});
