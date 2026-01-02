import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import removeConsole from 'vite-plugin-remove-console'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Retirer console.log en production
    mode === 'production' && removeConsole(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png', 'icons/apple-icon-180.png', 'icons/manifest-icon-*.png'],
      manifest: {
        name: 'Infirmerie Ministère',
        short_name: 'Infirmerie',
        description: 'Gestion de l\'infirmerie du Ministère avec mode offline',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/apple-icon-180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/infirmerie-api\.onrender\.com\/api\/auth\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-auth-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/infirmerie-api\.onrender\.com\/api\/(patients|medicaments|consultations|vaccinations|rendez-vous)\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-data-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 30 // 30 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/infirmerie-api\.onrender\.com\/api\/(rapports|stocks)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-reports-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 15 // 15 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false // Désactivé en DEV pour éviter les problèmes de cache
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
