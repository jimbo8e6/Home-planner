import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'HomeBase',
        short_name: 'HomeBase',
        description: 'Your home, organised — fridge, shopping, finances and more.',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-72.png',  sizes: '72x72',   type: 'image/png' },
          { src: '/icon-96.png',  sizes: '96x96',   type: 'image/png' },
          { src: '/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icon-152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache MealDB recipe images
            urlPattern: /^https:\/\/www\.themealdb\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mealdb-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
})
