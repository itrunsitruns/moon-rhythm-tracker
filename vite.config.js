import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// On GitHub Pages the app is served from /<repo>/; everywhere else (local
// dev, Vercel, Netlify, the eventual TWA/Play build) it's served from root.
const base = process.env.GITHUB_PAGES ? "/moon-rhythm-tracker/" : "/";

// src/data/references.json keeps a developer-only field (how_to_use_in_app_zh:
// how each source may be used in copy). It is never shown, so it is also kept
// out of the shipped bundle. The source file itself stays untouched.
function stripDevOnlyReferenceNotes() {
  return {
    name: "strip-dev-only-reference-notes",
    enforce: "pre",
    transform(code, id) {
      if (!id.replace(/\\/g, "/").endsWith("/src/data/references.json")) return null;
      const refs = JSON.parse(code).map(({ how_to_use_in_app_zh, ...rest }) => rest);
      return { code: JSON.stringify(refs), map: null };
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    stripDevOnlyReferenceNotes(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icon-192.png", "icon-512.png", "icon-maskable-192.png", "icon-maskable-512.png",
        "icon-192.svg", "icon-512.svg", "apple-touch-icon.svg",
      ],
      manifest: {
        id: base,
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
        scope: base,
        start_url: base,
        icons: [
          // PNG icons are required by the Google Play (TWA) packaging tools.
          { src: `${base}icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
          { src: `${base}icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
          { src: `${base}icon-maskable-192.png`, sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: `${base}icon-maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
          // crisp SVG fallback for browsers that prefer it
          { src: `${base}icon-512.svg`, sizes: "512x512", type: "image/svg+xml", purpose: "any" },
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
