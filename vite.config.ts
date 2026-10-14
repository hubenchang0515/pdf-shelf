import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    solid(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'generateSW',
      manifest: {
        name: 'PDF Shelf',
        short_name: 'PDF Shelf',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pdf.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: "any"
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
      workbox: {
        skipWaiting: true,
        navigateFallbackDenylist: [/^\/[^?]+\.(js|css|png|pdf|wasm|json|otf|ttf|xml|txt)$/],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{html,js,css}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => ['.pdf', '.json', '.wasm', '.otf', '.ttf'].some(ext => url.pathname.endsWith(ext)),
            handler: "CacheFirst",
          },
        ]
      },
    }),
  ],
})
