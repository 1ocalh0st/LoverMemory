import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import mkcert from 'vite-plugin-mkcert'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appUrl = env.APP_URL || 'https://lovermemory.192.168.20.166.sslip.io:5173'
  const apiUrl = env.API_URL || 'http://localhost:3000'
  const appHost = new URL(appUrl).hostname
  const appPort = Number(new URL(appUrl).port || 5173)

  return {
    plugins: [
      vue(),
      mkcert({
        hosts: [appHost]
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons.svg'],
        manifest: {
          name: 'LoverMemory',
          short_name: 'LoverMemory',
          description: 'A private two-person memory capsule.',
          theme_color: '#10131a',
          background_color: '#f4efe8',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/favicon.svg',
              sizes: '512x512',
              type: 'image/svg+xml'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,avif}'],
          globIgnores: ['**/pictures/*'],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'memory-images',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    publicDir: '../../public',
    server: {
      port: appPort,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
