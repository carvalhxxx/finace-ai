import { defineConfig } from "vite";
import react            from "@vitejs/plugin-react";
import { VitePWA }      from "vite-plugin-pwa";
import path             from "path";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // registerType: "autoUpdate" → atualiza o SW automaticamente
      // quando uma nova versão do app for publicada
      registerType: "autoUpdate",

      // Arquivos que o Service Worker vai cachear para funcionar offline
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "icons/*.png"],

      // manifest.json — descreve o app para o navegador/iOS
      manifest: {
        name:             "FinanceAI",
        short_name:       "FinanceAI",
        description:      "Seu assistente financeiro pessoal",
        theme_color:      "#22c55e",   // cor da barra de status no Android
        background_color: "#111827",   // cor da splash screen (cinza escuro = gray-900)
        display:          "standalone", // abre sem barra do navegador
        orientation:      "portrait",
        scope:            "/",
        start_url:        "/",

        icons: [
          {
            src:     "/icons/icon-192.png",
            sizes:   "192x192",
            type:    "image/png",
            purpose: "any maskable",
          },
          {
            src:     "/icons/icon-512.png",
            sizes:   "512x512",
            type:    "image/png",
            purpose: "any maskable",
          },
        ],
      },

      // Configuração do Service Worker
      workbox: {
        // Cacheia todos os assets do build
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

        // Estratégia de cache para as requisições ao Supabase:
        // "NetworkFirst" → tenta a rede primeiro, usa cache se offline
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler:    "NetworkFirst",
            options: {
              cacheName:         "supabase-cache",
              expiration: {
                maxEntries:      50,
                maxAgeSeconds:   60 * 60 * 24, // 1 dia
              },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});