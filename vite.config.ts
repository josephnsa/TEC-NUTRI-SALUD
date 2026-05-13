import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest: {
        name: "NutriSalud",
        short_name: "NutriSalud",
        description: "Perfil, mercado keto y cronograma en tu navegador",
        theme_color: "#0f766e",
        background_color: "#f0fdfa",
        display: "standalone",
        orientation: "portrait-primary",
        lang: "es",
        icons: [
          {
            src: "favicon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"]
      }
    })
  ]
});
