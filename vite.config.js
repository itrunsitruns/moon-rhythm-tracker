import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icon-192.png", "icon-512.png", "icon-maskable-192.png", "icon-maskable-512.png",
        "icon-192.svg", "icon-512.svg", "apple-touch-icon.svg",
      ],
      manifest: {
        id: "/",
        name: "Moonyou — Moon Rhythm Tracker",
        short_name: "Moonyou",
        description: "Menstrual cycle + fasting + fertility tracker with real lunar phases",
        lang: "zh-Hant",
        dir: "ltr",
        categories: ["health", "lifestyle", "medical"],
        theme_color: "#0A0A0F",
        background_color: "#0A0A0F",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          // PNG icons are required by the Google Play (TWA) packaging tools.
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          // crisp SVG fallback for browsers that prefer it
          { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
});
