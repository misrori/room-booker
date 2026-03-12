import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/room-booker/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pao_logo.png", "robots.txt"],
      manifest: {
        name: "Room Booker",
        short_name: "RoomBooker",
        description: "Ad-hoc meeting room booking app",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        start_url: "/room-booker/",
        orientation: "landscape",
        icons: [
          {
            src: "pao_logo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pao_logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),

    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

