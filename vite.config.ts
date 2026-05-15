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
        id: "./",
        name: "NutriSalud — perfil, mercado y menú",
        short_name: "NutriSalud",
        description: "Perfil, lista de mercado por dieta y menú por días (plantillas o IA) en tu navegador.",
        start_url: "./",
        scope: "./",
        theme_color: "#0d9488",
        background_color: "#f0fdfa",
        display: "standalone",
        display_override: ["standalone", "browser"],
        lang: "es",
        dir: "ltr",
        categories: ["health", "lifestyle", "food"],
        icons: [
          {
            src: "favicon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-ai": ["@google/generative-ai"]
        }
      }
    }
  }
});
